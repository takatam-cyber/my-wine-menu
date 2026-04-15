import React, { useState } from 'react';
import { Wine, Search, Filter, ChevronRight } from 'lucide-react';

// ダミーデータ（本来はD1から取得）
const WINE_DATA = [
  { id: 1, name_jp: "シャトー・マルゴー", name_en: "Chateau Margaux", category: "Red", country: "France", price_bottle: 120000, vintage: 2015, description: "五大シャトーの一つ。優雅で気品溢れる香りが特徴です。", tags: ["フルボディ", "エレガント"] },
  { id: 2, name_jp: "モンラッシェ", name_en: "Montrachet", category: "White", country: "France", price_bottle: 85000, vintage: 2018, description: "世界最高峰の白ワイン。濃厚でリッチな味わい。", tags: ["辛口", "リッチ"] },
];

export default function WineMenu() {
  const [activeTab, setActiveTab] = useState('All');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-sans pb-10">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <h1 className="text-2xl font-serif font-bold text-[#d4af37] text-center tracking-widest uppercase">
          Wine List
        </h1>
      </header>

      {/* Category Tabs */}
      <nav className="flex justify-center gap-4 py-6 px-4 overflow-x-auto no-scrollbar">
        {['All', 'Red', 'White', 'Sparkling'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab 
                ? 'bg-[#d4af37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                : 'bg-white/5 text-gray-400 border border-white/10'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Search Bar */}
      <div className="px-6 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="ワイン名や品種で検索..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-[#d4af37] transition-colors"
          />
        </div>
      </div>

      {/* Wine List */}
      <main className="px-6 space-y-6">
        {WINE_DATA.map((wine) => (
          <div 
            key={wine.id}
            className="group relative bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 rounded-2xl p-5 active:scale-[0.98] transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-bold">
                  {wine.country} / {wine.vintage}
                </span>
                <h2 className="text-xl font-serif font-semibold mt-1 leading-tight group-hover:text-[#d4af37] transition-colors">
                  {wine.name_jp}
                </h2>
                <p className="text-xs text-gray-500 italic mt-0.5">{wine.name_en}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white">¥{wine.price_bottle.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500">Bottle</p>
              </div>
            </div>

            <p className="text-sm text-gray-400 line-clamp-2 mb-4 leading-relaxed">
              {wine.description}
            </p>

            <div className="flex flex-wrap gap-2">
              {wine.tags.map(tag => (
                <span key={tag} className="text-[9px] px-2 py-1 bg-white/5 rounded border border-white/5 text-gray-400">
                  {tag}
                </span>
              ))}
            </div>
            
            <ChevronRight className="absolute bottom-5 right-5 w-5 h-5 text-gray-600 group-hover:text-[#d4af37]" />
          </div>
        ))}
      </main>

      {/* Footer Branding */}
      <footer className="mt-12 text-center">
        <p className="text-[10px] text-gray-600 tracking-[0.2em] uppercase">
          Powered by WineCode Elite
        </p>
      </footer>
    </div>
  );
}
