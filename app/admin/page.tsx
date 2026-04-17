"use client";

import { useState, useEffect } from 'react';
import { 
  Camera, 
  Loader2, 
  Wine as WineIcon, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  X, 
  Plus, 
  Minus, 
  LogOut,
  Save,
  ExternalLink
} from 'lucide-react';

export default function AdminPage() {
  const [auth, setAuth] = useState({ id: '', pass: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialWineState = {
    id: '', name_jp: '', name_en: '', country: '', region: '', 
    grape: '', type: '赤 / フルボディ', vintage: '', price: '', cost: '', 
    stock: '0', advice: '', image: ''
  };

  const [newWine, setNewWine] = useState(initialWineState);

  useEffect(() => {
    const savedId = localStorage.getItem('wine_store_id');
    const savedPass = localStorage.getItem('wine_store_pass');
    if (savedId && savedPass) {
      setAuth({ id: savedId, pass: savedPass });
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => { 
    if (isLoggedIn) fetchWines(); 
  }, [isLoggedIn]);

  const fetchWines = async () => {
    try {
      const res = await fetch(`/api/wines`, { 
        headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass } 
      });
      if (res.ok) {
        const data = await res.json();
        setWines(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("データ取得失敗:", e);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (auth.id.length < 3 || auth.pass.length < 4) {
      return alert("IDは3文字以上、パスワードは4文字以上で設定してください");
    }
    localStorage.setItem('wine_store_id', auth.id);
    localStorage.setItem('wine_store_pass', auth.pass);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    if (confirm("ログアウトしますか？")) {
      localStorage.clear();
      location.reload();
    }
  };

  const updateStock = async (wine: any, delta: number) => {
    const updated = { ...wine, stock: String(Math.max(0, (parseInt(wine.stock) || 0) + delta)) };
    const res = await fetch('/api/wines', { 
      method: 'POST', 
      headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass }, 
      body: JSON.stringify(updated) 
    });
    if (res.ok) fetchWines();
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      
      if (!uploadRes.ok) throw new Error(uploadData.error || "アップロード失敗");
      
      const imageUrl = uploadData.url;
      setNewWine(prev => ({ ...prev, image: imageUrl }));

      const scanRes = await fetch('/api/scan', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl }) 
      });
      
      const scanData = await scanRes.json();
      if (!scanRes.ok || !scanData.result) throw new Error(scanData.error || "AI解析失敗");

      const ai = JSON.parse(scanData.result);

      setNewWine(prev => ({
        ...prev,
        name_jp: ai.name_jp || prev.name_jp,
        name_en: ai.name_en || prev.name_en,
        country: ai.country || prev.country,
        region: ai.region || prev.region,
        grape: ai.grape || prev.grape,
        type: ai.type || prev.type,
        vintage: String(ai.vintage || prev.vintage),
        price: String(ai.price || prev.price),
        advice: ai.advice || prev.advice,
      }));

    } catch (err: any) { 
      alert("解析エラー: " + err.message); 
    } finally { 
      setLoading(false); 
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!newWine.name_jp) return alert("ワイン名は必須です");
    setLoading(true);
    try {
      const res = await fetch('/api/wines', { 
        method: 'POST', 
        headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass }, 
        body: JSON.stringify(newWine) 
      });
      if (res.ok) {
        setNewWine(initialWineState);
        setEditingId(null);
        fetchWines();
        alert("保存しました");
      }
    } catch (e) {
      alert("通信エラー");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = "カタカナ名,アルファベット,国,産地,品種,タイプ,年,販売価格,在庫,オススメ解説\n";
    const rows = wines.map((w: any) => 
      `"${w.name_jp}","${w.name_en}","${w.country}","${w.region}","${w.grape}","${w.type}","${w.vintage}","${w.price}","${w.stock}","${(w.advice||'').replace(/"/g,'""')}"`
    ).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `wine_list.csv`;
    link.click();
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0e12] p-6">
        <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl border-4 border-[#c5a059]">
          <h1 className="text-3xl font-black mb-8 text-center text-black">WINE ADMIN</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="店舗ID" value={auth.id} onChange={e => setAuth({...auth, id: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-bold border-2 outline-none text-black" required />
            <input type="password" placeholder="パスワード" value={auth.pass} onChange={e => setAuth({...auth, pass: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-bold border-2 outline-none text-black" required />
            <button className="w-full bg-black text-white py-5 rounded-2xl font-black text-lg">ログイン</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-slate-50 min-h-screen text-black pb-24 font-sans">
      <div className="flex justify-between items-center py-6">
        <h1 className="text-2xl font-black text-black">Store #{auth.id}</h1>
        <button onClick={handleLogout} className="p-3 bg-white border rounded-2xl text-slate-400"><LogOut size={20}/></button>
      </div>

      <div className="sticky top-0 z-30 py-4 bg-slate-50/90 backdrop-blur">
        <label className="bg-black text-white w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 cursor-pointer">
          {loading ? <Loader2 className="animate-spin" /> : <Camera size={24}/>}
          <span className="text-lg">ラベルを撮ってAI分析</span>
          <input type="file" accept="image/*" capture="environment" onChange={handleScan} className="hidden" disabled={loading} />
        </label>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 mb-8 space-y-6 mt-4">
        <div className="aspect-[3/4] bg-slate-100 rounded-3xl overflow-hidden flex items-center justify-center relative">
          {newWine.image ? <img src={newWine.image} className="w-full h-full object-cover" /> : <WineIcon className="text-slate-200" size={64}/>}
          {loading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="text-white animate-spin" size={40} /></div>}
        </div>

        <div className="space-y-4">
          <input type="text" placeholder="ワイン名（カタカナ）" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold border-2 border-slate-100 text-black" />
          <input type="text" placeholder="English Name" value={newWine.name_en} onChange={e => setNewWine({...newWine, name_en: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold border-2 border-slate-100 text-black" />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="国" value={newWine.country} onChange={e => setNewWine({...newWine, country: e.target.value})} className="p-4 bg-slate-50 rounded-xl font-bold border-2 border-slate-100 text-black" />
            <input type="text" placeholder="産地" value={newWine.region} onChange={e => setNewWine({...newWine, region: e.target.value})} className="p-4 bg-slate-50 rounded-xl font-bold border-2 border-slate-100 text-black" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input type="number" placeholder="売価" value={newWine.price} onChange={e => setNewWine({...newWine, price: e.target.value})} className="p-3 bg-amber-50 rounded-xl font-bold border-2 border-amber-100 text-black" />
            <input type="number" placeholder="仕入" value={newWine.cost} onChange={e => setNewWine({...newWine, cost: e.target.value})} className="p-3 bg-slate-50 rounded-xl font-bold border-2 border-slate-100 text-black" />
            <input type="number" placeholder="在庫" value={newWine.stock} onChange={e => setNewWine({...newWine, stock: e.target.value})} className="p-3 bg-green-50 rounded-xl font-bold border-2 border-green-100 text-black" />
          </div>
          <textarea placeholder="オススメ解説" value={newWine.advice} onChange={e => setNewWine({...newWine, advice: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold h-24 border-2 border-slate-100 text-black" />
        </div>

        <button onClick={handleSave} disabled={loading} className="w-full bg-black text-white py-6 rounded-3xl font-black text-xl shadow-2xl flex items-center justify-center gap-2">
          <Save size={24}/> {editingId ? '台帳を更新' : '新しく登録'}
        </button>
      </div>

      <div className="space-y-3">
        {wines.map((wine: any) => (
          <div key={wine.id} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm border border-slate-100">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 flex-shrink-0">
              {wine.image ? <img src={wine.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><WineIcon size={24}/></div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm truncate text-black">{wine.name_jp}</p>
              <p className="text-[10px] font-bold text-amber-600">¥{Number(wine.price).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100">
              <button onClick={() => updateStock(wine, -1)} className="p-1.5 text-slate-400"><Minus size={18}/></button>
              <span className="font-black text-lg w-7 text-center text-black">{wine.stock}</span>
              <button onClick={() => updateStock(wine, 1)} className="p-1.5 text-slate-400"><Plus size={18}/></button>
            </div>
            <button onClick={() => {setNewWine(wine); setEditingId(wine.id); window.scrollTo({top: 0, behavior: 'smooth'});}} className="p-2.5 text-slate-300"><Edit3 size={20}/></button>
          </div>
        ))}
      </div>
      
      <div className="mt-12 p-8 bg-slate-900 text-white rounded-[3rem] shadow-2xl">
        <p className="text-[10px] font-black opacity-50 uppercase tracking-[0.3em] mb-3">Your Menu URL</p>
        <p className="text-xs font-mono break-all font-bold text-[#c5a059] italic mb-6">https://{typeof window !== 'undefined' ? window.location.hostname : ''}/{auth.id}</p>
        <a href={`/${auth.id}`} target="_blank" className="inline-flex items-center gap-2 bg-white/10 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition hover:bg-white/20">
          メニュー表示 <ExternalLink size={14}/>
        </a>
      </div>
    </div>
  );
}
