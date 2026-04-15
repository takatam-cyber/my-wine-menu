// app/page.tsx の既存のコードに以下の「チャット機能」を組み込みます
"use client"; // ファイルの先頭に追加

import React, { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';

// ... (既存のLuxuryWineMenuの中身)

// <footer> の前あたりに以下のコンポーネントを追加
function AiSommelier() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const askSommelier = async () => {
    if (!query) return;
    setLoading(true);
    const res = await fetch('/api/sommelier', {
      method: 'POST',
      body: JSON.stringify({ message: query }),
    });
    const data = await res.json();
    setAnswer(data.answer);
    setLoading(false);
  };

  return (
    <section className="mt-32 p-8 bg-zinc-900/50 rounded-[2rem] border border-[#d4af37]/20 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-6 text-[#d4af37]">
        <Sparkles className="w-5 h-5" />
        <h2 className="font-serif text-xl">AI Sommelier</h2>
      </div>
      
      <div className="space-y-4">
        <div className="relative">
          <input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="「魚料理に合うのは？」「特別な日に飲みたい一本は？」"
            className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-[#d4af37] transition-all"
          />
          <button 
            onClick={askSommelier}
            disabled={loading}
            className="absolute right-2 top-2 p-2 bg-[#d4af37] rounded-lg text-black hover:scale-105 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {answer && (
          <div className="p-6 bg-white/5 rounded-2xl text-sm leading-relaxed italic text-zinc-300 border-l-2 border-[#d4af37] animate-in fade-in slide-in-from-top-2">
            「 {answer} 」
          </div>
        )}
      </div>
    </section>
  );
}
