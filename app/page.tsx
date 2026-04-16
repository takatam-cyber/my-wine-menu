"use client";

import { useState, useEffect } from 'react';
import { Wine as WineIcon, Sparkles, MapPin, Grape } from 'lucide-react';

export default function Home() {
  const [wines, setWines] = useState([]);

  useEffect(() => {
    fetch('/api/wines').then(res => res.json()).then(data => setWines(Array.isArray(data) ? data : []));
  }, []);

  return (
    <main className="min-h-screen bg-[#0d0e12] text-[#c5a059] p-8 font-serif">
      <div className="max-w-5xl mx-auto border border-[#c5a059]/20 p-12 rounded-[3rem] bg-[#14161c] shadow-2xl">
        <header className="text-center mb-24">
          <p className="text-[10px] tracking-[0.5em] mb-4 opacity-60">VINTAGE COLLECTION</p>
          <h1 className="text-6xl font-light tracking-[0.2em] mb-8 text-[#f8f8f8]">WINE LIST</h1>
          <div className="h-[1px] w-32 bg-[#c5a059] mx-auto opacity-40"></div>
        </header>

        <div className="grid grid-cols-1 gap-32">
          {wines.filter(w => parseInt(w.stock) > 0).map((wine: any) => (
            <div key={wine.id} className="flex flex-col md:flex-row gap-20 items-start">
              <div className="w-full md:w-2/5 aspect-[3/4] overflow-hidden rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 relative group">
                <img src={wine.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              
              <div className="flex-1 space-y-10 pt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-[10px] tracking-[0.3em] font-sans font-black uppercase opacity-60">
                    <span>{wine.type}</span><span>|</span><span>{wine.country}</span><span>|</span><span>Vintage {wine.vintage}</span>
                  </div>
                  <h2 className="text-4xl text-white font-light leading-snug">{wine.name_jp}</h2>
                  <p className="text-sm tracking-widest opacity-40 italic">{wine.name_en}</p>
                  <p className="text-3xl font-sans text-white pt-4">¥ {Number(wine.price).toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-6 py-8 border-y border-white/5 font-sans text-[11px] tracking-widest uppercase">
                  <div className="flex items-center gap-3"><MapPin size={14}/> {wine.region}</div>
                  <div className="flex items-center gap-3"><Grape size={14}/> {wine.grape}</div>
                </div>

                <div className="relative p-8 bg-white/2 rounded-xl border-l-2 border-[#c5a059]/40 backdrop-blur-sm">
                  <div className="absolute -top-3 left-6 bg-[#14161c] px-4 flex items-center gap-2 text-[#c5a059] text-[9px] tracking-[0.3em] font-sans font-black uppercase">
                    <Sparkles size={12}/> AI Sommelier Advice
                  </div>
                  <p className="text-lg text-slate-300 leading-relaxed font-light italic">
                    "{wine.advice || "その土地のテロワールを最大限に表現した、至高の一本です。"}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
