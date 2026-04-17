"use client";
import { useState, useEffect } from 'react';
import { Camera, Loader2, Wine as WineIcon, Trash2, Edit3, Download, Upload, X, Plus, Minus, LogOut } from 'lucide-react';

export default function AdminPage() {
  const [auth, setAuth] = useState({ id: '', pass: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [newWine, setNewWine] = useState({
    id: '', name_jp: '', name_en: '', country: '', region: '', 
    grape: '', type: '赤 / フルボディ', vintage: '', price: '', cost: '', 
    stock: '0', advice: '', image: ''
  });

  useEffect(() => {
    const savedId = localStorage.getItem('wine_store_id');
    const savedPass = localStorage.getItem('wine_store_pass');
    if (savedId && savedPass) {
      setAuth({ id: savedId, pass: savedPass });
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => { if (isLoggedIn) fetchWines(); }, [isLoggedIn]);

  const fetchWines = async () => {
    try {
      const res = await fetch(`/api/wines`, { 
        headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass } 
      });
      if (res.ok) setWines(await res.json());
    } catch (e) { console.error("データ取得失敗"); }
  };

  const handleLogin = (e: any) => {
    e.preventDefault();
    if (auth.id.length < 3 || auth.pass.length < 4) return alert("IDは3文字以上、パスは4文字以上で設定してください");
    localStorage.setItem('wine_store_id', auth.id);
    localStorage.setItem('wine_store_pass', auth.pass);
    setIsLoggedIn(true);
  };

  const updateStock = async (wine: any, delta: number) => {
    const updated = { ...wine, stock: String(Math.max(0, (parseInt(wine.stock) || 0) + delta)) };
    await fetch('/api/wines', { 
      method: 'POST', 
      headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass }, 
      body: JSON.stringify(updated) 
    });
    fetchWines();
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const { url } = await uploadRes.json();
      setNewWine(prev => ({ ...prev, image: url }));

      const scanRes = await fetch('/api/scan', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: url }) 
      });
      
      const scanData = await scanRes.json();
      const ai = JSON.parse(scanData.result);

      setNewWine(prev => ({
        ...prev,
        name_jp: ai.name_jp || '',
        name_en: ai.name_en || '',
        country: ai.country || '',
        region: ai.region || '',
        grape: ai.grape || '',
        type: ai.type || '赤 / フルボディ',
        vintage: String(ai.vintage || ''),
        price: String(ai.price || ''),
        cost: String(ai.cost || ''),
        advice: ai.advice || '',
        image: url
      }));
    } catch (e: any) { alert("エラー: " + e.message); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    await fetch('/api/wines', { 
      method: 'POST', 
      headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass }, 
      body: JSON.stringify(newWine) 
    });
    setNewWine({ id:'', name_jp:'', name_en:'', country:'', region:'', grape:'', type:'赤 / フルボディ', vintage:'', price:'', cost:'', stock:'0', advice:'', image:'' });
    setEditingId(null);
    fetchWines();
    alert("台帳を保存・更新しました");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0e12] p-6 text-black">
        <div className="bg-white p-10 rounded-[3rem] w-full max-w-sm shadow-2xl border-4 border-[#c5a059]">
          <h1 className="text-3xl font-black mb-2 text-center">WINE ADMIN</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="店舗ID" value={auth.id} onChange={e => setAuth({...auth, id: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-black border-2 outline-none" required />
            <input type="password" placeholder="パスワード" value={auth.pass} onChange={e => setAuth({...auth, pass: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-black border-2 outline-none" required />
            <button className="w-full bg-black text-white py-5 rounded-2xl font-black text-lg">ログイン</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-slate-50 min-h-screen text-black pb-24">
      <div className="flex justify-between items-center py-4">
        <h1 className="text-2xl font-black">Store #{auth.id}</h1>
        <button onClick={() => { localStorage.clear(); location.reload(); }}><LogOut/></button>
      </div>

      <div className="sticky top-0 z-30 py-4 bg-slate-50/90 backdrop-blur">
        <label className="bg-black text-white w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 cursor-pointer">
          {loading ? <Loader2 className="animate-spin" /> : <Camera size={24}/>}
          <span>ラベルを撮って分析</span>
          <input type="file" accept="image/*" capture="environment" onChange={handleScan} className="hidden" />
        </label>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-md space-y-6 mb-8">
        <div className="aspect-[3/4] bg-slate-100 rounded-3xl overflow-hidden flex items-center justify-center">
          {newWine.image ? <img src={newWine.image} className="w-full h-full object-cover" /> : <WineIcon className="text-slate-200" size={64}/>}
        </div>
        <input type="text" placeholder="カタカナ名" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-black" />
        {/* ... (他の入力フォームも同様に配置) ... */}
        <button onClick={handleSave} className="w-full bg-black text-white py-6 rounded-3xl font-black text-xl">保存</button>
      </div>

      <div className="space-y-3">
        {wines.map((wine: any) => (
          <div key={wine.id} className="bg-white p-4 rounded-3xl flex items-center gap-4 border border-slate-100">
            <img src={wine.image} className="w-16 h-16 rounded-2xl object-cover" />
            <div className="flex-1">
              <p className="font-black text-sm">{wine.name_jp}</p>
              <p className="text-xs text-amber-600">¥{Number(wine.price).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl">
              <button onClick={() => updateStock(wine, -1)}><Minus size={16}/></button>
              <span className="font-black">{wine.stock}</span>
              <button onClick={() => updateStock(wine, 1)}><Plus size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}