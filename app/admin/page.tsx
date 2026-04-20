"use client";
import { useState, useEffect } from 'react';
import { Wine as WineIcon, Search, CheckCircle2, Plus, LogOut, ExternalLink, Settings, Save } from 'lucide-react';

export default function StoreAdmin() {
  const [auth, setAuth] = useState({ email: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [masterWines, setMasterWines] = useState([]);
  const [myInventory, setMyInventory] = useState([]);
  const [search, setSearch] = useState("");
  
  // 店舗設定用
  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('wine_store_email');
    if (saved) { setAuth({ email: saved }); setIsLoggedIn(true); }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchMaster();
      fetchMyInventory();
      fetchConfig();
    }
  }, [isLoggedIn]);

  const fetchMaster = () => fetch('/api/master/list').then(res => res.json()).then(setMasterWines);
  const fetchMyInventory = () => fetch(`/api/wines`).then(res => res.json()).then(setMyInventory);
  const fetchConfig = () => fetch('/api/store/config').then(res => res.json()).then(data => {
    setStoreName(data.store_name);
    setSlug(data.slug);
  });

  const saveConfig = async () => {
    setIsSaving(true);
    const res = await fetch('/api/store/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store_name: storeName, slug })
    });
    const data = await res.json();
    if (res.ok) alert("設定を保存しました");
    else alert(data.error);
    setIsSaving(false);
  };

  const toggleWine = async (wineId: string, exists: boolean) => {
    if (exists) return;
    await fetch('/api/wines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wine_id: wineId, price_bottle: 5000, price_glass: 1000, stock: 0, is_visible: true })
    });
    fetchMyInventory();
  };

  const updateInventory = async (wineId: string, key: string, val: any) => {
    const item = myInventory.find(i => i.id === wineId);
    const updates = { wine_id: wineId, price_bottle: item.price_bottle, stock: item.stock, is_visible: item.is_visible, [key]: val };
    await fetch('/api/wines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    fetchMyInventory();
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.clear();
    location.href = '/admin';
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl text-black">
        <h1 className="text-3xl font-black mb-8 text-center uppercase tracking-tighter italic">Store Login</h1>
        <p className="text-sm font-bold text-slate-400 mb-2">登録済みのメールアドレスでログイン</p>
        <input type="email" placeholder="email@example.com" value={auth.email} onChange={e => setAuth({email: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-bold mb-6 outline-none" />
        <button onClick={() => { localStorage.setItem('wine_store_email', auth.email); setIsLoggedIn(true); }} className="w-full bg-black text-white py-5 rounded-2xl font-black transition-transform active:scale-95">管理画面に入る</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8 pb-32 text-black">
      {/* ヘッダー */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
         <div className="flex items-center gap-4">
           <div className="bg-black text-white p-3 rounded-2xl"><WineIcon/></div>
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged in as</p>
             <p className="font-black">{auth.email}</p>
           </div>
         </div>
         <div className="flex gap-4">
           {slug && (
             <a href={`/${slug}`} target="_blank" className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-600 transition-colors">
               <ExternalLink size={18}/> メニューを確認
             </a>
           )}
           <button onClick={handleLogout} className="bg-slate-100 text-slate-400 p-3 rounded-xl hover:text-red-500 transition-colors"><LogOut/></button>
         </div>
      </div>

      {/* 店舗基本設定 */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
        <h2 className="text-xl font-black flex items-center gap-2 italic"><Settings size={22}/> 店舗基本設定</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">店名（メニューのヘッダーに表示）</label>
            <input value={storeName} onChange={e => setStoreName(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-black outline-none transition-all" placeholder="例: L'Atelier de Ginza" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">専用URLスラッグ (英数字とハイフンのみ)</label>
            <div className="flex items-center gap-3 bg-slate-50 p-5 rounded-2xl border-2 border-transparent focus-within:border-black transition-all">
              <span className="text-slate-400 font-bold">/</span>
              <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase())} className="flex-1 bg-transparent font-bold outline-none" placeholder="ginza-wine-bar" />
            </div>
          </div>
        </div>
        <button onClick={saveConfig} disabled={isSaving} className="flex items-center gap-2 bg-black text-white px-10 py-4 rounded-2xl font-black hover:opacity-80 transition-all disabled:opacity-30">
          {isSaving ? "保存中..." : <><Save size={18}/> 設定を保存する</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* 左：マスターリスト */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black italic">1. ワインをリストから追加</h2>
          <div className="relative"><Search className="absolute left-4 top-4 text-slate-300"/><input type="text" placeholder="銘柄名や品種で検索..." className="w-full p-4 pl-12 bg-white rounded-2xl border-2 border-slate-100 font-bold text-black outline-none focus:border-black transition-all" onChange={e => setSearch(e.target.value)}/></div>
          <div className="h-[500px] overflow-y-auto space-y-3 pr-2 scrollbar-hide">
            {masterWines.filter(m => m.name_jp.includes(search) || m.name_en.toLowerCase().includes(search.toLowerCase())).map((m: any) => {
              const has = myInventory.some(i => i.id === m.id);
              return (
                <div key={m.id} className="bg-white p-4 rounded-2xl flex items-center gap-4 border border-slate-100 shadow-sm hover:border-amber-200 transition-all group">
                  <img src={m.image_url} className="w-12 h-16 object-cover rounded-lg shadow-sm" />
                  <div className="flex-1 text-left"><p className="font-bold text-sm leading-tight">{m.name_jp}</p><p className="text-[9px] text-slate-400 uppercase font-black mt-1">{m.country} / {m.vintage}</p></div>
                  <button onClick={() => toggleWine(m.id, has)} className={`p-3 rounded-xl transition-all ${has ? 'text-green-500' : 'bg-black text-white active:scale-90'}`}>{has ? <CheckCircle2/> : <Plus/>}</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右：店舗在庫管理 */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-amber-600 italic">2. 価格と在庫の設定</h2>
          <div className="space-y-4">
            {myInventory.map((w: any) => (
              <div key={w.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl border-2 border-amber-500/10 space-y-5 animate-in fade-in slide-in-from-right-4">
                <div className="flex gap-4">
                  <img src={w.image_url} className="w-16 h-20 object-cover rounded-xl shadow-lg" />
                  <div className="text-left">
                    <p className="font-black text-black leading-tight">{w.name_jp}</p>
                    <p className="text-[10px] text-amber-600 font-bold mt-1 uppercase tracking-widest">Master Synchronized</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">ボトル価格 (¥)</p><input type="number" value={w.price_bottle} className="w-full bg-transparent font-black text-xl outline-none" onChange={e => updateInventory(w.id, 'price_bottle', e.target.value)}/></div>
                  <div className="bg-green-50 p-4 rounded-2xl"><p className="text-[9px] font-black text-green-400 uppercase mb-1">現在の在庫</p><input type="number" value={w.stock} className="w-full bg-transparent font-black text-green-700 text-xl outline-none" onChange={e => updateInventory(w.id, 'stock', e.target.value)}/></div>
                </div>
              </div>
            ))}
            {myInventory.length === 0 && (
              <div className="text-center py-20 border-4 border-dashed border-slate-100 rounded-[3rem]">
                <p className="text-slate-300 font-bold italic">左のマスターリストからワインを選択して<br/>メニューを構築してください</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
