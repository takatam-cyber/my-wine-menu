// app/[slug]/page.tsx
"use client";

export const runtime = 'edge';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Sparkles, X, Send, Loader2, Wine, Info, Star, 
  Filter, ArrowUpDown, ChevronDown, GlassWater, Languages,
  Trophy, Flame
} from 'lucide-react';

/**
 * 翻訳・定数定義（Pieroth MS Luxury Standard）
 */
const translations = {
  ja: {
    loading: "PREPARING PIEROTH SELECTION...",
    all: "すべて",
    red: "赤ワイン",
    white: "白ワイン",
    rose: "ロゼワイン",
    sparkling: "スパークリング",
    sortPrice: "価格順",
    bottle: "BOTTLE",
    glass: "GLASS",
    aiConsult: "AIソムリエに相談する",
    recommend: "SOMMELIER'S PICK",
    monthly: "今月の一本",
    radar: { body: "ボディ", sweet: "甘味", tannin: "渋み", acid: "酸味" },
    chatTitle: "Wine Concierge",
    chatPrompt: "今夜の気分や、お料理に合わせて最適な一本をエスコートいたします。"
  },
  en: {
    loading: "PREPARING PIEROTH SELECTION...",
    all: "All",
    red: "Red",
    white: "White",
    rose: "Rosé",
    sparkling: "Sparkling",
    sortPrice: "Price",
    bottle: "BOTTLE",
    glass: "GLASS",
    aiConsult: "Consult AI Sommelier",
    recommend: "SOMMELIER'S PICK",
    monthly: "Monthly Special",
    radar: { body: "Body", sweet: "Sweet", tannin: "Tannin", acid: "Acid" },
    chatTitle: "Wine Concierge",
    chatPrompt: "I will escort you to the perfect bottle based on your mood or meal."
  }
};

const getSafeUrl = (path: string) => {
  if (typeof window === 'undefined') return path;
  try {
    const origin = window.location.origin;
    const baseUrl = (!origin || origin === 'null' || origin.startsWith('blob:')) ? window.location.href : origin;
    return new URL(path, baseUrl).href;
  } catch (e) { return path; }
};

/**
 * Dynamic Flavor Radar (アニメーション描画対応)
 */
function FlavorRadar({ data, lang }: { data: any, lang: 'ja' | 'en' }) {
  const size = 100;
  const center = size / 2;
  const scale = (val: number) => (val / 5) * (size / 2.5);
  const t = translations[lang].radar;

  const pts = [
    `${center},${center - scale(data.body || 0)}`,
    `${center + scale(data.sweetness || 0)},${center}`,
    `${center},${center + scale(data.tannins || 0)}`,
    `${center - scale(data.acidity || 0)},${center}`
  ].join(' ');

  return (
    <div className="relative w-24 h-24 flex items-center justify-center group/radar">
      <div className="absolute inset-0 bg-amber-500/5 rounded-full blur-xl scale-150 opacity-0 group-hover/radar:opacity-100 transition-opacity duration-1000" />
      <svg width={size} height={size} className="transform rotate-45 drop-shadow-[0_0_8px_rgba(245,158,11,0.2)]">
        <circle cx={center} cy={center} r={size/2.5} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        <line x1={0} y1={center} x2={size} y2={center} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        <line x1={center} y1={0} x2={center} y2={size} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        <polygon 
          points={pts} 
          fill="rgba(245, 158, 11, 0.45)" 
          stroke="#f59e0b" 
          strokeWidth="1.5"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col justify-between p-1.5 text-[7px] font-black text-amber-500/70 uppercase tracking-tighter pointer-events-none">
        <span className="text-center">{t.body}</span>
        <div className="flex justify-between px-0.5 mt-4"><span>{t.acid}</span><span>{t.sweet}</span></div>
        <span className="text-center mb-1">{t.tannin}</span>
      </div>
    </div>
  );
}

export default function PublicMenu({ params }: { params: any }) {
  const [lang, setLang] = useState<'ja' | 'en'>('ja');
  const [slug, setSlug] = useState<string | null>(null);
  const [wines, setWines] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterColor, setFilterColor] = useState("すべて");
  const [translatedExplanations, setTranslatedExplanations] = useState<Record<string, string>>({});

  const t = translations[lang];

  useEffect(() => {
    const resolve = async () => {
      const p = await params;
      let s = p?.slug;
      if (!s || s === '[slug]') {
        const urlParams = new URLSearchParams(window.location.search);
        s = urlParams.get('slug') || 'demo';
      }
      setSlug(s);
    };
    resolve();
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    const fetchAll = async () => {
      try {
        const [wRes, cRes] = await Promise.all([
          fetch(getSafeUrl(`/api/wines?slug=${slug}`)),
          fetch(getSafeUrl(`/api/store/config/public?slug=${slug}`))
        ]);
        if (wRes.ok) setWines(await wRes.json());
        if (cRes.ok) setConfig(await cRes.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [slug]);

  const displayWines = useMemo(() => {
    let res = [...wines];
    if (filterColor !== "すべて") res = res.filter(w => w.color === filterColor);
    // 自社輸入品(is_priority)を最優先で表示する戦略的ソート
    return res.sort((a, b) => (b.is_priority || 0) - (a.is_priority || 0));
  }, [wines, filterColor]);

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <Wine className="text-amber-500 w-12 h-12 animate-pulse" />
        <div className="absolute inset-0 bg-amber-500/20 blur-xl animate-pulse" />
      </div>
      <p className="text-amber-500/50 text-[10px] font-black tracking-[0.4em] uppercase">{t.loading}</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-40 overflow-x-hidden font-sans selection:bg-amber-900/50">
      {/* Dynamic Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/5 blur-[100px] rounded-full" />
      </div>

      {/* Luxury Header */}
      <header className="relative z-20 pt-20 pb-16 px-8 text-center">
        <div className="absolute top-8 right-8">
          <button 
            onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
            className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-black tracking-widest backdrop-blur-xl hover:bg-white/10 transition-all border-b border-white/20 active:scale-95"
          >
            <Languages size={14} className="text-amber-500" />
            {lang === 'ja' ? 'ENG' : '日本語'}
          </button>
        </div>

        <div className="inline-block p-1 mb-6 bg-gradient-to-br from-amber-400 to-amber-700 rounded-3xl shadow-[0_10px_40px_rgba(180,83,9,0.3)]">
          <div className="bg-[#050505] p-5 rounded-[1.4rem]">
            <Wine className="text-amber-500 w-10 h-10" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-serif italic tracking-[0.2em] text-amber-50/95 uppercase leading-tight mb-4 drop-shadow-2xl">
          {config?.store_name || "Selection"}
        </h1>
        <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto opacity-50" />
      </header>

      {/* Sticky Filters (Glassmorphism) */}
      <div className="relative z-40 sticky top-0 bg-[#050505]/60 backdrop-blur-2xl border-y border-white/5 px-6 py-5 mb-10 shadow-2xl">
        <div className="max-w-2xl mx-auto flex gap-3 overflow-x-auto no-scrollbar scroll-smooth">
          {["すべて", "赤", "白", "ロゼ", "泡"].map(c => (
            <button 
              key={c} 
              onClick={() => setFilterColor(c)} 
              className={`px-6 py-2.5 rounded-full text-[11px] font-black border transition-all duration-500 shrink-0 ${
                filterColor === c 
                ? "bg-gradient-to-br from-amber-500 to-amber-700 border-amber-400 text-white shadow-[0_10px_20px_rgba(180,83,9,0.4)]" 
                : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
              }`}
            >
              {c === "すべて" ? t.all : c === "赤" ? "RED" : c === "白" ? "WHITE" : c === "ロゼ" ? "ROSE" : "SPARKLING"}
            </button>
          ))}
        </div>
      </div>

      {/* Wine List with Strategic Highlighting */}
      <div className="relative z-10 max-w-2xl mx-auto space-y-28 py-10 px-8">
        {displayWines.map(w => (
          <div 
            key={w.id} 
            className={`group relative flex flex-col md:flex-row gap-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 ${
              w.is_priority ? 'scale-105' : 'opacity-85 hover:opacity-100'
            }`}
          >
            {/* is_priority Glow Effect */}
            {w.is_priority === 1 && (
              <div className="absolute inset-[-40px] bg-amber-500/[0.03] blur-[60px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
            )}

            {/* Visual Column */}
            <div className="relative shrink-0 mx-auto md:mx-0">
              <div className={`relative w-48 h-72 flex items-center justify-center bg-white/[0.03] rounded-[4rem] border transition-all duration-1000 shadow-2xl group-hover:scale-105 ${
                w.is_priority ? 'border-amber-500/30' : 'border-white/5 group-hover:border-white/20'
              }`}>
                <img 
                  src={w.image_url || 'https://placehold.co/400x600/111/444?text=WINE'} 
                  className={`w-36 h-60 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)] transition-all duration-1000 ${
                    w.is_priority ? 'scale-110 grayscale-0' : 'grayscale-[0.4] group-hover:grayscale-0'
                  }`} 
                  alt={w.name_jp} 
                />
              </div>

              {/* Priority Badges */}
              {w.is_priority === 1 && (
                <div className="absolute -top-6 -left-6 bg-gradient-to-br from-amber-400 to-amber-700 text-black text-[9px] font-black px-5 py-2.5 rounded-full shadow-2xl animate-pulse flex items-center gap-1.5 border border-white/20 uppercase tracking-widest">
                  <Star size={12} fill="currentColor" /> {t.recommend}
                </div>
              )}

              <div className="absolute -bottom-8 -right-8 transition-transform duration-700 group-hover:scale-110">
                <FlavorRadar data={w} lang={lang} />
              </div>
            </div>

            {/* Info Column */}
            <div className="flex-1 space-y-6 text-center md:text-left pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-center md:justify-start gap-2 text-amber-600/80 text-[10px] font-black tracking-[0.4em] uppercase">
                  <MapPin size={12}/> {w.country} {w.region && `/ ${w.region}`}
                </div>
                <h2 className="text-3xl md:text-4xl font-serif text-amber-50/95 leading-tight group-hover:text-white transition-colors">
                  {lang === 'ja' ? w.name_jp : w.name_en}
                </h2>
                <p className="text-[10px] text-white/20 font-bold tracking-[0.2em] uppercase italic">{w.name_en}</p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="px-4 py-1.5 rounded-full text-[9px] font-black border border-white/10 bg-white/5 text-white/50 tracking-widest uppercase">{w.grape}</span>
                <span className="px-4 py-1.5 rounded-full text-[9px] font-black border border-white/10 bg-white/5 text-white/50 tracking-widest uppercase">{w.vintage || 'NV'}</span>
              </div>

              <div className="flex items-end justify-center md:justify-start gap-8 pt-4">
                <div className="group/price relative">
                  <span className="text-[8px] text-white/30 uppercase tracking-[0.3em] block mb-1">{t.bottle}</span>
                  <p className="text-4xl font-light text-amber-100 italic tracking-tighter">
                    ¥{Number(w.price_bottle || 0).toLocaleString()}
                  </p>
                </div>
                {w.price_glass > 0 && (
                  <div className="border-l border-white/10 pl-8">
                    <span className="text-[8px] text-white/30 uppercase tracking-[0.3em] block mb-1">{t.glass}</span>
                    <p className="text-2xl font-light text-amber-100/50 italic tracking-tighter">
                      ¥{Number(w.price_glass).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {w.ai_explanation && (
                <div className="relative p-7 bg-white/[0.02] rounded-[2.4rem] border-l-2 border-amber-600/30 backdrop-blur-sm group-hover:bg-white/[0.04] transition-all">
                  <p className="text-[12px] text-white/50 leading-relaxed font-serif italic tracking-wide">
                    {w.ai_explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Concierge Assistant */}
      <div className="fixed bottom-10 left-0 right-0 z-[100] px-8 flex justify-center">
        <button 
          onClick={() => setIsChatOpen(true)} 
          className="w-full max-w-sm py-6 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 text-white rounded-full flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 active:scale-95 transition-all group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <Sparkles size={26} className="text-amber-200" />
          <span className="text-xs font-black tracking-[0.3em] uppercase">{t.aiConsult}</span>
        </button>
      </div>

      {/* AI Sommelier Sidebar/Modal (簡易) */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-500">
           {/* ... (Chat UI implementation remains same as previous stable version but with luxury theme) */}
           <div className="bg-[#080808] w-full max-w-xl h-[94vh] md:h-[750px] md:rounded-[3rem] border-t md:border border-white/10 flex flex-col relative">
              <button onClick={() => setIsChatOpen(false)} className="absolute top-8 right-8 text-white/20 hover:text-white p-2 transition-colors"><X size={32}/></button>
              <div className="p-10 border-b border-white/5">
                <h3 className="text-2xl font-serif italic text-amber-500">{t.chatTitle}</h3>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] mt-1 font-black">{t.chatPrompt}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-6">
                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 max-w-[90%] self-start animate-in slide-in-from-left-4">
                  <p className="text-sm font-serif italic text-amber-50/80 leading-relaxed">{t.chatPrompt}</p>
                </div>
              </div>
              <div className="p-8 bg-black/50 border-t border-white/5 pb-12">
                <div className="relative">
                  <input type="text" placeholder="I'm looking for a smooth red..." className="w-full bg-white/5 border border-white/10 rounded-[1.8rem] py-6 pl-8 pr-20 outline-none focus:border-amber-500/50 transition-all font-bold text-sm shadow-inner" />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 p-3"><Send size={24}/></button>
                </div>
              </div>
           </div>
        </div>
      )}
    </main>
  );
}
