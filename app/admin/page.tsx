"use client";

import { useState, useEffect } from 'react';
import { Camera, Loader2, Wine as WineIcon, Trash2, Edit3, Download, Upload, X, Plus, Minus, LogOut } from 'lucide-react';

export default function AdminPage() {
  const [auth, setAuth] = useState({ id: '', pass: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // CSVの項目と完全に一致するステート構造
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
    const res = await fetch(`/api/wines`, { headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass } });
    if (res.ok) setWines(await res.json());
  };

  const handleLogin = (e: any) => {
    e.preventDefault();
    localStorage.setItem('wine_store_id', auth.id);
    localStorage.setItem('wine_store_pass', auth.pass);
    setIsLoggedIn(true);
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
        name_jp: ai.name_jp || '', name_en: ai.name_en || '',
        country: ai.country || '', region: ai.region || '',
        grape: ai.grape || '', type: ai.type || prev.type,
        vintage: String(ai.vintage || ''), price: String(ai.price || ''),
        cost: String(ai.cost || ''), advice: ai.advice || '',
        image: url
      }));
    } catch (e) { alert("AI分析失敗。手動で補完してください。"); } finally { setLoading(false); }
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
    alert("保存完了");
  };

  // 在庫のポチポチ更新
  const updateStock = async (wine: any, delta: number) => {
    const updated = { ...wine, stock: String(Math.max(0, (parseInt(wine.stock) || 0) + delta)) };
    await fetch('/api/wines', { 
      method: 'POST', 
      headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass }, 
      body: JSON.stringify(updated) 
    });
    fetchWines();
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-slate-50 min-h-screen text-black pb-24 font-sans">
      {!isLoggedIn ? (
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="bg-white p-10 rounded-[3rem] w-full shadow-2xl border-4 border-[#c5a059]">
            <h1 className="text-3xl font-black mb-2 text-center">WINE ADMIN</h1>
            <form onSubmit={handleLogin} className="space-y-4 mt-8">
              <input type="text" placeholder="店舗ID" value={auth.id} onChange={e => setAuth({...auth, id: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-black border-2 outline-none" required />
              <input type="password" placeholder="パスワード" value={auth.pass} onChange={e => setAuth({...auth, pass: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-black border-2 outline-none" required />
              <button className="w-full bg-black text-white py-5 rounded-2xl font-black text-lg">ログイン</button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center py-4 mb-2">
            <h1 className="text-xl font-black">STORE: {auth.id}</h1>
            <button onClick={() => { localStorage.clear(); location.reload(); }} className="text-slate-300"><LogOut/></button>
          </div>

          <label className="bg-black text-white w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl mb-6 cursor-pointer active:scale-95 transition-all">
            {loading ? <Loader2 className="animate-spin" /> : <Camera size={24}/>}
            <span className="text-lg">ラベルを撮ってAI分析</span>
            <input type="file" accept="image/*" capture="environment" onChange={handleScan} className="hidden" />
          </label>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 mb-8 space-y-4">
            <div className="aspect-[3/4] bg-slate-50 rounded-3xl overflow-hidden border-2 border-slate-100">
              {newWine.image ? <img src={newWine.image} className="w-full h-full object-cover" /> : <div className="flex h-full items-center justify-center opacity-10"><WineIcon size={64}/></div>}
            </div>

            <div className="space-y-4">
              <input type="text" placeholder="カタカナ名" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100" />
              <input type="text" placeholder="Alphabet Name" value={newWine.name_en} onChange={e => setNewWine({...newWine, name_en: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100" />
              
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="国" value={newWine.country} onChange={e => setNewWine({...newWine, country: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100" />
                <input type="text" placeholder="産地" value={newWine.region} onChange={e => setNewWine({...newWine, region: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="品種" value={newWine.grape} onChange={e => setNewWine({...newWine, grape: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100" />
                <input type="text" placeholder="タイプ" value={newWine.type} onChange={e => setNewWine({...newWine, type: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-amber-600 ml-1">売価</label>
                  <input type="number" value={newWine.price} onChange={e => setNewWine({...newWine, price: e.target.value})} className="w-full p-3 bg-amber-50 rounded-xl text-black font-black border-2 border-amber-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 ml-1">仕入</label>
                  <input type="number" value={newWine.cost} onChange={e => setNewWine({...newWine, cost: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-green-600 ml-1">在庫</label>
                  <input type="number" value={newWine.stock} onChange={e => setNewWine({...newWine, stock: e.target.value})} className="w-full p-3 bg-green-50 rounded-xl text-black font-black border-2 border-green-100" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 ml-1">VINTAGE / オススメ解説</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="年" value={newWine.vintage} onChange={e => setNewWine({...newWine, vintage: e.target.value})} className="w-20 p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100" />
                  <textarea placeholder="ソムリエ解説" value={newWine.advice} onChange={e => setNewWine({...newWine, advice: e.target.value})} className="flex-1 p-4 bg-slate-50 rounded-xl text-black font-black h-24 border-2 border-slate-100" />
                </div>
              </div>
            </div>

            <button onClick={handleSave} className="w-full bg-black text-white py-6 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all">保存して台帳を更新</button>
          </div>

          <div className="space-y-3">
            {wines.map((wine: any) => (
              <div key={wine.id} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm border border-slate-200">
                <img src={wine.image} className="w-16 h-16 rounded-2xl object-cover shadow-inner" />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm truncate">#{wine.id} {wine.name_jp}</p>
                  <p className="text-[10px] font-black text-amber-600">¥{Number(wine.price).toLocaleString()} <span className="text-slate-300 ml-1 font-bold">Cost ¥{Number(wine.cost).toLocaleString()}</span></p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  <button onClick={() => updateStock(wine, -1)} className="p-1"><Minus size={18}/></button>
                  <span className={`font-black text-lg w-6 text-center ${parseInt(wine.stock) <= 0 ? 'text-red-500' : 'text-black'}`}>{wine.stock}</span>
                  <button onClick={() => updateStock(wine, 1)} className="p-1"><Plus size={18}/></button>
                </div>
                <button onClick={() => {setNewWine(wine); setEditingId(wine.id); window.scrollTo({top:0, behavior:'smooth'})}} className="p-2 text-slate-300"><Edit3 size={20}/></button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
