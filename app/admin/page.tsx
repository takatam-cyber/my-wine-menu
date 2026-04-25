// app/admin/page.tsx
"use client";
export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { 
  Store, Plus, ExternalLink, Database, LayoutDashboard, ArrowRight, LogOut, 
  Loader2, TrendingUp, Users, Package, Search, AlertCircle, Lock, Mail, HelpCircle, X, CheckCircle2, Settings, QrCode, Download, Share2
} from 'lucide-react';

const useRouter = () => {
  return {
    push: (url: string) => { if (typeof window !== 'undefined') window.location.href = url; },
    replace: (url: string) => { if (typeof window !== 'undefined') window.location.replace(url); }
  };
};

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // QR Modal state
  const [qrModalStore, setQrModalStore] = useState<any>(null);
  
  const router = useRouter();

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/store/config');
      if (res.ok) {
        const data = await res.json();
        setStores(Array.isArray(data) ? data : []);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (err) {
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      if (res.ok) {
        setIsLoggedIn(true);
        await fetchStores();
      } else {
        const data = await res.json();
        setError(data.error || "認証に失敗しました");
      }
    } catch (err) {
      setError("接続エラーが発生しました");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsLoggedIn(false);
    setStores([]);
    router.replace('/admin');
  };

  const filteredStores = stores.filter(store => 
    store.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPublicUrl = (slug: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/${slug}`;
  };

  if (loading && !isLoggedIn) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-amber-600" size={48} />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">PIEROTH AUTHENTICATING...</p>
    </div>
  );

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-[#0d0e12] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white rounded-[3rem] p-12 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg mb-4 font-black italic text-2xl">P</div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Pieroth Admin</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">営業支援・メニュー管理システム</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-xs font-bold border border-red-100 animate-pulse">
            <AlertCircle size={16} /> <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Email (@pieroth.jp)</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="email" required 
                className="w-full p-5 pl-14 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-amber-500 outline-none text-slate-900 font-bold transition-all text-left"
                placeholder="takatam@pieroth.jp"
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
                className="w-full p-5 pl-14 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-amber-500 outline-none text-slate-900 font-bold transition-all text-left"
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
        <button onClick={() => setIsHelpOpen(true)} className="w-full text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
          <HelpCircle size={12}/> ログインにお困りの方はこちら
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex text-left relative">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen">
        <div className="p-8 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg font-black italic text-xl">P</div>
          <span className="font-black text-xl tracking-tighter uppercase">Pieroth</span>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <button className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-sm bg-slate-900 text-white shadow-xl shadow-slate-900/10 transition-all">
            <LayoutDashboard size={20}/> <span>店舗ダッシュボード</span>
          </button>
          <button onClick={() => router.push('/admin/master')} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-sm text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">
            <Database size={20}/> <span>ワインマスター</span>
          </button>
          <button onClick={() => router.push('/admin/settings')} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-sm text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">
            <Plus size={20}/> <span>新規店舗登録</span>
          </button>
        </nav>
        <div className="p-6 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 font-bold hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
            <LogOut size={20} /> <span className="text-xs uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Manage Stores</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">担当店舗一覧 ({stores.length})</p>
          </div>
          <button onClick={() => router.push('/admin/settings')} className="px-6 py-3.5 bg-amber-500 text-black rounded-2xl font-black flex items-center gap-2 hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 text-sm">
            <Plus size={18}/> 新規店舗
          </button>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={<Store className="text-amber-500"/>} label="ACTIVE STORES" value={stores.length.toString()} />
            <StatCard icon={<TrendingUp className="text-emerald-500"/>} label="AVG VIEWS" value="248" />
            <StatCard icon={<Package className="text-blue-500"/>} label="WINE MASTER" value="1200+" />
            <StatCard icon={<Users className="text-purple-500"/>} label="CLIENTS" value="84" />
          </div>

          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" 
              placeholder="店舗名またはスラッグで検索..." 
              className="w-full pl-14 pr-6 py-5 bg-white rounded-3xl border border-slate-200 shadow-sm font-bold text-slate-700 outline-none focus:border-amber-500 transition-all text-left"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
            {filteredStores.map(store => (
              <div key={store.slug} className="group bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col">
                <div className="p-8 flex-1 space-y-6 text-left">
                  <div className="flex justify-between items-start">
                    <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-500 shadow-inner">
                      <Store size={24}/>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setQrModalStore(store)}
                        className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title="メニューのQRコードを表示"
                      >
                        <QrCode size={18}/>
                      </button>
                      <a href={`/${store.slug}`} target="_blank" className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-amber-500 hover:bg-amber-50 transition-colors">
                        <ExternalLink size={18}/>
                      </a>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight truncate">{store.store_name}</h2>
                    <p className="text-slate-400 font-mono text-[10px] mt-1 tracking-widest uppercase">ID: {store.slug}</p>
                  </div>
                  <div className="flex gap-4 pt-4 border-t border-slate-50">
                    <div className="flex-1">
                      <p className="text-[9px] font-black text-slate-300 uppercase mb-1">Items</p>
                      <p className="font-bold text-slate-600">--</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-black text-slate-300 uppercase mb-1">Status</p>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black">ONLINE</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                  <button onClick={() => router.push(`/admin/inventory/${store.slug}`)} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10">
                    在庫管理 <ArrowRight size={14}/>
                  </button>
                  <button onClick={() => router.push(`/admin/settings?slug=${store.slug}`)} className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-amber-600 hover:border-amber-500 transition-all">
                    <Settings size={18}/>
                  </button>
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>

      {/* QR Code Modal */}
      {qrModalStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 relative shadow-2xl text-center space-y-8 animate-in zoom-in duration-300">
            <button 
              onClick={() => setQrModalStore(null)} 
              className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 transition-colors"
            >
              <X size={24}/>
            </button>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{qrModalStore.store_name}</h3>
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.2em]">Digital Menu QR Code</p>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-100 flex flex-col items-center gap-4">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getPublicUrl(qrModalStore.slug))}`}
                alt="QR Code"
                className="w-full aspect-square max-w-[200px] shadow-lg rounded-2xl border-4 border-white"
              />
              <p className="text-[10px] font-mono text-slate-400 break-all">{getPublicUrl(qrModalStore.slug)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(getPublicUrl(qrModalStore.slug))}`, '_blank')}
                className="flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-black transition-all"
              >
                <Download size={14}/> 画像保存
              </button>
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: qrModalStore.store_name,
                      text: 'ワインメニューはこちら',
                      url: getPublicUrl(qrModalStore.slug)
                    });
                  } else {
                    document.execCommand('copy');
                    const dummy = document.createElement('input');
                    document.body.appendChild(dummy);
                    dummy.value = getPublicUrl(qrModalStore.slug);
                    dummy.select();
                    document.execCommand('copy');
                    document.body.removeChild(dummy);
                  }
                }}
                className="flex items-center justify-center gap-2 py-4 bg-amber-500 text-black rounded-2xl font-black text-xs hover:bg-amber-400 transition-all"
              >
                <Share2 size={14}/> リンクを共有
              </button>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
              このQRコードを店頭に設置することで、<br/>お客様は瞬時にメニューへアクセスできます。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
      <div className="p-3 bg-slate-50 w-fit rounded-2xl">{icon}</div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-slate-900 mt-0.5 tracking-tighter">{value}</p>
      </div>
    </div>
  );
}
