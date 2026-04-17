"use client";
export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Wine as WineIcon, Sparkles, MapPin, Grape } from 'lucide-react';

export default function StoreMenu() {
  const { storeId } = useParams();
  const [wines, setWines] = useState([]);

  useEffect(() => {
    if (storeId) {
      fetch(`/api/wines?storeId=${storeId}`)
        .then(res => res.json())
        .then(data => setWines(Array.isArray(data) ? data : []));
    }
  }, [storeId]);

  return (
    <main className="min-h-screen bg-[#0d0e12] text-[#c5a059] font-serif pb-24">
      <header className="py-24 px-6 text-center border-b border-[#c5a059]/10">
        <p className="text-[10px] tracking-[0.5em] mb-4 opacity-50 uppercase font-sans font-black">Sommelier Selection</p>
        <h1 className="text-5xl font-light tracking-[0.2em] text-[#f8f8f8] uppercase">{storeId}</h1>
        <div className="h-[1px] w-24 bg-[#c5a059] mx-auto mt-8 opacity-30"></div>
      </header>

      <div className="max-w-xl mx-auto px-6 space-y-24 mt-16">
        {wines.filter((w: any) => parseInt(w.stock) > 0).map((wine: any) => (
          <div key={wine.id} className="space-y-12">
            <div className="aspect-[3/4] rounded-sm overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] relative border border-white/5 bg-[#1a1c23]">
              {wine.image ? (
                <img src={wine.image} alt={wine.name_jp} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full opacity-5"><WineIcon size={120}/></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
              <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
                <div className="space-y-1 pr-4">
                  <p className="text-[10px] tracking-[0.4em] font-sans font-black uppercase text-[#c5a059] opacity-80">{wine.country} / {wine.vintage}</p>
                  <h2 className="text-4xl text-white font-light leading-tight">{wine.name_jp}</h2>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-sans text-white font-bold tracking-tighter">¥{Number(wine.price).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-8 px-2">
              <div className="flex flex-wrap gap-4 text-[11px] font-sans font-black uppercase tracking-[0.2em] opacity-40">
                <span className="bg-white/10 px-3 py-1 rounded-full">{wine.type}</span>
                <span className="flex items-center gap-1.5"><MapPin size={12}/> {wine.region}</span>
                <span className="flex items-center gap-1.5"><Grape size={12}/> {wine.grape}</span>
              </div>
              <div className="relative p-10 bg-white/2 rounded-sm border-l-2 border-[#c5a059]/40 backdrop-blur-xl">
                <Sparkles size={20} className="absolute -top-3 -left-4 text-[#c5a059] opacity-50" />
                <p className="text-xl text-slate-100 leading-relaxed italic font-light">
                  "{wine.advice || "ソムリエが厳選した至高の一杯。その深い味わいと香りをお楽しみください。"}"
                </p>
              </div>
            </div>
          </div>
        ))}
        {wines.length === 0 && <p className="text-center text-slate-600 font-sans font-bold py-48 opacity-50 uppercase text-xs">Cellar is currently empty</p>}
      </div>
    </main>
  );
}
