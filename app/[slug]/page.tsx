"use client";
export const runtime = 'edge';
import { useState, useEffect, use } from 'react';
import { Sparkles } from 'lucide-react';

export default function PublicMenu({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [wines, setWines] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/wines?slug=${slug}`).then(res => res.json()).then(setWines);
    fetch(`/api/store/config/public?slug=${slug}`).then(res => res.json()).then(setConfig);
  }, [slug]);

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans selection:bg-amber-900">
      <div className="fixed inset-0 bg-luxury-gradient opacity-40 pointer-events-none" />
      
      <header className="relative text-center py-20 border-b border-white/5">
        <h1 className="text-4xl font-serif italic tracking-[0.3em] text-amber-50/90">{config?.store_name || 'LOADING...'}</h1>
        <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto mt-6" />
      </header>

      <div className="relative max-w-2xl mx-auto space-y-20 py-20 px-6">
        {wines.map(wine => (
          <div key={wine.id} className="group transition-all duration-700 hover:translate-y-[-4px]">
            <div className="flex gap-10 items-start">
              <div className="relative shrink-0">
                <img src={wine.image_url} className="w-32 h-44 object-cover rounded shadow-2xl grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" />
                <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.3)]" />
              </div>
              <div className="flex-1 space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <p className="text-amber-600 text-[10px] font-bold tracking-[0.2em] uppercase">{wine.country} / {wine.region}</p>
                  {wine.is_priority === 1 && <span className="px-2 py-0.5 bg-amber-900/30 text-amber-500 text-[8px] font-black tracking-tighter border border-amber-900/50 rounded uppercase">Special Selection</span>}
                </div>
                <h2 className="text-2xl font-serif tracking-wide leading-tight">{wine.name_jp}</h2>
                <p className="text-white/40 text-xs font-light tracking-widest uppercase">{wine.name_en}</p>
                <p className="text-xl font-light text-amber-200/80">¥{Number(wine.price_bottle).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="fixed bottom-12 left-1/2 -translate-x-1/2 px-10 py-5 bg-amber-700 hover:bg-amber-600 text-white rounded-full flex items-center gap-4 shadow-[0_20px_50px_rgba(180,83,9,0.3)] transition-all active:scale-95 group overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        <Sparkles size={20} className="text-amber-200 animate-pulse" />
        <span className="text-xs font-black tracking-[0.2em] uppercase">Ask Sommelier</span>
      </button>
    </main>
  );
}
