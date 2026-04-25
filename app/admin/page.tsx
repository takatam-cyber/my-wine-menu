// app/admin/page.tsx
"use client";
export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Store, Plus, ExternalLink, Database, LayoutDashboard, ArrowRight, LogOut, 
  Loader2, TrendingUp, Users, Package, Search, ChevronRight, Wine, AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch('/api/store/config');
        if (res.status === 401) {
          router.replace('/admin');
          return;
        }
        if (!res.ok) throw new Error("データの取得に失敗しました");
        const data = await res.json();
        setStores(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin');
  };

  const filteredStores = stores.filter(store => 
    store.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-amber-500" size={48} />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Dashboard...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen">
        <div className="p-8 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Wine size={24} />
          </div>
          <div>
            <span className="font-black text-xl tracking-tighter">PIEROTH</span>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Support SaaS</p>
          </div>
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

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-8 py-6 flex items-center justify-between">
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

        <div className="p-8 max-w-7xl mx-auto space-y-10">
          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-600 font-bold flex items-center gap-2">
              <AlertCircle size={20}/> {error}
            </div>
          )}

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
            {filteredStores.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100 text-slate-300 font-bold">
                店舗が登録されていません
              </div>
            ) : (
              filteredStores.map(store => (
                <div key={store.slug} className="group bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <div className="p-8 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all"><Store size={24}/></div>
                      <a href={`/${store.slug}`} target="_blank" className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-amber-500 transition-colors">
                        <ExternalLink size={18}/>
                      </a>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 truncate">{store.store_name}</h2>
                      <p className="text-slate-400 font-mono text-xs mt-1">/{store.slug}</p>
                    </div>
                    <button 
                      onClick={() => router.push(`/admin/inventory/${store.slug}`)} 
                      className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl"
                    >
                      在庫・メニュー更新 <ArrowRight size={18}/>
                    </button>
                  </div>
                </div>
              ))
            )}
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
