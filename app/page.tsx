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
      <header className="py-20 px-6 text-center">
        <h1 className="text-5xl font-light tracking-[0.3em] text-[#f8f8f8] mb-6">WINE COLLECTION</h1>
        <div className="h-[1px] w-24 bg-[#c5a059] mx-auto opacity-30"></div>
      </header>

      <div className="max-w-xl mx-auto px-6 space-y-20">
        {wines.filter(w => parseInt(w.stock) > 0).map((wine: any) => (
          <div key={wine.id} className="space-y-8 group">
            <div className="aspect-[3/4] rounded-sm overflow-hidden shadow-2xl relative border border-white/5">
              <img src={wine.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] tracking-[0.4em] font-sans font-black uppercase text-[#c5a059] opacity-80">{wine.country} / {wine.vintage}</p>
                  <h2 className="text-3xl text-white font-light leading-tight">{wine.name_jp}</h2>
                </div>
                <p className="text-2xl font-sans text-white font-bold tracking-tighter">¥{Number(wine.price).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4 text-[10px] font-sans font-black uppercase tracking-[0.2em] opacity-40">
                <span>{wine.type}</span><span>|</span><span>{wine.region}</span><span>|</span><span>{wine.grape}</span>
              </div>
              <div className="relative p-8 bg-white/2 rounded-sm border-l border-[#c5a059]/40 backdrop-blur-sm">
                <Sparkles size={14} className="absolute -top-2 -left-2 text-[#c5a059]" />
                <p className="text-lg text-slate-200 leading-relaxed italic font-light">
                  "{wine.advice || "その土地のテロワールを最大限に表現した、至高の一杯をお楽しみください。"}"
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
