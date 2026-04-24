// app/[slug]/page.tsx
"use client";

export const runtime = 'edge';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sparkles, X, Send, Wine, ChevronRight, Crown, MapPin, 
  MessageSquare, Utensils, GlassWater, Heart, Filter,
  Search, Info, ChevronDown, Star
} from 'lucide-react';

/**
 * プレミアム・スケルトンローダー
 */
const SkeletonCard = () => (
  <div className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 animate-pulse">
    <div className="flex gap-4">
      <div className="w-12 h-18 bg-white/10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="h-2 w-12 bg-white/10 rounded" />
        <div className="h-4 w-3/4 bg-white/10 rounded" />
        <div className="h-3 w-1/4 bg-white/10 rounded" />
      </div>
    </div>
  </div>
);

const getSafeUrl = (path: string) => {
  if (!path) return '#';
  if (typeof window === 'undefined') return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  try {
    const origin = window.location.origin;
    if (origin && origin !== 'null' && !origin.startsWith('blob:')) {
      return origin.replace(/\/+$/, '') + cleanPath;
    }
    const base = window.location.href.split('?')[0].split('#')[0].replace(/\/(admin|partner|\[slug\]).*/, '');
    return base.replace(/\/+$/, '') + cleanPath;
  } catch (e) { return cleanPath; }
};

export default function PublicMenu({ params }: { params: any }) {
  const [wines, setWines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusedWineId, setFocusedWineId] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const filteredWines = useMemo(() => {
    if (activeCategory === 'All') return wines;
    return wines.filter(w => w.color === activeCategory);
  }, [wines, activeCategory]);

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
      setAiMessages(prev => [...prev, { role: 'assistant', content: "誠に恐れ入ります。現在ソムリエが席を外しております。" }]);
    }
    setIsAiTyping(false);
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans pb-32 relative overflow-x-hidden antialiased">
      {/* プレミアム・グラデーション背景 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[50%] bg-[radial-gradient(circle_at_center,rgba(180,83,9,0.15)_0%,transparent_70%)] opacity-50" />
        <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-3xl" />
      </div>
      
      {/* ヘッダー：ブランドの威厳 */}
      <header className="relative z-50 p-6 flex flex-col items-center gap-1 bg-black/60 backdrop-blur-xl border-b border-white/5 sticky top-0">
        <h1 className="text-2xl font-serif italic text-amber-500 tracking-tighter">Pieroth</h1>
        <p className="text-[7px] font-black tracking-[0.6em] text-white/30 uppercase">Exclusive Wine Selection</p>
      </header>

      {loading ? (
        <div className="relative z-10 p-6 space-y-6">
          <div className="h-6 w-32 bg-white/5 rounded-full animate-pulse" />
          <div className="flex gap-4 overflow-x-hidden">
            {[1, 2].map(i => <div key={i} className="min-w-[280px] h-40 bg-white/5 rounded-[2.5rem] animate-pulse" />)}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        </div>
      ) : (
        <div className="relative z-10">
          {/* RECOMMENDED：カルーセルに「質感」を */}
          <section className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-500/80 font-black text-[10px] tracking-[0.4em] uppercase"><Crown size={14}/> Recommended</div>
              <span className="text-[8px] text-white/20 font-black tracking-widest">{wines.filter(w => w.is_priority === 1).length} ITEMS</span>
            </div>
            <div className="flex gap-5 overflow-x-auto no-scrollbar snap-x px-1">
              {wines.filter(w => w.is_priority === 1).map(w => (
                <div key={w.id} onClick={() => setFocusedWineId(w.id)} className="min-w-[300px] bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 rounded-[2.5rem] p-7 snap-center flex gap-6 hover:border-amber-500/40 transition-all active:scale-[0.98] shadow-2xl">
                  <div className="relative shrink-0">
                    <img src={w.image_url} className="w-16 h-36 object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]" alt="" />
                    <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-black shadow-lg"><Star size={14} fill="currentColor" /></div>
                  </div>
                  <div className="flex flex-col justify-center gap-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-amber-500/60 tracking-widest uppercase">{w.country}</p>
                      <h3 className="text-[15px] font-bold leading-tight line-clamp-2 pr-2">{w.name_jp}</h3>
                    </div>
                    <p className="text-2xl font-serif text-amber-100 italic">¥{Number(w.price_bottle).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* クイックカテゴリーフィルター */}
          <div className="px-6 flex gap-2 overflow-x-auto no-scrollbar sticky top-20 bg-transparent z-[40] py-2">
            {['All', '赤', '白', '泡', 'Rose', 'Sweet'].map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${activeCategory === cat ? 'bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 border-white/10 text-white/40'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* リスト表示：情報の階層整理 */}
          <section className="px-6 space-y-2 mt-8">
            {filteredWines.map(w => (
              <div key={w.id} onClick={() => setFocusedWineId(w.id)} className="group flex items-center gap-5 bg-white/[0.02] active:bg-white/[0.1] border border-white/5 rounded-3xl p-5 transition-all">
                <div className="w-14 h-20 bg-white/[0.03] rounded-2xl flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
                  <img src={w.image_url} className="w-full h-full object-contain" alt="" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 text-[8px] font-black text-amber-500/50 uppercase tracking-[0.2em]">
                    {w.country} <span className="text-white/10">•</span> {w.color} <span className="text-white/10">•</span> {w.vintage}
                  </div>
                  <h3 className="text-[13px] font-bold truncate leading-none mb-1">{w.name_jp}</h3>
                  <p className="text-[10px] font-medium text-white/20 italic truncate">{w.name_en}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-100 italic">¥{Number(w.price_bottle).toLocaleString()}</p>
                  <p className="text-[8px] font-black text-white/20 mt-1 uppercase">Btl only</p>
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* AIソムリエ：高級感のある「おもてなし」ボタン */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-[240px]">
        <button 
          onClick={() => setIsAiOpen(true)}
          className="w-full h-16 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-white rounded-full shadow-[0_20px_50px_rgba(180,83,9,0.4)] flex items-center justify-center gap-4 active:scale-95 transition-all border border-white/20 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
          <Sparkles size={20} className="text-amber-200" />
          <span className="text-[11px] font-black tracking-[0.2em] uppercase">Sommelier AI</span>
        </button>
      </div>

      {/* チャットモーダル：透過とブラッシュアップ */}
      {isAiOpen && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex flex-col animate-in fade-in duration-500">
          <header className="p-7 flex justify-between items-center border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-black shadow-xl shadow-amber-500/20"><Sparkles size={24}/></div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest">Pieroth AI Sommelier</h2>
                <p className="text-[8px] text-amber-500 font-bold tracking-[0.3em] uppercase mt-1">Direct Consultation</p>
              </div>
            </div>
            <button onClick={() => setIsAiOpen(false)} className="p-3 bg-white/5 rounded-full active:scale-90 transition-all"><X size={20}/></button>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {aiMessages.length === 0 && (
              <div className="text-center py-16 space-y-8 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500/40 border border-amber-500/20"><Wine size={40}/></div>
                <div className="space-y-2">
                  <h3 className="text-lg font-serif italic text-amber-100">Welcome to our Cellar</h3>
                  <p className="text-[11px] font-medium text-white/30 leading-relaxed max-w-[240px] mx-auto uppercase tracking-tighter">
                    本日の気分や料理をお聞かせください。<br/>最適な一本をご案内いたします。
                  </p>
                </div>
                <div className="flex flex-col gap-2 max-w-[260px] mx-auto">
                  {['ステーキに合う重厚な赤を', '前菜に合う爽やかなスパークリング', 'ピーロート一押しの逸品は？'].map(q => (
                    <button key={q} onClick={() => { setAiQuery(q); }} className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold text-white/60 text-left flex items-center justify-between group active:bg-white/10">
                      {q} <ChevronRight size={14} className="text-amber-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {aiMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] p-6 rounded-[2.5rem] text-[13px] leading-relaxed shadow-2xl ${msg.role === 'user' ? 'bg-amber-600 text-white rounded-tr-none' : 'bg-white/5 text-white/80 rounded-tl-none border border-white/5'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isAiTyping && (
              <div className="flex justify-start px-2">
                <div className="flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 bg-amber-500/40 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-amber-500/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-amber-500/80 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleAiSubmit} className="p-6 bg-black border-t border-white/5 flex gap-3">
            <input 
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="メッセージを入力..."
              className="flex-1 h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold outline-none focus:border-amber-500/50 transition-all placeholder:text-white/10"
            />
            <button 
              type="submit" 
              disabled={!aiQuery.trim() || isAiTyping}
              className="w-16 h-16 bg-amber-500 text-black rounded-2xl flex items-center justify-center active:scale-95 transition-all disabled:opacity-20"
            >
              <Send size={24} strokeWidth={3} />
            </button>
          </form>
        </div>
      )}

      {/* 詳細モーダル：情報の整理 */}
      {focusedWineId && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in slide-in-from-bottom-20 duration-500" onClick={() => setFocusedWineId(null)}>
          <div className="w-full max-w-lg bg-[#080808] rounded-t-[3rem] sm:rounded-[3rem] border-t sm:border border-white/10 p-8 pt-12 pb-12 overflow-y-auto max-h-[95vh] no-scrollbar shadow-[0_-20px_50px_rgba(0,0,0,0.5)]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setFocusedWineId(null)} className="absolute top-6 right-6 p-3 bg-white/5 rounded-full text-white/40 active:scale-90 transition-all"><X size={20}/></button>
            {(() => {
              const w = wines.find(x => x.id === focusedWineId);
              if (!w) return null;
              return (
                <div className="space-y-10">
                  <div className="flex flex-col items-center text-center gap-6">
                    <img src={w.image_url} className="w-28 h-60 object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.8)]" alt="" />
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 text-[10px] font-black tracking-widest text-amber-500 uppercase">
                        <MapPin size={10} /> {w.country} <span className="text-white/10">•</span> {w.vintage}
                      </div>
                      <h2 className="text-2xl font-serif text-white leading-tight px-4">{w.name_jp}</h2>
                      <p className="text-xs text-white/20 italic font-medium uppercase tracking-widest">{w.name_en}</p>
                    </div>
                    <div className="text-3xl font-serif text-amber-100 italic">¥{Number(w.price_bottle).toLocaleString()}</div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-6 rounded-3xl text-[13px] text-white/80 leading-relaxed italic relative">
                      <Sparkles className="absolute -top-3 -left-3 text-amber-500" size={20} />
                      {w.ai_explanation}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 border border-white/5">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Grapes</span>
                        <span className="text-xs font-bold text-amber-500">{w.grape || 'N/A'}</span>
                      </div>
                      <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 border border-white/5">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Body</span>
                        <span className="text-xs font-bold text-amber-500">{w.body}/5</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </main>
  );
}
