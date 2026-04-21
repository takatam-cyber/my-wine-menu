"use client";
export const runtime = 'edge';

import { useState, useEffect, use } from 'react';
import { Sparkles, Wine, Info, Utensils, X } from 'lucide-react';

export default function PublicMenu({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [wines, setWines] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/wines?slug=${slug}`).then(res => res.json()).then(setWines);
    fetch(`/api/store/config/public?slug=${slug}`).then(res => res.json()).then(setConfig);
  }, [slug]);

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans p-6">
      <header className="text-center py-10 border-b border-white/10">
        <h1 className="text-3xl font-serif italic tracking-[0.2em]">{config?.store_name || 'LOADING...'}</h1>
        <div className="w-12 h-[1px] bg-amber-600 mx-auto mt-4" />
      </header>

      <div className="max-w-xl mx-auto space-y-12 py-12">
        {wines.map(wine => (
          <div key={wine.id} className="relative group border-b border-white/5 pb-8">
            <div className="flex gap-6">
              <img src={wine.image_url} className="w-24 h-32 object-cover rounded shadow-2xl" />
              <div className="flex-1 space-y-2 text-left">
                <p className="text-amber-500 text-[10px] font-bold tracking-widest uppercase">{wine.country}</p>
                <h2 className="text-xl font-serif">{wine.name_jp}</h2>
                <p className="text-lg font-light">¥{Number(wine.price_bottle).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-amber-600 rounded-full flex items-center gap-3 shadow-2xl animate-pulse">
        <Sparkles size={20}/> <span className="text-xs font-bold tracking-widest">ASK SOMMELIER</span>
      </div>
    </main>
  );
}
