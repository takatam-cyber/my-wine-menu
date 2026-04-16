"use client";

import { useState, useEffect } from 'react';
import { Camera, Loader2, Wine as WineIcon, Trash2, Edit3, Download, Upload, X, Plus, Minus, LogOut } from 'lucide-react';

export default function AdminPage() {
  const [auth, setAuth] = useState({ id: '', pass: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // 全12項目（スプレッドシート完全準拠）
  const [newWine, setNewWine] = useState({
    id: '', name_jp: '', name_en: '', country: '', region: '', 
    grape: '', type: '赤 / フルボディ', vintage: '', price: '', cost: '', 
    stock: '0', advice: '', image: ''
  });

  // ログイン情報の復元
  useEffect(() => {
    const savedId = localStorage.getItem('wine_store_id');
    const savedPass = localStorage.getItem('wine_store_pass');
    if (savedId && savedPass) {
      setAuth({ id: savedId, pass: savedPass });
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => { if (isLoggedIn) fetchWines(); }, [isLoggedIn]);

  // データ取得
  const fetchWines = async () => {
    try {
      const res = await fetch(`/api/wines`, { 
        headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass } 
      });
      if (res.ok) setWines(await res.json());
    } catch (e) { console.error("データ取得失敗"); }
  };

  // ログイン処理
  const handleLogin = (e: any) => {
    e.preventDefault();
    if (auth.id.length < 3 || auth.pass.length < 4) return alert("IDは3文字以上、パスは4文字以上で設定してください");
    localStorage.setItem('wine_store_id', auth.id);
    localStorage.setItem('wine_store_pass', auth.pass);
    setIsLoggedIn(true);
  };

  // 在庫クイック更新
  const updateStock = async (wine: any, delta: number) => {
    const updated = { ...wine, stock: String(Math.max(0, (parseInt(wine.stock) || 0) + delta)) };
    await fetch('/api/wines', { 
      method: 'POST', 
      headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass }, 
      body: JSON.stringify(updated) 
    });
    fetchWines();
  };

  // AIラベル分析 (Gemini 3 思考モード呼び出し)
  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      // 1. 画像アップロード
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const { url } = await uploadRes.json();
      setNewWine(prev => ({ ...prev, image: url }));

      // 2. Gemini 3 分析
      const scanRes = await fetch('/api/scan', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: url }) 
      });
      
      const scanData = await scanRes.json();
      if (!scanRes.ok) throw new Error(scanData.error || "AI分析に失敗しました");

      const ai = JSON.parse(scanData.result);

      // AIの結果を各項目にセット
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
    } catch (e: any) { 
      alert("エラー: " + e.message); 
    } finally { 
      setLoading(false); 
    }
  };

  // 保存処理
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

  // CSVリセット取込
  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !confirm("【警告】現在の全データを削除し、CSVの内容でリセット上書きしますか？")) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      setLoading(true);
      try {
        // 全削除
        for (const w of wines) {
          await fetch('/api/wines', { 
            method: 'DELETE', 
            headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass }, 
            body: JSON.stringify({ id: w.id }) 
          });
        }
        // CSVパース & 登録
        const rows = (event.target?.result as string).split(/\r?\n/).slice(1);
        for (let row of rows) {
          if (!row.trim()) continue;
          const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"')) || [];
          if (cols.length >= 12) {
            await fetch('/api/wines', { 
              method: 'POST', 
              headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass }, 
              body: JSON.stringify({ 
                id: cols[0], name_jp: cols[1], name_en: cols[2], country: cols[3], region: cols[4], 
                grape: cols[5], type: cols[6], vintage: cols[7], price: cols[8], cost: cols[9], 
                stock: cols[10], advice: cols[11], image: cols[12] || ''
              }) 
            });
          }
        }
        fetchWines();
        alert("リセット取込が完了しました");
      } catch (err) { alert("取込エラー"); } finally { setLoading(false); }
    };
    reader.readAsText(file);
  };

  // CSV出力
  const exportCSV = () => {
    const headers = "番号,カタカナ名,アルファベット,国,産地,品種,タイプ,年,販売価格,仕入れ値,在庫,オススメ解説,画像URL\n";
    const rows = wines.map((w: any) => `"${w.id}","${w.name_jp}","${w.name_en}","${w.country}","${w.region}","${w.grape}","${w.type}","${w.vintage}","${w.price}","${w.cost}","${w.stock}","${(w.advice||'').replace(/"/g,'""')}","${w.image}"`).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${auth.id}_wine_list.csv`;
    link.click();
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0e12] p-6 text-black">
        <div className="bg-white p-10 rounded-[3rem] w-full max-w-sm shadow-2xl border-4 border-[#c5a059]">
          <h1 className="text-3xl font-black mb-2 text-center">WINE ADMIN</h1>
          <p className="text-center text-slate-400 text-[10px] mb-8 uppercase font-bold tracking-widest">Store Multi-Tenant Login</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="店舗ID" value={auth.id} onChange={e => setAuth({...auth, id: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-black border-2 focus:border-black outline-none" required />
            <input type="password" placeholder="パスワード" value={auth.pass} onChange={e => setAuth({...auth, pass: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-black border-2 focus:border-black outline-none" required />
            <button className="w-full bg-black text-white py-5 rounded-2xl font-black text-lg active:scale-95 transition shadow-lg">ログイン</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-slate-50 min-h-screen text-black pb-24 font-sans">
      <div className="flex justify-between items-center py-4 px-2">
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Store Master</span>
          <h1 className="text-2xl font-black text-black">#{auth.id}</h1>
        </div>
        <button onClick={() => { localStorage.clear(); location.reload(); }} className="p-3 bg-white border rounded-2xl text-slate-300 shadow-sm"><LogOut/></button>
      </div>

      <div className="sticky top-0 z-30 py-4 bg-slate-50/90 backdrop-blur">
        <label className="bg-black text-white w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all cursor-pointer">
          {loading ? <Loader2 className="animate-spin" /> : <Camera size={24}/>}
          <span className="text-lg">ラベルを撮って分析</span>
          <input type="file" accept="image/*" capture="environment" onChange={handleScan} className="hidden" />
        </label>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-md border border-slate-200 mb-8 space-y-6">
        <div className="flex justify-between items-center">
           <span className="text-slate-400 font-black text-[10px]">ID: {newWine.id ? `#${newWine.id}` : 'NEW'}</span>
           {editingId && <button onClick={() => {setEditingId(null); setNewWine({id:'',name_jp:'',name_en:'',country:'',region:'',grape:'',type:'赤 / フルボディ',vintage:'',price:'',cost:'',stock:'0',advice:'',image:''})}} className="p-2 bg-slate-100 rounded-full"><X size={16}/></button>}
        </div>

        <div className="aspect-[3/4] bg-slate-100 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center border-2 border-slate-50">
          {newWine.image ? <img src={newWine.image} className="w-full h-full object-cover" /> : <WineIcon className="text-slate-200" size={64}/>}
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-black uppercase ml-1">カタカナ名</label>
            <input type="text" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black text-lg border-2 border-slate-100 outline-none focus:border-black" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-black uppercase ml-1">Alphabet Name</label>
            <input type="text" value={newWine.name_en} onChange={e => setNewWine({...newWine, name_en: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100 outline-none focus:border-black" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="国" value={newWine.country} onChange={e => setNewWine({...newWine, country: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100 outline-none focus:border-black" />
            <input type="text" placeholder="産地" value={newWine.region} onChange={e => setNewWine({...newWine, region: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100 outline-none focus:border-black" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="品種" value={newWine.grape} onChange={e => setNewWine({...newWine, grape: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100 outline-none focus:border-black" />
            <input type="text" placeholder="タイプ" value={newWine.type} onChange={e => setNewWine({...newWine, type: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100 outline-none focus:border-black" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-amber-600 ml-1">売価</label>
              <input type="number" value={newWine.price} onChange={e => setNewWine({...newWine, price: e.target.value})} className="w-full p-3 bg-amber-50 rounded-xl text-black font-black border-2 border-amber-100 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 ml-1">仕入</label>
              <input type="number" value={newWine.cost} onChange={e => setNewWine({...newWine, cost: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-green-600 ml-1">在庫</label>
              <input type="number" value={newWine.stock} onChange={e => setNewWine({...newWine, stock: e.target.value})} className="w-full p-3 bg-green-50 rounded-xl text-black font-black border-2 border-green-100 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-1 space-y-1">
              <label className="text-[10px] font-black text-black ml-1 uppercase">Year</label>
              <input type="text" value={newWine.vintage} onChange={e => setNewWine({...newWine, vintage: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100 outline-none" />
            </div>
            <div className="col-span-3 space-y-1">
              <label className="text-[10px] font-black text-indigo-600 ml-1 uppercase">Sommelier Advice</label>
              <textarea value={newWine.advice} onChange={e => setNewWine({...newWine, advice: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black h-24 border-2 border-slate-100 outline-none focus:border-black" />
            </div>
          </div>
        </div>

        <button onClick={handleSave} className="w-full bg-black text-white py-6 rounded-3xl font-black text-xl shadow-2xl active:scale-95 transition-all">保存して台帳を更新</button>
      </div>

      <div className="flex gap-2 mb-12 px-1">
        <button onClick={exportCSV} className="flex-1 bg-white border border-slate-200 py-4 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 shadow-sm"><Download size={16}/> CSV出力</button>
        <label className="flex-1 bg-white border border-slate-200 py-4 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 shadow-sm cursor-pointer">
          <Upload size={16}/> CSVリセット取込 <input type="file" onChange={importCSV} className="hidden" />
        </label>
      </div>

      <div className="space-y-3">
        {wines.map((wine: any) => (
          <div key={wine.id} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm border border-slate-100">
            <img src={wine.image} className="w-16 h-16 rounded-2xl object-cover shadow-inner" />
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm truncate text-black">#{wine.id} {wine.name_jp}</p>
              <p className="text-[10px] font-black text-amber-600">¥{Number(wine.price).toLocaleString()} <span className="text-slate-300 ml-1 font-bold tracking-tighter">Cost ¥{Number(wine.cost).toLocaleString()}</span></p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
              <button onClick={() => updateStock(wine, -1)} className="p-1"><Minus size={18} className="text-slate-400"/></button>
              <span className={`font-black text-lg w-6 text-center ${parseInt(wine.stock) <= 0 ? 'text-red-500' : 'text-black'}`}>{wine.stock}</span>
              <button onClick={() => updateStock(wine, 1)} className="p-1"><Plus size={18} className="text-slate-400"/></button>
            </div>
            <button onClick={() => {setNewWine(wine); setEditingId(wine.id); window.scrollTo({top:0, behavior:'smooth'})}} className="p-2 text-slate-300 hover:text-black transition-colors"><Edit3 size={20}/></button>
          </div>
        ))}
      </div>
      
      <div className="mt-12 p-8 bg-slate-900 text-white rounded-[3rem] shadow-2xl">
        <p className="text-[10px] font-black opacity-50 uppercase tracking-[0.3em] mb-3">Customer Menu URL</p>
        <p className="text-xs font-mono break-all font-bold select-all leading-relaxed text-[#c5a059] italic">https://my-wine-menu.pages.dev/{auth.id}</p>
      </div>
    </div>
  );
}
