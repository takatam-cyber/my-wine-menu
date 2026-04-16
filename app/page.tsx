"use client";

import { useState, useEffect } from 'react';
import { Wine as WineIcon, UtensilsCrossed, Sparkles, Ghost } from 'lucide-react';

export default function Home() {
  const [wines, setWines] = useState([]);

  useEffect(() => {
    fetch('/api/wines').then(res => res.json()).then(data => setWines(Array.isArray(data) ? data : []));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black text-center mt-8 mb-16 text-slate-800 tracking-tighter uppercase tracking-[0.3em]">Wine Selection</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {wines.map((wine: any) => {
            const isSoldOut = parseInt(wine.stock) <= 0;
            return (
              <div key={wine.id} className={`bg-white rounded-[3.5rem] overflow-hidden shadow-sm border border-slate-100 transition-all duration-500 relative ${isSoldOut ? 'opacity-60 grayscale' : 'hover:shadow-2xl'}`}>
                
                {/* 売り切れ表示 */}
                {isSoldOut && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
                    <div className="border-4 border-red-500 text-red-500 px-6 py-2 font-black text-3xl rotate-[-12deg] rounded-xl shadow-2xl">SOLD OUT</div>
                  </div>
                )}

                <div className="aspect-[4/3] relative bg-slate-200">
                  <img src={wine.image} className="w-full h-full object-cover" />
                  <div className="absolute bottom-6 right-6 bg-white/95 px-5 py-2 rounded-2xl shadow-xl border">
                    <span className="text-xl font-black text-slate-900">¥{Number(wine.price).toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-10">
                  <div className="flex gap-2 mb-4">
                    <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 rounded-full">{wine.country}</span>
                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{wine.vintage}</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-6 leading-tight min-h-[4rem]">{wine.name_jp}</h2>
                  
                  <div className="space-y-8">
                    <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100">
                      <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase mb-3 tracking-widest">
                        <Sparkles size={14}/> <span>Sommelier Advice</span>
                      </div>
                      <p className="text-sm text-blue-900 font-bold leading-relaxed">{wine.advice}</p>
                    </div>
                    <div className="px-2">
                      <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase mb-3 tracking-widest">
                        <UtensilsCrossed size={14}/> <span>Best Pairing</span>
                      </div>
                      <p className="text-sm text-slate-800 font-bold leading-relaxed">{wine.pairing}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
