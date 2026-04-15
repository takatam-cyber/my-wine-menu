"use client";

import React, { useState } from 'react';
import { Wine, Search, Filter, ChevronRight, MapPin } from 'lucide-react';

const WINE_DATA = [
  { 
    id: 1, 
    name_jp: "シャトー・マルゴー", 
    name_en: "Chateau Margaux", 
    category: "Red", 
    country: "France", 
    region: "Bordeaux",
    price_bottle: 120000, 
    vintage: 2015, 
    image: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80&w=600",
    description: "「ワインの女王」と称されるボルドーの最高峰。華やかで官能的な香りと、ベルベットのような舌触りが、飲む者を至福の時へと誘います。", 
    tags: ["Full Body", "Elegant"] 
  },
  { 
    id: 2, 
    name_jp: "モンラッシェ", 
    name_en: "Montrachet", 
    category: "White", 
    country: "France", 
    region: "Bourgogne",
    price_bottle: 85000, 
    vintage: 2018, 
    image: "https://images.unsplash.com/photo-1566393028639-d108a42c46a7?auto=format&fit=crop&q=80&w=600",
    description: "世界中の愛好家が垂涎する白ワインの最高聖地。圧倒的な凝縮感とミネラル、そしてナッツのような芳醇な余韻が長く続きます。", 
    tags: ["Dry", "Rich"] 
  },
  { 
    id: 3, 
    name_jp: "クリスタル", 
    name_en: "Louis Roederer Cristal", 
    category: "Sparkling", 
    country: "France", 
    region: "Champagne",
    price_bottle: 55000, 
    vintage: 2014, 
    image: "https://images.unsplash.com/photo-1594498653385-d5172c532c00?auto=format&fit=crop&q=80&w=600",
    description: "1876年、ロシア皇帝アレクサンドル2世のために造られた傑作。精密に磨き上げられたダイヤモンドのような輝きと純粋さ。", 
    tags: ["Sparkling", "Prestige"] 
  },
];

export default function LuxuryWineMenu() {
  const [activeTab, setActiveTab] = useState('All');

  const filteredWines = activeTab === 'All' 
    ? WINE_DATA 
    : WINE_DATA.filter(wine => wine.category === activeTab);

  return (
    <div className="min-h-screen bg-luxury-gradient text-[#e5e5e5] pb-20">
      {/* エレガントなヘッダー */}
      <header className="pt-16 pb-12 px-6 text-center">
        <p className="text-[#d4af37] tracking-[0.4em] text-[10px] uppercase mb-3 opacity-80">
          The Private Cellar
        </p>
        <h1 className="text-4xl font-luxury font-bold text-white tracking-tight">
          Wine Collection
        </h1>
        <div className="w-12 h-[1px] bg-[#d4af37] mx-auto mt-6 opacity-50"></div>
      </header>

      {/* 洗練されたカテゴリナビ */}
      <nav className="flex justify-center gap-8 mb-12 overflow-x-auto no-scrollbar px-6">
        {['All', 'Red', 'White', 'Sparkling'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-xs tracking-[0.2em] uppercase transition-all duration-500 pb-2 border-b ${
              activeTab === tab 
                ? 'text-[#d4af37] border-[#d4af37]' 
                : 'text-gray-500 border-transparent'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* ワインカードリスト */}
      <main className="max-w-2xl mx-auto px-6 space-y-16">
        {filteredWines.map((wine) => (
          <div key={wine.id} className="group relative overflow-hidden transition-all duration-700">
            {/* 画像エリア */}
            <div className="relative aspect-[4/5] overflow-hidden mb-6 bg-zinc-900 shadow-2xl">
              <img 
                src={wine.image} 
                alt={wine.name_jp}
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-[2s]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
              
              {/* 重ねる情報 */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-2 text-[#d4af37] mb-2">
                  <MapPin className="w-3 h-3" />
                  <span className="text-[10px] tracking-widest uppercase">{wine.region}, {wine.country}</span>
                </div>
                <h2 className="text-3xl font-luxury font-bold text-white mb-1 tracking-wide">
                  {wine.name_jp}
                </h2>
                <p className="font-luxury italic text-gray-400 text-sm tracking-wide">{wine.name_en}</p>
              </div>
            </div>

            {/* 詳細情報 */}
            <div className="space-y-4 px-2">
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <span className="text-2xl font-luxury text-white">
                   <span className="text-sm mr-1">¥</span>{wine.price_bottle.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 tracking-widest uppercase">Vintage {wine.vintage}</span>
              </div>
              
              <p className="text-sm text-gray-400 leading-relaxed font-light italic">
                {wine.description}
              </p>

              <div className="flex gap-4 pt-2">
                {wine.tags.map(tag => (
                  <span key={tag} className="text-[9px] tracking-widest uppercase text-[#d4af37] border border-[#d4af37]/30 px-2 py-1">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </main>

      <footer className="mt-32 pb-20 text-center opacity-40">
        <p className="font-luxury text-[10px] tracking-[0.5em] uppercase">
          Curated Excellence
        </p>
      </footer>
    </div>
  );
}
