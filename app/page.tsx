"use client";

import React, { useState } from 'react';
import { Wine, Search, Filter, ChevronRight } from 'lucide-react';

// あなたのお店のワインリスト（仮データ）
const WINE_DATA = [
  { 
    id: 1, 
    name_jp: "シャトー・マルゴー", 
    name_en: "Chateau Margaux", 
    category: "Red", 
    country: "France", 
    price_bottle: 120000, 
    vintage: 2015, 
    description: "ボルドー五大シャトーの一つ。優雅で気品溢れる香りと、シルクのような滑らかな口当たりが特徴です。", 
    tags: ["フルボディ", "エレガント", "ボルドー"] 
  },
  { 
    id: 2, 
    name_jp: "モンラッシェ", 
    name_en: "Montrachet", 
    category: "White", 
    country: "France", 
    price_bottle: 85000, 
    vintage: 2018, 
    description: "世界最高峰の辛口白ワイン。濃厚でリッチな果実味と、バターのような滑らかさが楽しめます。", 
    tags: ["辛口", "リッチ", "ブルゴーニュ"] 
  },
  { 
    id: 3, 
    name_jp: "ルイ・ロデレール クリスタル", 
    name_en: "Louis Roederer Cristal", 
    category: "Sparkling", 
    country: "France", 
    price_bottle: 55000, 
    vintage: 2014, 
    description: "ロシア皇帝に献上された最高級シャンパーニュ。精密で繊細、そして力強いエネルギーを感じます。", 
    tags: ["シャンパーニュ", "辛口", "華やか"] 
  },
];

export default function WineMenu() {
  const [activeTab, setActiveTab] = useState('All');

  // カテゴリ（赤・白など）で絞り込む機能
  const filteredWines = activeTab === 'All' 
    ? WINE_DATA 
    : WINE_DATA.filter(wine => wine.category === activeTab);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-sans pb-10">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <h1 className="text-2xl font-serif font-bold text-[#d4af37] text-center tracking-widest uppercase">
          Wine List
        </h1>
      </header>

      {/* カテゴリ選択タブ */}
      <nav className="flex justify-center gap-2 py-6 px-4 overflow-x-auto no-scrollbar">
        {['All', 'Red', 'White', 'Sparkling'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
              activeTab === tab 
                ? 'bg-[#d4af37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                : 'bg-white/5 text-gray-400 border border-white/10'
            }`}
          >
            {tab === 'All' ? 'すべて' : tab}
          </button>
        ))}
      </nav>

      {/* 検索バー */}
      <div className="px-6 mb-8 text-black">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="ワイン名や産地で検索..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#d4af37] transition-colors"
          />
        </div>
      </div>

      {/* リスト表示 */}
      <main className="px-6 space-y-6">
        {filteredWines.map((wine) => (
          <div 
            key={wine.id}
            className="group relative bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 rounded-2xl p-5 active:scale-[0.98] transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-bold">
                    {wine.country}
                  </span>
                  <span className="text-[10px] text-gray-500">|</span>
                  <span className="text-[10px] text-gray-400">{wine.vintage}</span>
                </div>
                <h2 className="text-lg font-serif font-semibold mt-1 leading-tight group-hover:text-[#d4af37] transition-colors">
                  {wine.name_jp}
                </h2>
                <p className="text-[10px] text-gray-500 italic mt-0.5">{wine.name_en}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white">¥{wine.price_bottle.toLocaleString()}</p>
                <p className="text-[9px] text-gray-600 uppercase">Bottle</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">
              {wine.description}
            </p>

            <div className="flex flex-wrap gap-2">
              {wine.tags.map(tag => (
                <span key={tag} className="text-[9px] px-2 py-0.5 bg-white/5 rounded border border-white/5 text-gray-500">
                  #{tag}
                </span>
              ))}
            </div>
            
            <div className="absolute bottom-5 right-5 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
              <ChevronRight className="w-5 h-5 text-[#d4af37]" />
            </div>
          </div>
        ))}
      </main>

      {/* フッター */}
      <footer className="mt-16 pb-10 text-center">
        <div className="flex justify-center mb-4">
          <Wine className="w-6 h-6 text-[#d4af37] opacity-50" />
        </div>
        <p className="text-[10px] text-gray-600 tracking-[0.3em] uppercase">
          Elegant Digital Menu Experience
        </p>
      </footer>
    </div>
  );
}
