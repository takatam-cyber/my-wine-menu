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
    const res = await fetch(`/api/wines`, { headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass } });
    if (res.ok) setWines(await res.json());
  };

  const handleLogin = (e: any) => {
    e.preventDefault();
    localStorage.setItem('wine_store_id', auth.id);
    localStorage.setItem('wine_store_pass', auth.pass);
    setIsLoggedIn(true);
  };

  const updateStock = async (wine: any, delta: number) => {
    const updated = { ...wine, stock: String(Math.max(0, (parseInt(wine.stock) || 0) + delta)) };
    await fetch('/api/wines', { method: 'POST', headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass }, body: JSON.stringify(updated) });
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
      const { result } = await scanRes.json();
      const ai = JSON.parse(result);

      setNewWine(prev => ({
        ...prev,
        name_jp: ai.name_jp || '',
        name_en: ai.name_en || '',
        country: ai.country || '',
        region: ai.region || '',
        grape: ai.grape || '',
        type: ai.type || '赤',
        vintage: String(ai.vintage || ''),
        advice: ai.advice || ''
      }));
    } catch (e) { alert("Gemini分析失敗: " + e); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    await fetch('/api/wines', { method: 'POST', headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass }, body: JSON.stringify(newWine) });
    setNewWine({ id:'', name_jp:'', name_en:'', country:'', region:'', grape:'', type:'赤', vintage:'', price:'', cost:'', stock:'0', advice:'', image:'' });
    setEditingId(null);
    fetchWines();
    alert("台帳を更新しました");
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !confirm("現在の店舗データを全てリセットし、CSVで上書きしますか？")) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      setLoading(true);
      for (const w of wines) await fetch('/api/wines', { method: 'DELETE', headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass }, body: JSON.stringify({ id: w.id }) });
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
      fetchWines(); setLoading(false); alert("リセット・取込完了");
    };
    reader.readAsText(file);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0e12] p-6 text-black font-sans">
        <div className="bg-white p-10 rounded-[3rem] w-full max-w-sm shadow-2xl border-4 border-[#c5a059]">
          <h1 className="text-3xl font-black mb-2 text-center">WINE ADMIN</h1>
          <p className="text-center text-slate-400 text-[10px] mb-8 uppercase font-bold tracking-[0.2em]">Store Multi-Account Login</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="店舗ID" value={auth.id} onChange={e => setAuth({...auth, id: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-black border-2 focus:border-black outline-none" required />
            <input type="password" placeholder="パスワード" value={auth.pass} onChange={e => setAuth({...auth, pass: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-black border-2 focus:border-black outline-none" required />
            <button className="w-full bg-black text-white py-5 rounded-2xl font-black text-lg">ログイン / 開店</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-slate-50 min-h-screen text-black pb-24 font-sans">
      <div className="flex justify-between items-center py-4 px-2 mb-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Management Account</span>
          <h1 className="text-2xl font-black">#{auth.id}</h1>
        </div>
        <button onClick={() => { localStorage.clear(); location.reload(); }} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-300 shadow-sm"><LogOut size={20}/></button>
      </div>

      <div className="sticky top-0 z-30 py-4 bg-slate-50/90 backdrop-blur">
        <label className="bg-black text-white w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all cursor-pointer">
          {loading ? <Loader2 className="animate-spin" /> : <Camera size={24}/>}
          <span className="text-lg">ラベルをGemini 3で分析</span>
          <input type="file" accept="image/*" capture="environment" onChange={handleScan} className="hidden" />
        </label>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 mb-8 space-y-6">
        <div className="flex justify-between items-center px-1">
           <span className="text-slate-400 font-black text-[10px] uppercase">ID: {newWine.id ? `#${newWine.id}` : 'Automatic'}</span>
           {editingId && <button onClick={() => {setEditingId(null); setNewWine({id:'',name_jp:'',name_en:'',country:'',region:'',grape:'',type:'赤',vintage:'',price:'',cost:'',stock:'0',advice:'',image:''})}} className="p-2 bg-slate-100 rounded-full"><X size={16}/></button>}
        </div>

        <div className="aspect-[3/4] bg-slate-50 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center border-2 border-slate-100">
          {newWine.image ? <img src={newWine.image} className="w-full h-full object-cover" /> : <WineIcon className="text-slate-200" size={64}/>}
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 ml-1">カタカナ名</label>
            <input type="text" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black text-lg border-2 border-slate-100 focus:border-black outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Alphabet Name</label>
            <input type="text" value={newWine.name_en} onChange={e => setNewWine({...newWine, name_en: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100 focus:border-black outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="国" value={newWine.country} onChange={e => setNewWine({...newWine, country: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100" />
            <input type="text" placeholder="産地" value={newWine.region} onChange={e => setNewWine({...newWine, region: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="品種" value={newWine.grape} onChange={e => setNewWine({...newWine, grape: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100" />
            <select value={newWine.type} onChange={e => setNewWine({...newWine, type: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100">
              <option value="赤">赤</option><option value="白">白</option><option value="泡">泡</option><option value="ロゼ">ロゼ</option><option value="甘口">甘口</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-amber-600 ml-1">売価 (¥)</label>
              <input type="number" value={newWine.price} onChange={e => setNewWine({...newWine, price: e.target.value})} className="w-full p-4 bg-amber-50 rounded-xl text-black font-black border-2 border-amber-100" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 ml-1">仕入 (¥) ※非公開</label>
              <input type="number" value={newWine.cost} onChange={e => setNewWine({...newWine, cost: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-green-600 ml-1">現在の在庫</label>
              <input type="number" value={newWine.stock} onChange={e => setNewWine({...newWine, stock: e.target.value})} className="w-full p-4 bg-green-50 rounded-xl text-black font-black border-2 border-green-100" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Vintage</label>
              <input type="text" value={newWine.vintage} onChange={e => setNewWine({...newWine, vintage: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-indigo-600 ml-1 uppercase tracking-tighter">Sommelier Advice (Gemini 3)</label>
            <textarea placeholder="お客様への解説" value={newWine.advice} onChange={e => setNewWine({...newWine, advice: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black h-36 border-2 border-slate-100 outline-none focus:border-black" />
          </div>
        </div>

        <button onClick={handleSave} className="w-full bg-black text-white py-6 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all">情報を保存する</button>
      </div>

      <div className="flex gap-2 mb-10 px-1">
        <button onClick={exportCSV} className="flex-1 bg-white border border-slate-200 py-4 rounded-xl font-black text-[10px] flex items-center justify-center gap-2"><Download size={16}/> CSV出力</button>
        <label className="flex-1 bg-white border border-slate-200 py-4 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 cursor-pointer shadow-sm">
          <Upload size={16}/> CSV一括更新 <input type="file" onChange={importCSV} className="hidden" />
        </label>
      </div>

      <div className="space-y-3">
        {wines.map((wine: any) => (
          <div key={wine.id} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm border border-slate-100 transition-all">
            <img src={wine.image} className="w-16 h-16 rounded-2xl object-cover border border-slate-50 shadow-inner" />
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm truncate">#{wine.id} {wine.name_jp}</p>
              <p className="text-[10px] font-black text-amber-600">¥{Number(wine.price).toLocaleString()} <span className="text-slate-300 ml-1 font-bold">Cost ¥{Number(wine.cost).toLocaleString()}</span></p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
              <button onClick={() => updateStock(wine, -1)} className="p-1"><Minus size={18}/></button>
              <span className={`font-black text-lg w-6 text-center ${parseInt(wine.stock) <= 0 ? 'text-red-500' : 'text-black'}`}>{wine.stock}</span>
              <button onClick={() => updateStock(wine, 1)} className="p-1"><Plus size={18}/></button>
            </div>
            <button onClick={() => {setNewWine(wine); setEditingId(wine.id); window.scrollTo({top:0, behavior:'smooth'})}} className="p-2 text-slate-300 hover:text-black"><Edit3 size={20}/></button>
          </div>
        ))}
      </div>
      
      <div className="mt-12 p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl">
        <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-3">お客様用URL (QRコード用)</p>
        <p className="text-xs font-mono break-all font-bold select-all leading-relaxed text-[#c5a059]">https://my-wine-menu.pages.dev/{auth.id}</p>
      </div>
    </div>
  );
}
