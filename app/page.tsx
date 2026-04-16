"use client";

import { useState, useEffect } from 'react';
import { Wine as WineIcon, Sparkles } from 'lucide-react';

export default function Home() {
  const [wines, setWines] = useState([]);

  useEffect(() => {
    fetch('/api/wines').then(res => res.json()).then(data => setWines(Array.isArray(data) ? data : []));
  }, []);

  return (
    <main className="min-h-screen bg-[#0d0e12] text-[#c5a059] font-serif pb-20">
      <header className="py-16 px-6 text-center">
        <h1 className="text-4xl font-light tracking-[0.3em] text-white mb-4">WINE LIST</h1>
        <div className="h-[1px] w-20 bg-[#c5a059] mx-auto opacity-40"></div>
      </header>

      <div className="px-4 space-y-16">
        {wines.filter(w => parseInt(w.stock) > 0).map((wine: any) => (
          <div key={wine.id} className="space-y-6">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl relative border border-white/5">
              <img src={wine.image} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] tracking-[0.3em] font-sans font-black uppercase text-[#c5a059] opacity-80">{wine.country} / {wine.vintage}</p>
                  <h2 className="text-2xl text-white font-light leading-tight">{wine.name_jp}</h2>
                </div>
                <p className="text-2xl font-sans text-white font-bold">¥{Number(wine.price).toLocaleString()}</p>
              </div>
            </div>

            <div className="px-4 space-y-4">
              <div className="flex gap-4 text-[10px] font-sans font-black uppercase tracking-widest opacity-40">
                <span>{wine.type}</span><span>•</span><span>{wine.region}</span><span>•</span><span>{wine.grape}</span>
              </div>
              <div className="relative p-6 bg-white/5 rounded-2xl border-l border-[#c5a059]/40">
                <Sparkles size={14} className="absolute -top-2 -left-2 text-[#c5a059]" />
                <p className="text-md text-slate-200 leading-relaxed italic font-light">
                  "{wine.advice || "ソムリエが厳選した、今宵に相応しい特別な一杯をお楽しみください。"}"
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {wines.length === 0 && <p className="text-center text-slate-600 py-40 tracking-widest">Preparing Cellar...</p>}
    </main>
  );
}
