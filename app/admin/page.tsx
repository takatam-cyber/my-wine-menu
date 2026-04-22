"use client";
export const runtime = 'edge';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Plus, Search, Database, LayoutDashboard, LogOut, ExternalLink, Settings, QrCode, TrendingUp, Trophy } from 'lucide-react';

export default function AdminDashboard() {
  const [stores, setStores] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [rankings, setRankings] = useState<Record<string, any[]>>({});
  const router = useRouter();

  useEffect(() => {
    fetch('/api/store/list')
      .then(res => res.json())
      .then(data => {
        const storeList = Array.isArray(data) ? data : [];
        setStores(storeList);
        // 各店舗のランキングをフェッチ（簡略化のため並列実行）
        storeList.forEach((s: any) => {
          fetch(`/api/analytics/ranking?slug=${s.slug}`)
            .then(res => res.json())
            .then(rankData => setRankings(prev => ({ ...prev, [s.slug]: rankData })));
        });
      });
  }, []);

  const filteredStores = useMemo(() => 
    stores.filter(s => s.store_name.includes(searchQuery) || s.slug.includes(searchQuery)),
    [stores, searchQuery]
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2 italic"><LayoutDashboard className="text-amber-500" /> PIEROTH MS</h1>
        </div>
        <button onClick={() => fetch('/api/auth/logout', { method: 'POST' }).then(() => router.push('/admin/login'))} className="p-2 text-slate-400">
          <LogOut size={20} />
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Search - モバイルで押しやすい高さ */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
          <input 
            type="text" placeholder="店舗名で検索..." 
            className="w-full h-[56px] pl-12 pr-4 bg-white rounded-2xl shadow-sm outline-none border-2 border-transparent focus:border-amber-500 transition-all font-bold"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
          />
        </div>

        {/* Store Grid */}
        <div className="grid gap-6">
          {filteredStores.map(store => (
            <div key={store.slug} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-900 text-white rounded-2xl"><Store size={24}/></div>
                    <div>
                      <h3 className="text-lg font-black">{store.store_name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{store.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => alert(`QR表示: /${store.slug}`)} className="p-3 bg-amber-50 text-amber-600 rounded-xl"><QrCode size={20}/></button>
                    <button onClick={() => router.push(`/admin/settings?edit=${store.slug}`)} className="p-3 bg-slate-50 text-slate-400 rounded-xl"><Settings size={20}/></button>
                  </div>
                </div>

                {/* Analytics Widget - 営業の武器 */}
                {rankings[store.slug] && rankings[store.slug].length > 0 && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 mb-3 text-xs font-black text-slate-500 uppercase tracking-tighter">
                      <TrendingUp size={14} className="text-emerald-500" /> 人気の注目銘柄 TOP3
                    </div>
                    <div className="space-y-2">
                      {rankings[store.slug].slice(0, 3).map((wine: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="font-bold text-slate-700 truncate flex items-center gap-2">
                            <Trophy size={12} className={idx === 0 ? "text-amber-500" : "text-slate-300"} />
                            {wine.name_jp}
                          </span>
                          <span className="text-[10px] font-black bg-white px-2 py-1 rounded-md shadow-sm">{wine.view_count} PV</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Action - モバイル最適化ボタン */}
                <button 
                  onClick={() => router.push(`/admin/inventory/${store.slug}`)}
                  className="w-full h-[56px] bg-slate-900 text-white rounded-2xl font-black text-sm uppercase hover:bg-amber-500 hover:text-black transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  在庫・価格を管理
                </button>
                
                <a href={`/${store.slug}`} target="_blank" className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-600 py-2">
                  公開メニューを見る <ExternalLink size={14}/>
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Action Button for Mobile */}
      <button 
        onClick={() => router.push('/admin/settings')}
        className="fixed bottom-8 right-6 w-16 h-16 bg-amber-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-20"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {/* Footer Nav for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-8 py-3 flex justify-around items-center md:hidden">
        <button onClick={() => router.push('/admin')} className="flex flex-col items-center gap-1 text-amber-600"><LayoutDashboard size={20}/><span className="text-[10px] font-bold">店舗</span></button>
        <button onClick={() => router.push('/admin/master')} className="flex flex-col items-center gap-1 text-slate-400"><Database size={20}/><span className="text-[10px] font-bold">マスター</span></button>
      </nav>
    </div>
  );
}
