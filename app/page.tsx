"use client";

import { useState, useEffect } from 'react';
import { Wine as WineIcon, UtensilsCrossed, Sparkles } from 'lucide-react';

export default function Home() {
  const [wines, setWines] = useState([]);

  useEffect(() => {
    fetch('/api/wines').then(res => res.json()).then(data => setWines(Array.isArray(data) ? data : []));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black text-center mt-8 mb-16 text-slate-800 tracking-tighter uppercase tracking-[0.3em]">Wine Selection</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {wines.map((wine: any) => (
            <div key={wine.id} className="bg-white rounded-[3.5rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-2xl transition-all duration-500 group">
              <div className="aspect-[4/3] relative bg-slate-200 overflow-hidden">
                <img src={wine.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md px-5 py-2 rounded-2xl shadow-xl border border-white/50">
                  <span className="text-xl font-black text-slate-900">¥{wine.price ? Number(wine.price).toLocaleString() : '---'}</span>
                </div>
              </div>

              <div className="p-10">
                <div className="flex gap-2 mb-4">
                  <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase">{wine.country}</span>
                  <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{wine.vintage}</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-6 leading-tight min-h-[4rem]">{wine.name_jp}</h2>
                
                <div className="space-y-8">
                  {/* AIソムリエのアドバイス */}
                  <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase mb-3 tracking-widest">
                      <Sparkles size={14}/> <span>Sommelier Advice</span>
                    </div>
                    <p className="text-sm text-blue-900 font-bold leading-relaxed">{wine.advice || '特別なひとときを演出する一本です。'}</p>
                  </div>

                  {/* ペアリング */}
                  <div className="px-2">
                    <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase mb-3 tracking-widest">
                      <UtensilsCrossed size={14}/> <span>Best Pairing</span>
                    </div>
                    <p className="text-sm text-slate-800 font-bold leading-relaxed">{wine.pairing || '旬の食材を活かした料理と共に。'}</p>
                  </div>
                  
                  <div className="pt-6 border-t border-slate-50">
                    <p className="text-xs text-slate-400 leading-relaxed italic">{wine.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
