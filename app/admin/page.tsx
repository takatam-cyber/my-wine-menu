// app/admin/page.tsx (完全上書き)
"use client";
import { useState, useEffect } from 'react';
import { Wine as WineIcon, BarChart3, Settings, ExternalLink, LogOut, Save, Search, Plus, CheckCircle2, Loader2 } from 'lucide-react';

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

  useEffect(() => {
    fetch('/api/store/config').then(res => {
      if (res.ok) {
        setIsLoggedIn(true);
        return res.json();
      }
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
    const res = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'login', email, password })
    });
    if (res.ok) location.reload();
    else alert("ログイン失敗");
  };

  const saveConfig = async () => {
    const res = await fetch('/api/store/config', {
      method: 'POST',
      body: JSON.stringify({ store_name: storeName, slug })
    });
    if (res.ok) alert("設定を保存しました");
  };

  const toggleWine = async (wineId: string, exists: boolean) => {
    if (exists) return;
    await fetch('/api/wines', {
      method: 'POST',
      body: JSON.stringify({ wine_id: wineId, price_bottle: 5000, stock: 0, is_visible: true })
    });
    fetchDashboardData();
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>;

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm text-black">
        <h1 className="text-3xl font-black mb-8 italic text-center uppercase tracking-tighter">Admin Login</h1>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl mb-4 font-bold outline-none" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl mb-6 font-bold outline-none" />
        <button onClick={handleLogin} className="w-full bg-black text-white py-5 rounded-2xl font-black">ログイン</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8 text-black pb-24 text-left">
      <div className="bg-[#0f172a] text-white p-10 rounded-[3rem] shadow-2xl border border-slate-800">
        <h2 className="text-2xl font-black italic flex items-center gap-3 mb-8"><BarChart3 className="text-amber-400" /> 人気閲覧ランキング</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            {ranking.map((item: any, i) => (
              <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="font-bold text-sm truncate flex-1">{i+1}. {item.name_jp}</span>
                <span className="bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-full ml-4">{item.view_count} views</span>
              </div>
            ))}
          </div>
          <div className="bg-amber-500/10 p-6 rounded-[2rem] border border-amber-500/20 flex flex-col justify-center">
            <p className="text-amber-500 font-black text-sm uppercase mb-2">Sommelier Insight</p>
            <p className="text-slate-300 text-sm leading-relaxed font-bold">
              {ranking.length > 0 ? `「${ranking[0].name_jp}」が注目されています。` : "データ収集中です。"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
          <h2 className="text-xl font-black flex items-center gap-2 italic"><Settings/> 店舗設定</h2>
          <input value={storeName} onChange={e => setStoreName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl font-bold" placeholder="店名" />
          <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-xl"><span className="text-slate-400">/</span><input value={slug} onChange={e => setSlug(e.target.value.toLowerCase())} className="flex-1 bg-transparent font-bold outline-none" placeholder="url-slug" /></div>
          <button onClick={saveConfig} className="bg-black text-white px-8 py-4 rounded-xl font-black">設定保存</button>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-xl font-black italic">マスターから追加</h2>
          <div className="h-64 overflow-y-auto space-y-2 pr-2">
            {masterWines.map((m: any) => {
              const has = myInventory.some(i => i.id === m.id);
              return (
                <div key={m.id} className="bg-slate-50 p-3 rounded-xl flex items-center justify-between">
                  <span className="text-sm font-bold truncate flex-1">{m.name_jp}</span>
                  <button onClick={() => toggleWine(m.id, has)} className={`p-2 rounded-lg ${has ? 'text-green-500' : 'bg-black text-white'}`}>{has ? <CheckCircle2 size={18}/> : <Plus size={18}/>}</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
