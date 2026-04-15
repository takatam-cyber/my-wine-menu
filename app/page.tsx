export const runtime = 'edge'; // Cloudflareで動かすための魔法の1行

import React from 'react';
import { MapPin, Wine } from 'lucide-react';

export default async function LuxuryWineMenu() {
  // Cloudflare D1データベースからデータを取得
  // @ts-ignore
  const { results } = await process.env.DB.prepare(
    "SELECT * FROM wines WHERE stock > 0 ORDER BY id DESC"
  ).all();

  const wines = results;

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] pb-20 font-sans">
      <header className="pt-20 pb-16 text-center">
        <p className="text-[#d4af37] tracking-[0.4em] text-[10px] uppercase mb-4 opacity-70">The Private Cellar</p>
        <h1 className="text-5xl font-serif font-bold tracking-tight text-white">Wine Collection</h1>
        <div className="w-16 h-[1px] bg-[#d4af37] mx-auto mt-8 opacity-40"></div>
      </header>

      <main className="max-w-2xl mx-auto px-6 space-y-24">
        {wines.map((wine: any) => (
          <div key={wine.id} className="group animate-in fade-in duration-1000">
            {/* ビジュアルエリア */}
            <div className="relative aspect-[4/5] mb-8 overflow-hidden bg-zinc-900 shadow-2xl rounded-sm">
              <img 
                src={wine.image_url || "https://images.unsplash.com/photo-1510850402288-c3f5305c21bd?q=80&w=600"} 
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[3s]" 
                alt={wine.name_jp} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
              <div className="absolute bottom-8 left-8">
                <div className="flex items-center gap-2 text-[#d4af37] text-[10px] tracking-[0.2em] uppercase mb-2 font-bold">
                  <MapPin className="w-3 h-3" />
                  <span>{wine.region} / {wine.country}</span>
                </div>
                <h2 className="text-4xl font-serif font-bold text-white leading-tight mb-1">{wine.name_jp}</h2>
                <p className="text-gray-400 font-serif italic text-sm">{wine.name_en}</p>
              </div>
            </div>

            {/* 詳細スペック */}
            <div className="grid grid-cols-2 gap-8 mb-8 py-6 border-y border-white/10 mx-2">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-2 font-semibold text-zinc-500">Variety</p>
                <p className="text-xs text-gray-200 font-light leading-relaxed">{wine.variety || "---"}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-2 font-semibold text-zinc-500">Appellation</p>
                <p className="text-xs text-gray-200 font-light leading-relaxed">{wine.sub_region || "---"}</p>
              </div>
            </div>

            {/* 価格と説明 */}
            <div className="px-2 space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-serif text-white tracking-tighter">
                   <span className="text-sm mr-1 opacity-60">¥</span>{wine.price.toLocaleString()}
                </span>
                <span className="text-xs text-zinc-500 tracking-widest uppercase italic">Vintage {wine.vintage}</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed font-light italic">
                {wine.description}
              </p>
            </div>
          </div>
        ))}
      </main>

      <footer className="mt-40 pb-20 text-center opacity-30">
        <Wine className="w-6 h-6 mx-auto mb-4 text-[#d4af37]" />
        <p className="font-serif text-[10px] tracking-[0.6em] uppercase">Elegant Digital Menu</p>
      </footer>
    </div>
  );
}
