"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Wine as WineIcon, Sparkles, MapPin, Grape } from 'lucide-react';

export default function StoreMenu() {
  const { storeId } = useParams();
  const [wines, setWines] = useState([]);

  useEffect(() => {
    fetch(`/api/wines?storeId=${storeId}`).then(res => res.json()).then(data => setWines(data));
  }, [storeId]);

  return (
    <main className="min-h-screen bg-[#0d0e12] text-[#c5a059] font-serif pb-20">
      <header className="py-20 px-6 text-center">
        <p className="text-[10px] tracking-[0.5em] mb-4 opacity-50 uppercase font-sans font-black">Wine Selection</p>
        <h1 className="text-5xl font-light tracking-[0.2em] text-[#f8f8f8] uppercase">{storeId}</h1>
        <div className="h-[1px] w-24 bg-[#c5a059] mx-auto mt-8 opacity-30"></div>
      </header>

      <div className="max-w-xl mx-auto px-6 space-y-24">
        {wines.filter(w => parseInt(w.stock) > 0).map((wine: any) => (
          <div key={wine.id} className="space-y-10">
            <div className="aspect-[3/4] rounded-sm overflow-hidden shadow-2xl relative border border-white/5 bg-[#1a1c23]">
              {wine.image ? (
                <img src={wine.image} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full opacity-10"><WineIcon size={100}/></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                <div className="space-y-1 pr-4">
                  <p className="text-[10px] tracking-[0.4em] font-sans font-black uppercase text-[#c5a059] opacity-80">{wine.country} / {wine.vintage}</p>
                  <h2 className="text-3xl text-white font-light leading-tight">{wine.name_jp}</h2>
                </div>
                <p className="text-2xl font-sans text-white font-bold tracking-tighter">¥{Number(wine.price).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-8 px-2">
              <div className="flex flex-wrap gap-4 text-[10px] font-sans font-black uppercase tracking-[0.2em] opacity-40">
                <span className="bg-white/10 px-2 py-1 rounded">{wine.type}</span>
                <span className="flex items-center gap-1"><MapPin size={12}/> {wine.region}</span>
                <span className="flex items-center gap-1"><Grape size={12}/> {wine.grape}</span>
              </div>
              <div className="relative p-8 bg-white/5 rounded-sm border-l-2 border-[#c5a059]/40 backdrop-blur-md">
                <Sparkles size={16} className="absolute -top-3 -left-3 text-[#c5a059]" />
                <p className="text-lg text-slate-200 leading-relaxed italic font-light">
                  "{wine.advice || "ソムリエが厳選した、今宵に相応しい特別な一杯をお楽しみください。"}"
                </p>
              </div>
            </div>
          </div>
        ))}
        {wines.length === 0 && <p className="text-center text-slate-600 font-sans font-bold tracking-[0.3em] py-40">Preparing our cellar...</p>}
      </div>
    </main>
  );
}
