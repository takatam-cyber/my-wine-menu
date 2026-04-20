"use client";
import { useState, useEffect } from 'react';
import { Wine as WineIcon, Search, CheckCircle2, Plus, LogOut, ExternalLink } from 'lucide-react';

export default function StoreAdmin() {
  const [auth, setAuth] = useState({ email: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [masterWines, setMasterWines] = useState([]);
  const [myInventory, setMyInventory] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem('wine_store_email');
    if (saved) { setAuth({ email: saved }); setIsLoggedIn(true); }
  }, []);

  useEffect(() => {
    if (isLoggedIn && auth.email) {
      fetchMaster();
      fetchMyInventory();
    }
  }, [isLoggedIn, auth.email]);

  const fetchMaster = () => fetch('/api/master/list').then(res => res.json()).then(setMasterWines);
  const fetchMyInventory = () => fetch(`/api/wines?storeId=${auth.email}`).then(res => res.json()).then(setMyInventory);

  const toggleWine = async (wineId: string, exists: boolean) => {
    if (exists) return; // 既にある場合は何もしない（または削除機能を付ける）
    await fetch('/api/wines', {
      method: 'POST',
      headers: { 'x-store-id': auth.email, 'Content-Type': 'application/json' },
      body: JSON.stringify({ wine_id: wineId, price_bottle: 5000, price_glass: 1000, stock: 0, is_visible: true })
    });
    fetchMyInventory();
  };

  const updateVal = async (wineId: string, key: string, val: any) => {
    const item = myInventory.find(i => i.id === wineId);
    const updates = { wine_id: wineId, price_bottle: item.price_bottle, stock: item.stock, is_visible: item.is_visible, [key]: val };
    await fetch('/api/wines', {
      method: 'POST',
      headers: { 'x-store-id': auth.email, 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    fetchMyInventory();
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl">
        <h1 className="text-3xl font-black mb-8 text-center uppercase tracking-tighter italic">Store Login</h1>
        <input type="email" placeholder="店舗メールアドレス" value={auth.email} onChange={e => setAuth({email: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-bold mb-6 outline-none text-black" />
        <button onClick={() => { localStorage.setItem('wine_store_email', auth.email); setIsLoggedIn(true); }} className="w-full bg-black text-white py-5 rounded-2xl font-black">管理画面に入る</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12 pb-32">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
         <div className="flex items-center gap-4"><div className="bg-black text-white p-3 rounded-2xl"><WineIcon/></div><p className="font-black text-black">{auth.email}</p></div>
         <div className="flex gap-4">
           <a href={`/${encodeURIComponent(auth.email)}`} target="_blank" className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"><ExternalLink size={18}/> メニュー表示</a>
           <button onClick={() => {const handleLogout = async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  localStorage.clear();
  location.href = '/admin';
};; location.reload();}} className="bg-slate-100 text-slate-400 p-3 rounded-xl"><LogOut/></button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* 左：マスターから選ぶ */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-black italic">1. ワインをリストから追加</h2>
          <div className="relative"><Search className="absolute left-4 top-4 text-slate-300"/><input type="text" placeholder="ワインを検索..." className="w-full p-4 pl-12 bg-white rounded-2xl border-2 border-slate-100 font-bold text-black" onChange={e => setSearch(e.target.value)}/></div>
          <div className="h-[500px] overflow-y-auto space-y-3 pr-2 scrollbar-hide">
            {masterWines.filter(m => m.name_jp.includes(search)).map((m: any) => {
              const has = myInventory.some(i => i.id === m.id);
              return (
                <div key={m.id} className="bg-white p-4 rounded-2xl flex items-center gap-4 border border-slate-100 shadow-sm">
                  <img src={m.image_url} className="w-12 h-16 object-cover rounded-lg" />
                  <div className="flex-1 text-left"><p className="font-bold text-sm text-black">{m.name_jp}</p><p className="text-[10px] text-slate-400 uppercase font-black">{m.country} / {m.vintage}</p></div>
                  <button onClick={() => toggleWine(m.id, has)} className={`p-3 rounded-xl transition-all ${has ? 'text-green-500' : 'bg-black text-white'}`}>{has ? <CheckCircle2/> : <Plus/>}</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右：自分の在庫管理 */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-amber-600 italic">2. 価格と在庫の設定</h2>
          <div className="space-y-4">
            {myInventory.map((w: any) => (
              <div key={w.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl border-2 border-amber-500/10 space-y-4">
                <div className="flex gap-4"><img src={w.image_url} className="w-16 h-20 object-cover rounded-xl shadow-lg" /><div className="text-left"><p className="font-black text-black leading-tight">{w.name_jp}</p><p className="text-[10px] text-amber-600 font-bold mt-1">プロによる解説が適用されています</p></div></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-2xl"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">ボトル価格</p><input type="number" value={w.price_bottle} className="w-full bg-transparent font-black text-black text-xl outline-none" onChange={e => updateVal(w.id, 'price_bottle', e.target.value)}/></div>
                  <div className="bg-green-50 p-3 rounded-2xl"><p className="text-[9px] font-black text-green-400 uppercase mb-1">現在の在庫</p><input type="number" value={w.stock} className="w-full bg-transparent font-black text-green-700 text-xl outline-none" onChange={e => updateVal(w.id, 'stock', e.target.value)}/></div>
                </div>
              </div>
            ))}
            {myInventory.length === 0 && <p className="text-slate-300 font-bold text-center py-20 italic">左のリストからワインを追加してください</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
