"use client";

import { useState, useEffect } from 'react';
import { Camera, Save, Loader2, Wine as WineIcon, Trash2, Edit3, Download, Upload, X, Plus, Minus, LogOut } from 'lucide-react';

export default function AdminPage() {
  const [auth, setAuth] = useState({ id: '', pass: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newWine, setNewWine] = useState({
    id: '', name_jp: '', name_en: '', country: '', region: '', grape: '', type: '赤', 
    vintage: '', price: '', cost: '', stock: '0', advice: '', image: ''
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
    const res = await fetch(`/api/wines`, {
      headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass }
    });
    if (res.ok) setWines(await res.json());
  };

  const handleLogin = (e: any) => {
    e.preventDefault();
    if (auth.id.length < 3 || auth.pass.length < 4) return alert("IDは3文字、パスは4文字以上で");
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
      const { url } = await (await fetch('/api/upload', { method: 'POST', body: formData })).json();
      setNewWine(prev => ({ ...prev, image: url }));

      const scanRes = await fetch('/api/scan', { method: 'POST', body: JSON.stringify({ image: url }) });
      const data = await scanRes.json();
      const extractedName = String(data.result).replace(/Producer Name:|Vintage:/gi, '').trim();
      const extractedYear = String(data.result).match(/\d{4}/)?.[0] || '';
      setNewWine(prev => ({ ...prev, name_en: extractedName, vintage: extractedYear }));
    } catch (e) { alert("スキャン失敗"); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    await fetch('/api/wines', {
      method: 'POST',
      headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass },
      body: JSON.stringify(newWine)
    });
    setNewWine({ id:'', name_jp:'', name_en:'', country:'', region:'', grape:'', type:'赤', vintage:'', price:'', cost:'', stock:'0', advice:'', image:'' });
    setEditingId(null);
    fetchWines();
    alert("保存完了");
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !confirm("現在の全データを削除し、CSVで上書きリセットしますか？")) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      setLoading(true);
      for (const w of wines) {
        await fetch('/api/wines', { method: 'DELETE', headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass }, body: JSON.stringify({ id: w.id }) });
      }
      const rows = (event.target?.result as string).split(/\r?\n/).slice(1);
      for (let row of rows) {
        if (!row.trim()) continue;
        const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"')) || [];
        if (cols.length >= 12) {
          await fetch('/api/wines', { method: 'POST', headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass }, body: JSON.stringify({ 
            id: cols[0], name_jp: cols[1], name_en: cols[2], country: cols[3], region: cols[4], grape: cols[5], type: cols[6], vintage: cols[7], price: cols[8], cost: cols[9], stock: cols[10], advice: cols[11], image: cols[12] || ''
          }) });
        }
      }
      fetchWines();
      setLoading(false);
      alert("インポート完了");
    };
    reader.readAsText(file);
  };

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
      <div className="min-h-screen flex items-center justify-center bg-[#0d0e12] p-6 font-sans">
        <div className="bg-white p-10 rounded-[3rem] w-full max-w-sm shadow-2xl">
          <h1 className="text-3xl font-black mb-2 text-center text-black tracking-tighter">WINE SaaS</h1>
          <p className="text-center text-slate-400 text-[10px] mb-8 uppercase font-bold tracking-widest">Store Management Login</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="店舗ID (英数字)" value={auth.id} onChange={e => setAuth({...auth, id: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-bold border-2 focus:border-black outline-none text-black" required />
            <input type="password" placeholder="パスワード" value={auth.pass} onChange={e => setAuth({...auth, pass: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-bold border-2 focus:border-black outline-none text-black" required />
            <button className="w-full bg-black text-white py-5 rounded-2xl font-black text-lg active:scale-95 transition">ログイン / 新規作成</button>
          </form>
          <p className="text-[10px] text-slate-400 mt-6 text-center leading-relaxed">初回入力のIDとパスワードは、<br/>そのまま店舗アカウントとして登録されます。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-slate-50 min-h-screen text-black pb-24 font-sans">
      <div className="flex justify-between items-center py-4 px-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged in as</span>
          <h1 className="text-xl font-black">Store: {auth.id}</h1>
        </div>
        <button onClick={() => { localStorage.clear(); location.reload(); }} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-300 shadow-sm"><LogOut size={20}/></button>
      </div>

      <div className="sticky top-0 z-30 py-4 bg-slate-50/90 backdrop-blur">
        <label className="bg-black text-white w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all cursor-pointer">
          {loading ? <Loader2 className="animate-spin" /> : <Camera size={24}/>}
          <span className="text-lg">ラベルを撮る</span>
          <input type="file" accept="image/*" capture="environment" onChange={handleScan} className="hidden" />
        </label>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 mb-8 space-y-6">
        <div className="flex justify-between items-center px-2">
           <span className="text-slate-400 font-black text-[10px] uppercase">ID: {newWine.id ? `#${newWine.id}` : 'Auto'}</span>
           {editingId && <button onClick={() => {setEditingId(null); setNewWine({id:'',name_jp:'',name_en:'',country:'',region:'',grape:'',type:'赤',vintage:'',price:'',cost:'',stock:'0',advice:'',image:''})}} className="text-slate-400"><X size={20}/></button>}
        </div>

        <div className="aspect-[3/4] bg-slate-100 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-50">
          {newWine.image ? <img src={newWine.image} className="w-full h-full object-cover" /> : <WineIcon className="text-slate-200" size={64}/>}
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 ml-1">カタカナ名</label>
            <input type="text" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black text-lg border-2 border-slate-100 outline-none focus:border-black" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 ml-1">English Name</label>
            <input type="text" value={newWine.name_en} onChange={e => setNewWine({...newWine, name_en: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100 outline-none focus:border-black" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="国" value={newWine.country} onChange={e => setNewWine({...newWine, country: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100 outline-none" />
            <input type="text" placeholder="産地" value={newWine.region} onChange={e => setNewWine({...newWine, region: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="主要品種" value={newWine.grape} onChange={e => setNewWine({...newWine, grape: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100 outline-none" />
            <select value={newWine.type} onChange={e => setNewWine({...newWine, type: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100 outline-none">
              <option value="赤">赤</option><option value="白">白</option><option value="泡">泡</option><option value="ロゼ">ロゼ</option><option value="甘口">甘口</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-amber-600 ml-1">売価 (¥)</label>
              <input type="number" value={newWine.price} onChange={e => setNewWine({...newWine, price: e.target.value})} className="w-full p-4 bg-amber-50 rounded-xl text-black font-black border-2 border-amber-100 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 ml-1">仕入 (¥)</label>
              <input type="number" value={newWine.cost} onChange={e => setNewWine({...newWine, cost: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-green-600 ml-1">在庫</label>
              <input type="number" value={newWine.stock} onChange={e => setNewWine({...newWine, stock: e.target.value})} className="w-full p-4 bg-green-50 rounded-xl text-black font-black border-2 border-green-100 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 ml-1">Vintage</label>
              <input type="text" value={newWine.vintage} onChange={e => setNewWine({...newWine, vintage: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100 outline-none" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-indigo-600 ml-1">Sommelier Commentary</label>
            <textarea placeholder="お客様への解説" value={newWine.advice} onChange={e => setNewWine({...newWine, advice: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black h-32 border-2 border-slate-100 outline-none" />
          </div>
        </div>
        <button onClick={handleSave} className="w-full bg-black text-white py-6 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all">保存して台帳を更新</button>
      </div>

      <div className="flex gap-2 mb-10 px-2">
        <button onClick={exportCSV} className="flex-1 bg-white border border-slate-200 py-4 rounded-xl font-black text-[10px] flex items-center justify-center gap-2"><Download size={16}/> CSV出力</button>
        <label className="flex-1 bg-white border border-slate-200 py-4 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 cursor-pointer shadow-sm">
          <Upload size={16}/> CSVリセット取込 <input type="file" onChange={importCSV} className="hidden" />
        </label>
      </div>

      <div className="space-y-3">
        {wines.map((wine: any) => (
          <div key={wine.id} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm border border-slate-100">
            <img src={wine.image} className="w-16 h-16 rounded-2xl object-cover border border-slate-50 shadow-inner" />
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm truncate">#{wine.id} {wine.name_jp}</p>
              <p className="text-[10px] font-black text-amber-600">¥{Number(wine.price).toLocaleString()} <span className="text-slate-300 ml-1">/ Cost ¥{Number(wine.cost).toLocaleString()}</span></p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
              <button onClick={() => updateStock(wine, -1)} className="p-1"><Minus size={18}/></button>
              <span className={`font-black text-lg w-6 text-center ${parseInt(wine.stock) <= 0 ? 'text-red-500' : 'text-black'}`}>{wine.stock}</span>
              <button onClick={() => updateStock(wine, 1)} className="p-1"><Plus size={18}/></button>
            </div>
            <button onClick={() => {setNewWine(wine); setEditingId(wine.id); window.scrollTo({top:0, behavior:'smooth'})}} className="p-2 text-slate-300"><Edit3 size={20}/></button>
            <button onClick={async () => { if(confirm("削除？")) { await fetch('/api/wines', {method:'DELETE', headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass }, body:JSON.stringify({id:wine.id})}); fetchWines(); } }} className="p-2 text-red-100 hover:text-red-500"><Trash2 size={20}/></button>
          </div>
        ))}
      </div>
      
      <div className="mt-12 p-6 bg-slate-900 text-white rounded-[2rem] shadow-2xl">
        <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-2">Public Menu URL</p>
        <p className="text-xs font-mono break-all font-bold select-all">https://my-wine-menu.pages.dev/{auth.id}</p>
        <p className="text-[9px] mt-4 opacity-40 font-bold uppercase tracking-tighter text-center italic">Customers see only what is in stock</p>
      </div>
    </div>
  );
}
