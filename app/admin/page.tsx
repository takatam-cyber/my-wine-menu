// app/admin/page.tsx
"use client";
export const runtime = 'edge';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Plus, Search, Database, LayoutDashboard, LogOut, ExternalLink, Settings, QrCode, TrendingUp, Trophy, X } from 'lucide-react';

export default function AdminDashboard() {
  const [stores, setStores] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [rankings, setRankings] = useState<Record<string, any[]>>({});
  const [qrModal, setQrModal] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/store/list')
      .then(res => res.json())
      .then(data => {
        const storeList = Array.isArray(data) ? data : [];
        setStores(storeList);
        // 各店舗のランキングをフェッチ
        storeList.forEach((s: any) => {
          fetch(`/api/analytics/ranking?slug=${s.slug}`)
            .then(res => res.json())
            .then(rankData => setRankings(prev => ({ ...prev, [s.slug]: rankData })))
            .catch(() => {});
        });
      })
      .catch(err => console.error("Fetch error:", err));
  }, []);

  const filteredStores = useMemo(() => 
    stores.filter(s => 
      s.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.slug?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [stores, searchQuery]
  );

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2 italic tracking-tighter">
            <LayoutDashboard className="text-amber-500" /> PIEROTH <span className="text-slate-400 font-light">MS</span>
          </h1>
        </div>
        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
          <LogOut size={22} />
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={20}/>
          <input 
            type="text" placeholder="店舗名またはURLスラッグで検索..." 
            className="w-full h-[64px] pl-14 pr-6 bg-white rounded-3xl shadow-sm outline-none border-2 border-transparent focus:border-amber-500 transition-all font-bold text-lg"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
          />
        </div>

        {/* Store Grid */}
        <div className="grid gap-6">
          {filteredStores.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
              <Store size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold">管理中の店舗がありません</p>
            </div>
          ) : filteredStores.map(store => (
            <div key={store.slug} className="bg-white rounded-[2.5rem] shadow-md border border-slate-100 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                      <Store size={28}/>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 leading-tight">{store.store_name}</h3>
                      <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">/{store.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setQrModal(store.slug)}
                      className="p-4 bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-100 transition-colors shadow-sm"
                    >
                      <QrCode size={22}/>
                    </button>
                    <button 
                      onClick={() => router.push(`/admin/settings?edit=${store.slug}`)}
                      className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-colors shadow-sm"
                    >
                      <Settings size={22}/>
                    </button>
                  </div>
                </div>

                {/* Analytics Topic TOP3 */}
                {rankings[store.slug] && rankings[store.slug].length > 0 && (
                  <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100">
                    <div className="flex items-center gap-2 mb-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      <TrendingUp size={14} className="text-emerald-500" /> 注目銘柄 PVランキング
                    </div>
                    <div className="space-y-3">
                      {rankings[store.slug].slice(0, 3).map((wine: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-slate-50">
                          <span className="font-bold text-slate-700 truncate flex items-center gap-3">
                            <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${idx === 0 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              {idx + 1}
                            </span>
                            {wine.name_jp}
                          </span>
                          <span className="text-[10px] font-black text-amber-600 px-2 py-1 bg-amber-50 rounded-md">{wine.view_count} PV</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => router.push(`/admin/inventory/${store.slug}`)}
                    className="h-[64px] bg-slate-900 text-white rounded-2xl font-black text-sm uppercase hover:bg-amber-500 hover:text-black transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    在庫管理
                  </button>
                  <a 
                    href={`/${store.slug}`} 
                    target="_blank" 
                    className="h-[64px] bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-sm uppercase hover:border-amber-500 hover:text-amber-600 transition-all flex items-center justify-center gap-2"
                  >
                    メニュー <ExternalLink size={18}/>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* QR Code Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm" onClick={() => setQrModal(null)}>
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center space-y-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-xl">Menu QR Code</h2>
              <button onClick={() => setQrModal(null)}><X size={24} className="text-slate-300" /></button>
            </div>
            <div className="aspect-square bg-slate-100 rounded-3xl flex items-center justify-center border-4 border-slate-50">
               {/* 簡易的に外部APIを使用してQRを生成 */}
               <img 
                 src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '/' + qrModal)}`} 
                 alt="QR Code"
                 className="w-48 h-48"
               />
            </div>
            <p className="text-slate-400 font-bold text-sm">これをスキャンすると<br/>メニューが直接開きます</p>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={() => router.push('/admin/settings')}
        className="fixed bottom-10 right-6 w-20 h-20 bg-amber-500 text-white rounded-full shadow-[0_20px_50px_rgba(245,158,11,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
      >
        <Plus size={36} strokeWidth={3} />
      </button>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 px-10 py-5 flex justify-around items-center md:hidden z-30">
        <button onClick={() => router.push('/admin')} className="flex flex-col items-center gap-1 text-amber-600">
          <LayoutDashboard size={24}/><span className="text-[10px] font-black uppercase">STORES</span>
        </button>
        <button onClick={() => router.push('/admin/master')} className="flex flex-col items-center gap-1 text-slate-400">
          <Database size={24}/><span className="text-[10px] font-black uppercase">MASTER</span>
        </button>
      </nav>
    </div>
  );
}
