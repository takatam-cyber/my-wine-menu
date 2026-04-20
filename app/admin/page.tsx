// app/admin/page.tsx (完全復旧・統合版)
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

  // 1. 初期データロード
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

  // 2. 認証・設定保存アクション
  const handleLogin = async () => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'login', email, password })
    });
    if (res.ok) location.reload();
    else alert("ログイン失敗");
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    location.reload();
  };

  const saveConfig = async () => {
    const res = await fetch('/api/store/config', {
      method: 'POST',
      body: JSON.stringify({ store_name: storeName, slug })
    });
    if (res.ok) alert("設定を保存しました");
    else alert("エラー: URLスラッグが他店と重複している可能性があります");
  };

  // 3. 在庫・価格操作アクション (重要: 復活した関数)
  const updateInventory = async (wineId: string, key: string, val: any) => {
    const item = myInventory.find(i => i.id === wineId);
    const updates = { 
      wine_id: wineId, 
      price_bottle: item.price_bottle, 
      stock: item.stock, 
      is_visible: item.is_visible, 
      [key]: val 
    };
    await fetch('/api/wines', {
      method: 'POST',
      body: JSON.stringify(updates)
    });
    // データを再取得して画面を更新
    fetch('/api/wines').then(res => res.json()).then(setMyInventory);
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
    <div className="min-h-screen bg-black flex items-center justify-center p-6 text-black">
      <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm">
        <h1 className="text-3xl font-black mb-8 italic text-center uppercase tracking-tighter">Admin Login</h1>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl mb-4 font-bold outline-none" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl mb-6 font-bold outline-none" />
        <button onClick={handleLogin} className="w-full bg-black text-white py-5 rounded-2xl font-black active:scale-95 transition-transform">ログイン</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 text-black pb-24 text-left">
      {/* ヘッダー */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
         <div className="flex items-center gap-4">
           <div className="bg-black text-white p-3 rounded-2xl"><WineIcon/></div>
           <h1 className="text-xl font-black italic">{storeName || 'DASHBOARD'}</h1>
         </div>
         <div className="flex gap-3">
           {slug && <a href={`/${slug}`} target="_blank" className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm"><ExternalLink size={16}/> メニュー</a>}
           <button onClick={handleLogout} className="bg-slate-100 text-slate-400 p-2.5 rounded-xl hover:text-red-500 transition-colors"><LogOut size={20}/></button>
         </div>
      </div>

      {/* 人気ランキング */}
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
              {ranking.length > 0 ? `「${ranking[0].name_jp}」が最も注目されています。ペアリング提案を強化しましょう。` : "データ蓄積中。接客数が増えるとAIのアドバイスが表示されます。"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左: 店舗設定 */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6 h-fit">
          <h2 className="text-xl font-black flex items-center gap-2 italic"><Settings/> 店舗設定</h2>
          <div className="space-y-4">
            <input value={storeName} onChange={e => setStoreName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-black outline-none transition-all" placeholder="店名" />
            <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-xl border-2 border-transparent focus-within:border-black transition-all">
              <span className="text-slate-400 font-bold">/</span>
              <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase())} className="flex-1 bg-transparent font-bold outline-none" placeholder="url-slug" />
            </div>
            <button onClick={saveConfig} className="w-full bg-black text-white py-4 rounded-xl font-black flex items-center justify-center gap-2"><Save size={18}/> 設定を保存</button>
          </div>
        </div>

        {/* 中: 在庫・価格管理 (復活したUI) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black italic">現在の在庫・価格設定</h2>
            <button onClick={fetchDashboardData} className="p-2 text-slate-400 hover:text-black transition-colors"><RefreshCw size={20}/></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myInventory.length > 0 ? myInventory.map((w: any) => (
              <div key={w.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border-2 border-slate-50 space-y-5">
                <div className="flex gap-4">
                  <img src={w.image_url} className="w-12 h-16 object-cover rounded-lg bg-slate-50" />
                  <div className="flex-1 overflow-hidden">
                    <p className="font-black text-sm truncate">{w.name_jp}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{w.country} / {w.vintage}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1 ml-1">ボトル価格 (¥)</p>
                    <input type="number" value={w.price_bottle} onChange={e => updateInventory(w.id, 'price_bottle', e.target.value)} className="w-full bg-transparent font-black text-lg outline-none" />
                  </div>
                  <div className="bg-green-50 p-3 rounded-2xl">
                    <p className="text-[9px] font-black text-green-400 uppercase mb-1 ml-1">在庫数</p>
                    <input type="number" value={w.stock} onChange={e => updateInventory(w.id, 'stock', e.target.value)} className="w-full bg-transparent font-black text-lg text-green-700 outline-none" />
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-2 py-20 text-center border-4 border-dashed rounded-[3rem] border-slate-100">
                <p className="text-slate-300 font-bold italic">右のリストからワインを追加してください</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 下: マスターリスト検索・追加 */}
      <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black italic">1. ワイン図鑑から追加</h2>
          <div className="relative w-72">
            <Search className="absolute left-4 top-3 text-slate-300" size={20}/>
            <input value={search} onChange={e => setSearch(e.target.value)} className="w-full p-3 pl-12 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-black transition-all" placeholder="銘柄や品種で検索..." />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {masterWines.filter(m => m.name_jp.includes(search) || m.name_en.toLowerCase().includes(search.toLowerCase())).map((m: any) => {
            const has = myInventory.some(i => i.id === m.id);
            return (
              <div key={m.id} className={`p-4 rounded-3xl border-2 transition-all group ${has ? 'bg-green-50 border-green-200' : 'bg-white border-slate-50 hover:border-black'}`}>
                <img src={m.image_url} className="w-full aspect-[3/4] object-contain mb-4" />
                <p className="text-xs font-black leading-tight h-8 overflow-hidden mb-3">{m.name_jp}</p>
                <button onClick={() => toggleWine(m.id, has)} className={`w-full py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 ${has ? 'text-green-600 bg-white' : 'bg-black text-white active:scale-95'}`}>
                  {has ? <><CheckCircle2 size={16}/> 登録済</> : <><Plus size={16}/> メニューへ追加</>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
