"use client";

import React, { useState } from 'react';
import { Wine, Search, Filter, ChevronRight } from 'lucide-react';

// ダミーデータ（本来は今後作るデータベース D1 から取得します）
const WINE_DATA = [
  { 
    id: 1, 
    name_jp: "シャトー・マルゴー", 
    name_en: "Chateau Margaux", 
    category: "Red", 
    country: "France", 
    price_bottle: 120000, 
    vintage: 2015, 
    description: "五大シャトーの一つ。優雅で気品溢れる香りが特徴です。シルクのようなタンニンが楽しめます。", 
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
    description: "世界最高峰の白ワイン。濃厚でリッチ、バターのような滑らかさと圧倒的な余韻。", 
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
    description: "皇帝に捧げられた最高級シャンパーニュ。精密で繊細、そして力強いエネルギーを感じます。", 
    tags: ["シャンパーニュ", "辛口", "華やか"] 
  },
];

export default function WineMenu() {
  const [activeTab, setActiveTab] = useState('All');

  // カテゴリで絞り込む機能
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

      {/* カテゴリ切り替えタブ */}
      <nav className="flex justify-center gap-2 py-6 px-4 overflow-x-auto no-scrollbar">
        {['All', 'Red', 'White', 'Sparkling'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
              activeTab === tab 
                ? 'bg-[#d4af37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                : 'bg-white/5 text-gray-400 border border-white
