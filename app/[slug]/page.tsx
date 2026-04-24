// app/[slug]/page.tsx
"use client";

export const runtime = 'edge';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, X, Send, Wine, ChevronRight, Crown, MapPin, 
  Loader2, MessageSquare, Utensils, GlassWater, Heart
} from 'lucide-react';

/**
 * ユーティリティ: 環境に応じた安全なURL生成
 */
const getSafeUrl = (path: string) => {
  if (!path) return '#';
  if (typeof window === 'undefined') return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  try {
    const origin = window.location.origin;
    if (origin && origin !== 'null' && !origin.startsWith('blob:')) {
      return origin.replace(/\/+$/, '') + cleanPath;
    }
    const base = window.location.href.split('?')[0].split('#')[0]
      .replace(/\/(admin|partner|\[slug\]).*/, '');
    return base.replace(/\/+$/, '') + cleanPath;
  } catch (e) { return cleanPath; }
};

export default function PublicMenu({ params }: { params: any }) {
  const [wines, setWines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusedWineId, setFocusedWineId] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  
  // AIソムリエ用ステート
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    const resolve = async () => { 
      const p = await params; 
      setSlug(p?.slug || 'demo'); 
    }; 
    resolve(); 
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    fetch(getSafeUrl(`/api/wines?slug=${slug}`))
      .then(res => res.json())
      .then(data => setWines(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [slug]);

  // チャットスクロール制御
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim() || isAiTyping) return;

    const userMsg = aiQuery;
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setAiQuery("");
    setIsAiTyping(true);

    try {
      const res = await fetch(getSafeUrl('/api/ai/sommelier'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, query: userMsg })
      });
      const data = await res.json();
      setAiMessages(prev => [...prev, { role: 'assistant', content: data.answer || data.error }]);
    } catch {
      setAiMessages(prev => [...prev, { role: 'assistant', content: "通信エラーが発生しました。" }]);
    }
    setIsAiTyping(false);
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center font-black text-amber-500 animate-pulse">PREPARING SELECTION...</div>;

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans pb-32 relative overflow-x-hidden">
      {/* 背景 */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e1b15_0%,#050505_75%)] pointer-events-none" />
      
      <header className="relative z-50 p-6 flex justify-between items-center bg-black/40 backdrop-blur-md border-b border-white/5 sticky top-0">
        <h1 className="text-xl font-serif italic text-amber-500 tracking-tighter">Pieroth Menu</h1>
        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-black font-black text-[10px] shadow-lg shadow-amber-500/20">P</div>
      </header>

      {/* 特におすすめセクション */}
      <section className="relative z-10 p-6 space-y-6">
        <div className="flex items-center gap-2 text-amber-500/60 font-black text-[10px] tracking-[0.4em] uppercase"><Crown size={14}/> Recommended</div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x">
          {wines.filter(w => w.is_priority === 1).map(w => (
            <div key={w.id} onClick={() => setFocusedWineId(w.id)} className="min-w-[280px] bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-6 snap-center flex gap-5 active:scale-95 transition-all">
              <img src={w.image_url} className="w-16 h-32 object-contain drop-shadow-2xl" alt="" />
              <div className="flex flex-col justify-between py-1">
                <h3 className="text-sm font-bold leading-tight line-clamp-2">{w.name_jp}</h3>
                <p className="text-xl font-light italic text-amber-200">¥{Number(w.price_bottle).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 全リスト */}
      <section className="relative z-10 px-6 space-y-3 mt-4">
        <div className="flex items-center gap-2 text-white/20 font-black text-[10px] tracking-[0.4em] uppercase mb-4">Wine Collection</div>
        {wines.map(w => (
          <div key={w.id} onClick={() => setFocusedWineId(w.id)} className="flex items-center gap-4 bg-white/[0.02] active:bg-white/[0.08] border border-white/5 rounded-2xl p-4 transition-all">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-white/5 ${w.color === '赤' ? 'bg-red-950/30 text-red-500' : 'bg-amber-950/30 text-amber-500'}`}><Wine size={18} /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-black text-amber-500/40 uppercase tracking-widest">{w.country}</p>
              <h3 className="text-[13px] font-bold truncate">{w.name_jp}</h3>
            </div>
            <div className="text-right text-sm font-light italic text-amber-100">¥{Number(w.price_bottle).toLocaleString()}</div>
            <ChevronRight size={14} className="text-white/10" />
          </div>
        ))}
      </section>

      {/* AIソムリエボタン (Floating Action Button) */}
      <button 
        onClick={() => setIsAiOpen(true)}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-800 text-white rounded-full shadow-2xl flex items-center gap-3 active:scale-95 transition-all border border-white/20"
      >
        <Sparkles size={18} className="text-amber-200 animate-pulse" />
        <span className="text-[10px] font-black tracking-[0.2em] uppercase">AI Sommelier</span>
      </button>

      {/* AIソムリエチャットモーダル */}
      {isAiOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
          <header className="p-6 flex justify-between items-center border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-black"><Sparkles size={20}/></div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest">AI Sommelier</h2>
                <p className="text-[8px] text-amber-500 font-bold">Powered by Cloudflare AI</p>
              </div>
            </div>
            <button onClick={() => setIsAiOpen(false)} className="p-2 bg-white/5 rounded-full"><X size={20}/></button>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {aiMessages.length === 0 && (
              <div className="text-center py-20 space-y-6">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-amber-500/20"><MessageSquare size={32}/></div>
                <p className="text-xs font-bold text-white/40 leading-relaxed max-w-[200px] mx-auto">
                  「お肉料理に合うワインは？」「デザートと一緒に楽しみたい」など、何でもご相談ください。
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['ステーキに合う赤', '爽やかな白', '今日のおすすめ'].map(q => (
                    <button key={q} onClick={() => setAiQuery(q)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/60 hover:text-white transition-all">{q}</button>
                  ))}
                </div>
              </div>
            )}
            
            {aiMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-5 rounded-[2rem] text-[13px] leading-relaxed shadow-xl ${msg.role === 'user' ? 'bg-amber-600 text-white rounded-tr-none' : 'bg-white/10 text-white rounded-tl-none border border-white/5'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isAiTyping && (
              <div className="flex justify-start">
                <div className="bg-white/10 p-5 rounded-[2rem] rounded-tl-none flex gap-1">
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleAiSubmit} className="p-6 bg-black/40 border-t border-white/10 flex gap-3">
            <input 
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="ソムリエに相談する..."
              className="flex-1 h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-bold outline-none focus:border-amber-500/50 transition-all"
            />
            <button 
              type="submit" 
              disabled={!aiQuery.trim() || isAiTyping}
              className="w-14 h-14 bg-amber-500 text-black rounded-2xl flex items-center justify-center active:scale-90 transition-all disabled:opacity-20"
            >
              <Send size={20} strokeWidth={3} />
            </button>
          </form>
        </div>
      )}

      {/* ワイン詳細モーダル (既存機能) */}
      {focusedWineId && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-2xl flex items-end animate-in slide-in-from-bottom-20 duration-500" onClick={() => setFocusedWineId(null)}>
          <div className="w-full bg-[#080808] rounded-t-[3rem] border-t border-white/10 p-8 pt-10 pb-12 overflow-y-auto max-h-[90vh] no-scrollbar" onClick={e => e.stopPropagation()}>
            <button onClick={() => setFocusedWineId(null)} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full"><X size={20}/></button>
            {(() => {
              const w = wines.find(x => x.id === focusedWineId);
              if (!w) return null;
              return (
                <div className="space-y-8">
                  <div className="flex gap-6 items-start">
                    <img src={w.image_url} className="w-28 aspect-[3/5] object-contain drop-shadow-2xl" alt="" />
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-amber-500 uppercase"><MapPin size={10} /> {w.country} <span className="text-white/20">•</span> {w.vintage}</div>
                      <h2 className="text-2xl font-serif text-white leading-tight">{w.name_jp}</h2>
                      <p className="text-3xl font-light text-amber-100 italic">¥{Number(w.price_bottle).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-white/[0.03] border-l-2 border-amber-500/40 p-6 rounded-r-3xl text-[13px] text-white/80 leading-relaxed italic">{w.ai_explanation}</div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </main>
  );
}
