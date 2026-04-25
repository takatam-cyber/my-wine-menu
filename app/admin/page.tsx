// app/admin/page.tsx
"use client";
export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { 
  Store, Plus, ExternalLink, Database, LayoutDashboard, ArrowRight, LogOut, 
  Loader2, TrendingUp, Users, Package, Search, Wine, AlertCircle, Lock, Mail, HelpCircle, X, CheckCircle2
} from 'lucide-react';

/**
 * プレビュー環境（blob URL 等）でも API エンドポイントを正しくパースするための堅牢なユーティリティ。
 * blob:https://domain/uuid 形式から https://domain/api/path を生成します。
 */
const getApiUrl = (path: string) => {
  if (typeof window === 'undefined') return path;
  try {
    // blob URL の場合は "blob:https://..." となっているので、"blob:" を除去してベースURLを作成
    const baseUrl = window.location.href.startsWith('blob:') 
      ? window.location.href.replace(/^blob:/, '') 
      : window.location.href;
    
    const url = new URL(path, baseUrl);
    // プロトコル、ホスト、パスを組み合わせて純粋な絶対URLを返す
    return `${url.protocol}//${url.host}${url.pathname}${url.search}`;
  } catch (e) {
    // 最終手段としてオリジンとパスを結合
    const origin = window.location.origin && window.location.origin !== 'null' 
      ? window.location.origin 
      : '';
    return `${origin}${path}`;
  }
};

const useRouter = () => {
  return {
    push: (url: string) => {
      if (typeof window !== 'undefined') window.location.href = url;
    },
    replace: (url: string) => {
      if (typeof window !== 'undefined') window.location.replace(url);
    },
    prefetch: () => {},
    back: () => {
      if (typeof window !== 'undefined') window.history.back();
    }
  };
};

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Help Modal states
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<{success: boolean, message: string} | null>(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  
  const router = useRouter();

  const checkAuthAndFetch = async () => {
    setLoading(true);
    try {
      const url = getApiUrl('/api/store/config');
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStores(Array.isArray(data) ? data : []);
        setIsLoggedIn(true);
        setError(null);
      } else {
        setIsLoggedIn(false);
      }
    } catch (err: any) {
      console.error("Auth check failed:", err);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl('/api/auth'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setIsLoggedIn(true);
        await checkAuthAndFetch();
      } else {
        setError(data.error || `ログイン失敗 (${res.status})`);
      }
    } catch (err) {
      setError("接続エラーが発生しました。");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRecoveryRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryLoading(true);
    setRecoveryStatus(null);
    try {
      const res = await fetch(getApiUrl('/api/auth/recovery'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail.trim() }),
      });
      
      const data = await res.json();
      setRecoveryStatus({ success: res.ok, message: data.message || data.error || "応答エラー" });
    } catch (err) {
      setRecoveryStatus({ success: false, message: "サーバーへの接続に失敗しました。" });
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(getApiUrl('/api/auth/logout'), { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    setIsLoggedIn(false);
    setStores([]);
    router.replace('/admin');
  };

  const filteredStores = stores.filter(store => 
    store.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !isLoggedIn) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-amber-500" size={48} />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Authenticating...</p>
    </div>
  );

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-[#0d0e12] flex items-center justify-center p-6 font-sans text-left">
      <div className="max-w-md w-full space-y-8 bg-white rounded-[3rem] p-12 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg mb-4 font-black italic text-2xl">P</div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Admin Portal</h1>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">ピーロート営業支援システム</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-xs font-bold border border-red-100 animate-in shake duration-300">
            <AlertCircle size={16} className="shrink-0" /> <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="email" required 
                className="w-full p-5 pl-14 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-amber-500 outline-none text-slate-900 font-bold transition-all"
                placeholder="email@pieroth.jp"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Password</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="password" required 
                className="w-full p-5 pl-14 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-amber-500 outline-none text-slate-900 font-bold transition-all"
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button 
            type="submit" disabled={authLoading}
            className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {authLoading ? <Loader2 className="animate-spin" /> : "ログイン"}
          </button>
        </form>

        <button 
          onClick={() => setIsHelpOpen(true)}
          className="w-full text-center text-slate-400 font-bold text-xs hover:text-slate-600 transition-colors flex items-center justify-center gap-2"
        >
          <HelpCircle size={14}/> ログインでお困りですか？
        </button>
      </div>

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 relative shadow-2xl animate-in zoom-in duration-200">
            <button onClick={() => setIsHelpOpen(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900 transition-colors"><X size={24}/></button>
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 w-fit rounded-2xl text-amber-600"><HelpCircle size={32}/></div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Login Help</h2>
                <p className="text-slate-400 text-[10px] font-bold leading-relaxed mt-2 uppercase tracking-widest">パスワードの再発行</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                  メールアドレスを入力して、一時パスワードを発行してください。
                </p>
                
                <form onSubmit={handleRecoveryRequest} className="space-y-3">
                  <input 
                    type="email" required placeholder="takatam@pieroth.jp"
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-500 transition-all font-bold shadow-sm"
                    value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)}
                  />
                  <button 
                    disabled={recoveryLoading}
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    {recoveryLoading ? <Loader2 className="animate-spin" size={14}/> : "一時パスワードを発行する"}
                  </button>
                </form>

                {recoveryStatus && (
                  <div className={`p-4 rounded-xl flex items-start gap-3 border animate-in slide-in-from-top-2 ${recoveryStatus.success ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                    {recoveryStatus.success ? <CheckCircle2 className="shrink-0" size={16}/> : <AlertCircle className="shrink-0" size={16}/>}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase mb-1">{recoveryStatus.success ? "Success" : "Error"}</p>
                      <p className="text-[10px] font-bold leading-tight break-words">{recoveryStatus.message}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center pt-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">IT Support: EXT. 777</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex animate-in fade-in duration-700 text-left">
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen">
        <div className="p-8 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg font-black italic text-xl">P</div>
          <div><span className="font-black text-xl tracking-tighter">PIEROTH</span></div>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <button className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-sm bg-slate-900 text-white shadow-xl">
            <LayoutDashboard size={20}/> <span>Dashboard</span>
          </button>
          <button onClick={() => router.push('/admin/master')} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-sm text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">
            <Database size={20}/> <span>Wine Master</span>
          </button>
        </nav>
        <div className="p-6 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-bold hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
            <LogOut size={20} /> <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">店舗一覧・管理</p>
          </div>
          <button 
            onClick={() => router.push('/admin/settings')}
            className="px-6 py-3.5 bg-amber-500 text-black rounded-2xl font-black flex items-center gap-2 hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 text-sm"
          >
            <Plus size={18}/> 新規店舗登録
          </button>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-10 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={<Store className="text-blue-500"/>} label="Total Stores" value={stores.length.toString()} />
            <StatCard icon={<TrendingUp className="text-emerald-500"/>} label="Performance" value="High" />
            <StatCard icon={<Users className="text-purple-500"/>} label="Active Users" value="100+" />
            <StatCard icon={<Package className="text-amber-500"/>} label="Status" value="Online" />
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="店舗名で検索..." 
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm font-bold text-slate-700 outline-none focus:border-amber-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredStores.map(store => (
              <div key={store.slug} className="group bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all"><Store size={24}/></div>
                    <a href={`/${store.slug}`} target="_blank" className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-amber-500 transition-colors"><ExternalLink size={18}/></a>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 truncate">{store.store_name}</h2>
                    <p className="text-slate-400 font-mono text-xs mt-1">/{store.slug}</p>
                  </div>
                  <button onClick={() => router.push(`/admin/inventory/${store.slug}`)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl">
                    在庫・メニュー更新 <ArrowRight size={18}/>
                  </button>
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
      <div className="p-3 bg-slate-50 w-fit rounded-2xl">{icon}</div>
      <div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-slate-900 mt-1 tracking-tight">{value}</p>
      </div>
    </div>
  );
}
