// app/admin/page.tsx (完全上書き)
"use client";
import { useState, useEffect } from 'react';
import { Wine as WineIcon, BarChart3, Settings, LogOut, Save, Search, Plus, CheckCircle2, Loader2 } from 'lucide-react';

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

  // 起動時にセッション確認
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
    }).catch(() => setIsLoggedIn(false))
      .finally(() => setLoading(false));
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
    else alert("ログイン失敗: メールアドレスまたはパスワードが違います");
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>;

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm">
        <h1 className="text-3xl font-black mb-8 text-center italic text-black">Admin Login</h1>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl mb-4 outline-none text-black font-bold" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl mb-6 outline-none text-black font-bold" />
        <button onClick={handleLogin} className="w-full bg-black text-white py-5 rounded-2xl font-black">ログイン</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8 text-black pb-24 text-left">
      {/* 以前お伝えした統計・設定・在庫管理のUIをここに集約 */}
      <h1 className="text-2xl font-black italic">Welcome back, {storeName || email}</h1>
      {/* ...UI詳細... */}
    </div>
  );
}
