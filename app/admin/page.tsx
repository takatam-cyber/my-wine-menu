// app/admin/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { Wine as WineIcon, BarChart3, Settings, ExternalLink, LogOut, Save, Search, Plus, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

export default function StoreAdmin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [ranking, setRanking] = useState([]);
  const [masterWines, setMasterWines] = useState([]);
  const [myInventory, setMyInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch('/api/store/config').then(res => {
      if (res.ok) { setIsLoggedIn(true); return res.json(); }
      throw new Error();
    }).then(data => {
      setStoreName(data.store_name || "");
      setSlug(data.slug || "");
      fetchDashboardData();
    }).catch(() => setIsLoggedIn(false)).finally(() => setLoading(false));
  }, []);

  const fetchDashboardData = () => {
    fetch('/api/analytics/ranking').then(res => res.json()).then(setRanking);
    fetch('/api/master/list').then(res => res.json()).then(setMasterWines);
    fetch('/api/wines').then(res => res.json()).then(setMyInventory);
  };

  const handleLogin = async () => {
    const res = await fetch('/api/auth', { method: 'POST', body: JSON.stringify({ action: 'login', email, password }) });
    if (res.ok) location.reload();
    else alert("ログイン失敗");
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    location.reload();
  };

  const saveConfig = async () => {
    const res = await fetch('/api/store/config', { method: 'POST', body: JSON.stringify({ store_name: storeName, slug }) });
    if (res.ok) alert("店舗設定を保存しました");
  };

  const updateInventory = async (wineId: string, key: string, val: any) => {
    const item = myInventory.find(i => i.id === wineId);
    const updates = { 
      wine_id: wineId, price_bottle: item.price_bottle, stock: item.stock, is_visible: item.is_visible, 
      [key]: (key === 'price_bottle' || key === 'stock') ? Number(val) : val 
    };
    await fetch('/api/wines', { method: 'POST', body: JSON.stringify(updates) });
    fetch('/api/wines').then(res => res.json()).then(setMyInventory);
  };

  const toggleWine = async (wineId: string, exists: boolean) => {
    if (exists) return;
    await fetch('/api/wines', { method: 'POST', body: JSON.stringify({ wine_id: wineId, price_bottle: 5000, stock: 0, is_visible: true }) });
    fetchDashboardData();
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>;

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 text-black">
      <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm">
        <h1 className="text-3xl font-black mb-8 italic text-center">Admin Login</h1>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl mb-4 font-bold outline-none" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl mb-6 font-bold outline-none" />
        <button onClick={handleLogin} className="w-full bg-black text-white py-5 rounded-2xl font-black">ログイン</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 text-black pb-24 text-left">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border">
         <div className="flex items-center gap-4"><div className="bg-black text-white p-3 rounded-2xl"><WineIcon/></div><h1 className="text-xl font-black italic">{storeName || 'DASHBOARD'}</h1></div>
         <div className="flex gap-3">{slug && <a href={`/${slug}`} target="_blank" className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm"><ExternalLink size={16}/> メニュー表示</a>}<button onClick={handleLogout} className="bg-slate-100 text-slate-400 p-2.5 rounded-xl"><LogOut size={20}/></button></div>
      </div>

      <div className="bg-[#0f172a] text-white p-10 rounded-[3rem] shadow-2xl border border-slate-800">
        <h2 className="text-2xl font-black italic mb-8"><BarChart3 className="text-amber-400 inline mr-2" /> 人気閲覧ランキング</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            {ranking.map((item: any, i) => (
              <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                <span className="font-bold text-sm truncate flex-1">{i+1}. {item.name_jp}</span>
                <span className="bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-full">{item.view_count} views</span>
              </div>
            ))}
          </div>
          <div className="bg-amber-500/10 p-6 rounded-[2rem] border border-amber-500/20">
            <p className="text-amber-500 font-black text-sm uppercase mb-2">Insight</p>
            <p className="text-slate-300 text-sm leading-relaxed font-bold">{ranking.length > 0 ? `「${ranking[0].name_jp}」が今最も注目されています。` : "データ蓄積中..."}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border space-y-6">
          <h2 className="text-xl font-black italic"><Settings className="inline mr-2"/> 店舗設定</h2>
          <input value={storeName} onChange={e => setStoreName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl font-bold" placeholder="店名" />
          <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-xl"><span className="text-slate-400">/</span><input value={slug} onChange={e => setSlug(e.target.value.toLowerCase())} className="flex-1 bg-transparent font-bold outline-none" placeholder="url-slug" /></div>
          <button onClick={saveConfig} className="w-full bg-black text-white py-4 rounded-xl font-black">設定を保存</button>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-black italic">在庫・価格管理</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myInventory.map((w: any) => (
              <div key={w.id} className="bg-white p-6 rounded-[2rem] shadow-sm border space-y-4">
                <p className="font-black text-sm truncate">{w.name_jp}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-2.5 rounded-xl"><p className="text-[9px] font-black text-slate-400 uppercase">価格</p><input type="number" value={w.price_bottle} onChange={e => updateInventory(w.id, 'price_bottle', e.target.value)} className="w-full bg-transparent font-bold" /></div>
                  <div className="bg-green-50 p-2.5 rounded-xl"><p className="text-[9px] font-black text-green-400 uppercase">在庫</p><input type="number" value={w.stock} onChange={e => updateInventory(w.id, 'stock', e.target.value)} className="w-full bg-transparent font-bold text-green-700" /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[3rem] shadow-sm border space-y-4">
        <h2 className="text-2xl font-black italic">ワイン図鑑から追加</h2>
        <div className="relative w-full"><Search className="absolute left-4 top-3.5 text-slate-300"/><input value={search} onChange={e => setSearch(e.target.value)} className="w-full p-4 pl-12 bg-slate-50 rounded-2xl font-bold" placeholder="銘柄や品種で検索..." /></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          {masterWines.filter(m => (m.name_jp || "").includes(search) || (m.name_en || "").toLowerCase().includes(search.toLowerCase())).map((m: any) => {
            const has = myInventory.some(i => i.id === m.id);
            return (
              <div key={m.id} className={`p-4 rounded-3xl border-2 transition-all ${has ? 'bg-green-50 border-green-200' : 'bg-white border-slate-50 hover:border-black'}`}>
                <img src={m.image_url} className="w-full aspect-[3/4] object-contain mb-3" />
                <p className="text-[10px] font-black h-8 overflow-hidden">{m.name_jp}</p>
                <button onClick={() => toggleWine(m.id, has)} className={`w-full py-2.5 rounded-xl mt-3 font-black text-[10px] ${has ? 'text-green-600 bg-white border border-green-200' : 'bg-black text-white'}`}>{has ? '登録済' : '追加'}</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
