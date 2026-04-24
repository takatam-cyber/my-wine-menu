// app/[slug]/page.tsx
"use client";

// Cloudflare Pagesのビルドエラーを解消するために追加
export const runtime = 'edge';

import { useState, useEffect, use } from 'react';
import { Wine, Info, Utensils, Star, MessageSquare, ChevronRight, X } from 'lucide-react';

export default function PublicMenu({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [wines, setWines] = useState<any[]>([]);
  const [storeName, setStoreName] = useState('WINE MENU');
  const [selectedWine, setSelectedWine] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    
    // 店舗情報とワインリストを並列取得
    Promise.all([
      fetch(`/api/store/config/public?slug=${slug}`).then(res => res.json()),
      fetch(`/api/wines?slug=${slug}`).then(res => res.json())
    ]).then(([config, wineData]) => {
      setStoreName(config.store_name || 'WINE MENU');
      setWines(Array.isArray(wineData) ? wineData : []);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-amber-500 animate-pulse font-luxury text-2xl tracking-widest">PIEROTH</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-stone-200 font-sans selection:bg-amber-900/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/5 p-6 text-center">
        <h1 className="font-luxury text-3xl tracking-[0.2em] text-white uppercase">{storeName}</h1>
        <p className="text-[10px] tracking-[0.4em] text-amber-500 mt-2 font-bold uppercase">Wine Selection</p>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-12 pb-24">
        {/* Recommendation Section */}
        {wines.some(w => w.is_priority) && (
          <section className="space-y-6">
            <h2 className="font-luxury text-xl italic text-amber-400 border-l-2 border-amber-500 pl-4">Sommelier's Choice</h2>
            <div className="grid gap-6">
              {wines.filter(w => w.is_priority).map(wine => (
                <WineCard key={wine.id} wine={wine} onClick={() => setSelectedWine(wine)} />
              ))}
            </div>
          </section>
        )}

        {/* Standard List */}
        <section className="space-y-6">
          <h2 className="font-luxury text-xl italic text-stone-500 border-l-2 border-stone-700 pl-4">The Collection</h2>
          <div className="grid gap-6">
            {wines.filter(w => !w.is_priority).map(wine => (
              <WineCard key={wine.id} wine={wine} onClick={() => setSelectedWine(wine)} />
            ))}
          </div>
        </section>
      </main>

      {/* Detail Modal */}
      {selectedWine && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/90 backdrop-blur-sm transition-all animate-in fade-in">
          <div className="bg-[#111] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-[2rem] sm:rounded-[2rem] border border-white/10 shadow-2xl relative">
            <button onClick={() => setSelectedWine(null)} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
              <X size={24} />
            </button>
            
            <div className="p-8 sm:p-12 space-y-8">
              <div className="flex flex-col sm:flex-row gap-8 items-start">
                <div className="w-full sm:w-1/3 aspect-[3/4] bg-stone-900 rounded-2xl overflow-hidden shadow-inner">
                  <img src={selectedWine.image_url} alt={selectedWine.name_jp} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-4">
                  <span className="text-amber-500 text-xs font-bold tracking-[0.2em] uppercase">{selectedWine.country} / {selectedWine.region}</span>
                  <h3 className="font-luxury text-3xl text-white leading-tight">{selectedWine.name_jp}</h3>
                  <p className="font-mono text-stone-500 text-xs uppercase">{selectedWine.name_en}</p>
                  <div className="flex gap-6 pt-4 border-t border-white/5">
                    <div>
                      <p className="text-[9px] text-stone-500 uppercase tracking-widest mb-1">Glass</p>
                      <p className="text-xl font-luxury text-amber-400">¥{Number(selectedWine.price_glass).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-stone-500 uppercase tracking-widest mb-1">Bottle</p>
                      <p className="text-xl font-luxury text-amber-400">¥{Number(selectedWine.price_bottle).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-8 border-t border-white/5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-500">
                    <MessageSquare size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Sommelier Note</span>
                  </div>
                  <p className="text-stone-300 leading-relaxed text-lg italic font-serif">
                    "{selectedWine.ai_explanation || selectedWine.menu_short}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <span className="text-[10px] text-stone-500 uppercase font-bold tracking-widest">Variety</span>
                    <p className="text-sm text-stone-200">{selectedWine.grape}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] text-stone-500 uppercase font-bold tracking-widest">Pairing</span>
                    <p className="text-sm text-stone-200">{selectedWine.pairing}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WineCard({ wine, onClick }: { wine: any, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="group relative bg-white/5 border border-white/5 rounded-3xl p-6 flex items-center gap-6 cursor-pointer hover:bg-white/[0.08] hover:border-white/20 transition-all active:scale-[0.98]"
    >
      <div className="w-20 h-24 bg-stone-900 rounded-xl overflow-hidden shrink-0 shadow-lg group-hover:scale-105 transition-transform">
        <img src={wine.image_url} alt={wine.name_jp} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-amber-500/80 uppercase tracking-widest">{wine.country}</span>
          {wine.is_priority === 1 && <Star size={10} className="fill-amber-500 text-amber-500" />}
        </div>
        <h3 className="font-luxury text-lg text-stone-100 truncate group-hover:text-white transition-colors">{wine.name_jp}</h3>
        <p className="text-stone-500 text-[10px] truncate uppercase font-mono tracking-tighter">{wine.name_en}</p>
        <div className="flex gap-4 mt-2">
          <span className="text-xs font-bold text-stone-300">G: ¥{Number(wine.price_glass).toLocaleString()}</span>
          <span className="text-xs font-bold text-stone-300">B: ¥{Number(wine.price_bottle).toLocaleString()}</span>
        </div>
      </div>
      <ChevronRight className="text-stone-700 group-hover:text-amber-500 transition-colors" size={20} />
    </div>
  );
}
