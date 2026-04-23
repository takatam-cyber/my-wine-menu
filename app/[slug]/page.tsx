// app/[slug]/page.tsx
"use client";

export const runtime = 'edge';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Sparkles, X, Send, Loader2, Wine, Info, Star, 
  Filter, ArrowUpDown, ChevronDown, GlassWater, Languages
} from 'lucide-react';

const translations = {
  ja: {
    loading: "読み込み中...", all: "すべて", red: "赤", white: "白", rose: "ロゼ", sparkling: "泡",
    sortAsc: "価格順", bottle: "ボトル", glass: "グラス", aiConsult: "AIソムリエに相談", recommend: "おすすめ",
    translating: "翻訳中...", radar: { body: "ボディ", sweet: "甘味", tannin: "渋み", acid: "酸味" },
    chatTitle: "コンシェルジュ", chatPrompt: "ご希望をお聞かせください"
  },
  en: {
    loading: "Loading...", all: "All", red: "Red", white: "White", rose: "Rosé", sparkling: "Sparkling",
    sortAsc: "Price", bottle: "Bottle", glass: "Glass", aiConsult: "Consult AI", recommend: "RECOMMEND",
    translating: "Translating...", radar: { body: "Body", sweet: "Sweet", tannin: "Tannin", acid: "Acid" },
    chatTitle: "Concierge", chatPrompt: "How can I help you?"
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

function FlavorRadar({ data, lang }: { data: any, lang: 'ja' | 'en' }) {
  const size = 80;
  const center = size / 2;
  const scale = (val: number) => (val / 5) * (size / 2.5);
  const t = translations[lang].radar;
  const pts = [`${center},${center - scale(data.body || 0)}`, `${center + scale(data.sweetness || 0)},${center}`, `${center},${center + scale(data.tannins || 0)}`, `${center - scale(data.acidity || 0)},${center}`].join(' ');

  return (
    <div className="relative w-20 h-20 flex items-center justify-center bg-black/40 rounded-full backdrop-blur-md border border-white/10 shadow-xl">
      <svg width={size} height={size} className="transform rotate-45">
        <circle cx={center} cy={center} r={size/2.5} fill="none" stroke="white" strokeOpacity="0.1" strokeWidth="0.5" />
        <polygon points={pts} fill="rgba(245, 158, 11, 0.4)" stroke="#f59e0b" strokeWidth="1.5" />
      </svg>
      <div className="absolute inset-0 flex flex-col justify-between p-1 text-[6px] font-black text-amber-500/60 uppercase pointer-events-none">
        <span className="text-center">{t.body}</span>
        <div className="flex justify-between px-0.5 mt-2"><span>{t.acid}</span><span>{t.sweet}</span></div>
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
  const [translatedExplanations, setTranslatedExplanations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [filterColor, setFilterColor] = useState("すべて");

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

  // AI自動翻訳
  useEffect(() => {
    const translate = async () => {
      if (lang !== 'en' || wines.length === 0 || isTranslating) return;
      const needs = wines.filter(w => w.ai_explanation && !translatedExplanations[w.id]);
      if (needs.length === 0) return;

      setIsTranslating(true);
      try {
        const res = await fetch(getSafeUrl('/api/translate'), {
          method: 'POST',
          body: JSON.stringify({ texts: needs.map(w => w.ai_explanation), targetLang: 'en' })
        });
        if (res.ok) {
          const { translations: results } = await res.json();
          const next = { ...translatedExplanations };
          needs.forEach((w, i) => { next[w.id] = results[i] || w.ai_explanation; });
          setTranslatedExplanations(next);
        }
      } catch (e) { console.error(e); }
      finally { setIsTranslating(false); }
    };
    translate();
  }, [lang, wines]);

  const displayWines = useMemo(() => {
    let res = [...wines];
    if (filterColor !== "すべて") res = res.filter(w => w.color === filterColor);
    return res.sort((a, b) => (b.is_priority || 0) - (a.is_priority || 0));
  }, [wines, filterColor]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Wine className="text-amber-600 animate-pulse" /></div>;

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-32 overflow-x-hidden relative">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_center,#1a1a1a_0%,#050505_100%)] z-0" />
      
      {/* 言語切り替えボタンをヘッダーの前面に配置 */}
      <div className="fixed top-6 right-6 z-[60]">
        <button 
          onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
          className="flex items-center gap-2 bg-amber-600/90 text-white px-5 py-2.5 rounded-full text-[11px] font-black tracking-widest shadow-2xl backdrop-blur-xl border border-white/20 active:scale-95"
        >
          <Languages size={14} />
          {lang === 'ja' ? 'ENGLISH' : '日本語'}
        </button>
      </div>

      <header className="relative z-10 text-center pt-20 pb-10 px-6">
        <div className="inline-block p-4 bg-amber-500/10 rounded-[2rem] mb-6 border border-amber-500/20"><Wine className="text-amber-500" size={32} /></div>
        <h1 className="text-3xl font-serif italic tracking-[0.15em] text-amber-50/90 uppercase">{config?.store_name || "WINE MENU"}</h1>
      </header>

      <div className="relative z-40 sticky top-0 bg-[#050505]/80 backdrop-blur-2xl border-y border-white/5 px-4 py-4 mb-8">
        <div className="max-w-xl mx-auto flex gap-2 overflow-x-auto no-scrollbar">
          {["すべて", "赤", "白", "ロゼ", "泡"].map(c => (
            <button key={c} onClick={() => setFilterColor(c)} className={`px-5 py-2.5 rounded-full text-[11px] font-black border transition-all shrink-0 ${filterColor === c ? "bg-amber-600 border-amber-500 text-white" : "bg-white/5 border-white/10 text-white/40"}`}>
              {c === "すべて" ? t.all : c === "赤" ? t.red : c === "白" ? t.white : c === "ロゼ" ? t.rose : t.sparkling}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-xl mx-auto space-y-20 py-10 px-6">
        {displayWines.map(w => (
          <div key={w.id} className="group animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="relative shrink-0 mx-auto md:mx-0">
                <div className="relative w-40 h-64 flex items-center justify-center bg-white/[0.02] rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl">
                  <img src={w.image_url} className="w-32 h-56 object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)]" alt="" />
                </div>
                {w.is_priority === 1 && <div className="absolute -top-4 -left-4 bg-amber-500 text-black text-[9px] font-black px-4 py-1.5 rounded-full border border-white/20 shadow-xl"><Star size={10} fill="currentColor" className="inline mr-1"/>{t.recommend}</div>}
                <div className="absolute -bottom-6 -right-6"><FlavorRadar data={w} lang={lang} /></div>
              </div>
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="space-y-1">
                  <p className="text-amber-600/80 text-[10px] font-black tracking-[0.4em] uppercase">{w.country} {w.region && `/ ${w.region}`}</p>
                  <h2 className="text-2xl font-serif text-amber-50/95">{lang === 'ja' ? w.name_jp : w.name_en}</h2>
                </div>
                <div className="flex gap-2 justify-center md:justify-start">
                  <span className="px-3 py-1 rounded-full text-[9px] font-black border border-white/10 bg-white/5">{w.grape}</span>
                </div>
                <div className="flex items-end justify-center md:justify-start gap-6 pt-2">
                  <div><span className="text-[8px] text-white/30 uppercase tracking-widest">{t.bottle}</span><p className="text-3xl font-light text-amber-100 italic">¥{Number(w.price_bottle || 0).toLocaleString()}</p></div>
                </div>
                {w.ai_explanation && (
                  <div className="relative p-5 bg-white/[0.02] rounded-[2rem] border-l-2 border-amber-600/30 backdrop-blur-sm">
                    {lang === 'en' && !translatedExplanations[w.id] && isTranslating ? (
                      <div className="text-white/30 italic text-[10px] animate-pulse">{t.translating}</div>
                    ) : (
                      <p className="text-[11px] text-white/50 leading-relaxed font-serif italic">{lang === 'en' ? (translatedExplanations[w.id] || w.ai_explanation) : w.ai_explanation}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-8 left-0 right-0 z-50 px-6 flex justify-center">
        <button onClick={() => setIsChatOpen(true)} className="w-full max-w-sm py-5 bg-gradient-to-r from-amber-800 to-amber-700 text-white rounded-full flex items-center justify-center gap-3 shadow-2xl border border-white/10 active:scale-95">
          <Sparkles size={24} className="text-amber-200" /><span className="text-xs font-black tracking-widest uppercase">{t.aiConsult}</span>
        </button>
      </div>
    </main>
  );
}
