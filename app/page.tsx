"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, Wine, Sparkles, Send, Loader2 } from 'lucide-react';

export default function LuxuryWineMenu() {
  const [wines, setWines] = useState([]);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // 1. ワイン一覧の読み込み
  useEffect(() => {
    fetch('/api/wines').then(res => res.json()).then(data => setWines(data));
  }, []);

  // 2. AIソムリエに相談する処理
  const askSommelier = async () => {
    if (!query || chatLoading) return;
    setChatLoading(true);
    setAnswer("");
    try {
      const res = await fetch('/api/sommelier', {
        method: 'POST',
        body: JSON.stringify({ message: query }),
      });
      const data = await res.json();
      setAnswer(data.answer);
    } catch (e) {
      setAnswer("申し訳ございません。ソムリエが席を外しております。");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] pb-40 font-sans leading-relaxed">
      {/* ヘッダー */}
      <header className="pt-24 pb-20 text-center">
        <p className="text-[#d4af37] tracking-[0.5em] text-[10px] uppercase mb-4 opacity-80 font-bold">The Private Cellar</p>
        <h1 className="text-5xl font-serif font-bold tracking-tighter text-white">Wine Collection</h1>
        <div className="w-12 h-[1px] bg-[#d4af37] mx-auto mt-8 opacity-30"></div>
      </header>

      <main className="max-w-xl mx-auto px-8 space-y-32">
        {/* ワインリスト */}
        {wines.map((wine: any) => (
          <div key={wine.id} className="group transition-all duration-1000">
            <div className="relative aspect-[3/4] mb-10 overflow-hidden bg-zinc-900 rounded-sm shadow-2xl">
              <img src={wine.image_url || "https://images.unsplash.com/photo-1510850402288-c3f5305c21bd"} className="w-full h-full object-cover opacity-50 transition-transform duration-[5s] group-hover:scale-110" alt={wine.name_jp} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
              <div className="absolute bottom-10 left-0 w-full px-8 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 text-[#d4af37] text-[10px] tracking-[0.3em] uppercase mb-3 font-bold">
                  <MapPin className="w-3 h-3" />
                  <span>{wine.sub_region || wine.country}</span>
                </div>
                <h2 className="text-4xl font-serif font-bold text-white mb-2 leading-tight">{wine.name_jp}</h2>
                <p className="text-gray-400 font-serif italic text-sm opacity-60">{wine.name_en}</p>
              </div>
            </div>
            <div className="flex justify-between items-baseline px-4">
              <span className="text-2xl font-serif text-white tracking-tighter italic">¥{wine.price.toLocaleString()}</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold border-b border-zinc-800 pb-1">{wine.vintage} Vintage</span>
            </div>
          </div>
        ))}

        {/* --- AIソムリエセクション --- */}
        <section className="mt-52 p-10 bg-zinc-900/30 rounded-[3rem] border border-[#d4af37]/10 backdrop-blur-2xl shadow-2xl">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="p-3 bg-[#d4af37]/5 rounded-2xl mb-4">
              <Sparkles className="w-6 h-6 text-[#d4af37]" />
            </div>
            <h2 className="font-serif text-2xl text-white mb-2 italic">Ask the AI Sommelier</h2>
            <p className="text-[9px] text-zinc-500 uppercase tracking-[0.4em]">Personal Digital Concierge</p>
          </div>
          
          <div className="space-y-8">
            <div className="relative">
              <input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && askSommelier()}
                placeholder="「お肉料理に合う重めの一本は？」「今日の気分は白」"
                className="w-full bg-black/40 border border-white/5 p-6 pr-16 rounded-2xl text-sm outline-none focus:border-[#d4af37]/40 transition-all placeholder:text-zinc-700 font-light"
              />
              <button 
                onClick={askSommelier}
                disabled={chatLoading}
                className="absolute right-3 top-3 p-4 bg-[#d4af37] rounded-xl text-black hover:scale-105 transition-all disabled:opacity-20"
              >
                {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>

            {answer && (
              <div className="p-8 bg-[#d4af37]/5 rounded-[2rem] text-sm leading-[2] text-zinc-300 border-l border-[#d4af37]/20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <p className="font-serif italic opacity-90">
                  「 {answer} 」
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="mt-60 pb-20 text-center opacity-30">
        <Wine className="w-6 h-6 mx-auto mb-6 text-[#d4af37]" />
        <p className="text-[9px] tracking-[0.8em] uppercase font-bold text-zinc-500">Elegant Digital Experience</p>
      </footer>
    </div>
  );
}
