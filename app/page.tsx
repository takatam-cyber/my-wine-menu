"use client";

import { useState, useEffect } from 'react';
import { Wine as WineIcon, Sparkles } from 'lucide-react';

export default function Home() {
  const [wines, setWines] = useState([]);

  useEffect(() => {
    fetch('/api/wines').then(res => res.json()).then(data => setWines(Array.isArray(data) ? data : []));
  }, []);

  return (
    <main className="min-h-screen bg-[#0f1115] text-[#d4af37] p-8 font-serif">
      <div className="max-w-5xl mx-auto border border-[#d4af37]/20 p-12 rounded-[3rem]">
        <header className="text-center mb-20">
          <h1 className="text-5xl font-light tracking-[0.3em] mb-4 text-[#f1f1f1]">THE CELLAR</h1>
          <div className="h-[1px] w-24 bg-[#d4af37] mx-auto opacity-50"></div>
          <p className="mt-6 text-sm tracking-widest text-slate-400">Exclusive Wine Selection</p>
        </header>

        <div className="grid grid-cols-1 gap-24">
          {wines.filter(w => parseInt(w.stock) > 0).map((wine: any) => (
            <div key={wine.id} className="flex flex-col md:flex-row gap-16 items-center group">
              <div className="w-full md:w-1/3 aspect-[3/4] overflow-hidden rounded-sm shadow-2xl grayscale hover:grayscale-0 transition-all duration-1000">
                <img src={wine.image} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-8">
                <div className="space-y-2">
                  <p className="text-[#d4af37] text-xs tracking-[0.4em] font-sans font-black uppercase">{wine.country} / {wine.vintage}</p>
                  <h2 className="text-4xl text-[#f1f1f1] font-light leading-snug">{wine.name_jp}</h2>
                  <p className="text-2xl mt-4 font-sans text-white">¥ {Number(wine.price).toLocaleString()}</p>
                </div>

                <div className="relative p-8 bg-[#d4af37]/5 rounded-sm border-l-2 border-[#d4af37]/30">
                  <div className="absolute -top-3 left-4 bg-[#0f1115] px-4 flex items-center gap-2 text-[#d4af37] text-[10px] tracking-widest uppercase font-sans">
                    <Sparkles size={12}/> AI Sommelier Advice
                  </div>
                  <p className="text-lg text-slate-300 leading-relaxed italic">
                    "{wine.advice || "このワインの持つ本来のポテンシャルを、ぜひお客様の五感でお楽しみください。"}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {wines.length === 0 && <p className="text-center text-slate-600 tracking-widest py-40">Currently preparing our collection...</p>}
      </div>
    </main>
  );
}
