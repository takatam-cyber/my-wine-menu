// app/[slug]/page.tsx
"use client";

export const runtime = 'edge';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Sparkles, X, Send, Loader2, Wine, Info, Star, 
  Filter, ArrowUpDown, ChevronDown, GlassWater, Languages,
  Trophy, Flame, Heart, Utensils, Zap, Gem
} from 'lucide-react';

/**
 * 翻訳・定数定義 (Pieroth MS Ultra Luxury Standard)
 */
const translations = {
  ja: {
    loading: "PREPARING THE EXCLUSIVE COLLECTION...",
    all: "すべて",
    red: "RED",
    white: "WHITE",
    rose: "ROSÉ",
    sparkling: "SPARKLING",
    moods: {
      elegant: "優雅なひととき",
      refresh: "爽やかに乾杯",
      rich: "贅沢な重厚感",
      pairing: "料理を引き立てる"
    },
    labels: {
      bottle: "BOTTLE",
      glass: "GLASS",
      recommend: "SOMMELIER'S PICK",
      limited: "LIMITED QUANTITY",
      pairingTitle: "Best Pairing",
      origin: "PRODUCT OF"
    },
    radar: { body: "ボディ", sweet: "甘味", tannin: "渋み", acid: "酸味" },
    chat: {
      title: "AI Sommelier Concierge",
      sub: "専任のソムリエが、あなただけの1本をエスコートいたします。",
      placeholder: "お料理や今の気分を教えてください..."
    }
  },
  en: {
    loading: "PREPARING THE EXCLUSIVE COLLECTION...",
    all: "All",
    red: "RED",
    white: "WHITE",
    rose: "ROSÉ",
    sparkling: "SPARKLING",
    moods: {
      elegant: "Elegant Moment",
      refresh: "Refreshing Toast",
      rich: "Rich & Bold",
      pairing: "Perfect Pairing"
    },
    labels: {
      bottle: "BOTTLE",
      glass: "GLASS",
      recommend: "SOMMELIER'S PICK",
      limited: "LIMITED QUANTITY",
      pairingTitle: "Best Pairing",
      origin: "PRODUCT OF"
    },
    radar: { body: "Body", sweet: "Sweet", tannin: "Tannin", acid: "Acid" },
    chat: {
      title: "AI Sommelier Concierge",
      sub: "Our AI sommelier will find your perfect match.",
      placeholder: "Tell me your mood or meal..."
    }
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
 * 味わいの可視化コンポーネント (Pieroth Luxury Edition)
 */
function FlavorRadar({ data, lang }: { data: any, lang: 'ja' | 'en' }) {
  const size = 100;
  const center = size / 2;
  const scale = (val: number) => (val / 5) * (size / 2.6);
  const t = translations[lang].radar;

  const pts = [
    `${center},${center - scale(data.body || 0)}`,
    `${center + scale(data.sweetness || 0)},${center}`,
    `${center},${center + scale(data.tannins || 0)}`,
    `${center - scale(data.acidity || 0)},${center}`
  ].join(' ');

  return (
    <div className="relative w-24 h-24 flex items-center justify-center group/radar">
      <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-xl scale-125 opacity-0 group-hover/radar:opacity-100 transition-opacity duration-700" />
      <svg width={size} height={size} className="transform rotate-45">
        <circle cx={center} cy={center} r={size/2.6} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        <line x1={0} y1={center} x2={size} y2={center} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        <line x1={center} y1={0} x2={center} y2={size} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        <polygon 
          points={pts} 
          fill="rgba(245, 158, 11, 0.4)" 
          stroke="#f59e0b" 
          strokeWidth="1.5"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col justify-between p-1.5 text-[6px] font-black text-amber-500/80 uppercase tracking-widest pointer-events-none">
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
  const [activeMood, setActiveMood] = useState<string | null>(null);
  
  const [chatMsg, setChatMsg] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

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
    
    // ムード別簡易ロジック
    if (activeMood === 'rich') res = res.filter(w => (w.body || 0) >= 4);
    if (activeMood === 'refresh') res = res.filter(w => (w.acidity || 0) >= 4 || w.color === '泡');
    if (activeMood === 'elegant') res = res.filter(w => w.is_priority === 1);

    return res.sort((a, b) => (b.is_priority || 0) - (a.is_priority || 0));
  }, [wines, filterColor, activeMood]);

  const handleSend = async () => {
    if (!chatMsg.trim() || isTyping) return;
    const userMsg = chatMsg;
    setChatMsg("");
    const newH = [...history, { role: 'user', content: userMsg }];
    setHistory(newH);
    setIsTyping(true);

    try {
      const res = await fetch(getSafeUrl('/api/sommelier'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg, 
          history: newH, 
          wineList: wines, 
          storeName: config?.store_name,
          language: lang 
        })
      });
      const d = await res.json();
      setHistory([...newH, { role: 'assistant', content: d.response }]);
    } catch (e) {
      setHistory([...newH, { role: 'assistant', content: lang === 'ja' ? "申し訳ございません。ソムリエが席を外しております。" : "I apologize, but the sommelier is currently away." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center space-y-8">
      <div className="relative">
        <div className="w-16 h-16 border border-amber-500/30 rounded-full animate-ping absolute inset-0" />
        <Wine className="text-amber-500 w-12 h-12 relative z-10" />
      </div>
      <p className="text-amber-500/50 text-[10px] font-black tracking-[0.6em] uppercase animate-pulse">{t.loading}</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-40 overflow-x-hidden font-sans selection:bg-amber-900/50">
      {/* Premium Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#1e1b15_0%,#050505_70%)]" />
        <div className="absolute top-[20%] left-[-10%] w-[60%] h-[60%] bg-amber-900/5 blur-[150px] rounded-full" />
      </div>

      {/* Global Header */}
      <header className="relative z-50 pt-20 pb-12 px-8 text-center">
        <div className="absolute top-8 right-8">
          <button 
            onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
            className="group flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2.5 rounded-full text-[10px] font-black tracking-widest backdrop-blur-xl hover:bg-amber-500/10 transition-all border-b border-white/20 active:scale-95"
          >
            <Languages size={14} className="text-amber-500 group-hover:rotate-180 transition-transform duration-700" />
            {lang === 'ja' ? 'ENG' : '日本語'}
          </button>
        </div>

        <div className="inline-flex items-center justify-center p-0.5 mb-8 bg-gradient-to-br from-amber-200 via-amber-500 to-amber-900 rounded-full shadow-[0_0_60px_rgba(180,83,9,0.2)]">
          <div className="bg-[#050505] p-5 rounded-full">
            <Wine className="text-amber-400 w-8 h-8" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-serif italic tracking-[0.25em] text-white mb-4 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
          {config?.store_name || "Selection"}
        </h1>
        <div className="flex items-center justify-center gap-4 text-[9px] font-black text-amber-500/40 tracking-[0.4em] uppercase">
          <span className="w-8 h-[1px] bg-amber-500/20" />
          EST. BY PIEROTH JAPAN
          <span className="w-8 h-[1px] bg-amber-500/20" />
        </div>
      </header>

      {/* Strategic Mood Selector */}
      <section className="relative z-40 max-w-2xl mx-auto px-6 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { id: 'elegant', icon: Gem, label: t.moods.elegant },
            { id: 'refresh', icon: Zap, label: t.moods.refresh },
            { id: 'rich', icon: Flame, label: t.moods.rich },
            { id: 'pairing', icon: Utensils, label: t.moods.pairing }
          ].map(mood => (
            <button
              key={mood.id}
              onClick={() => setActiveMood(activeMood === mood.id ? null : mood.id)}
              className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all duration-500 group ${
                activeMood === mood.id 
                ? "bg-amber-500/10 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.15)]" 
                : "bg-white/[0.02] border-white/5 hover:border-white/20"
              }`}
            >
              <mood.icon size={20} className={`mb-2 transition-colors ${activeMood === mood.id ? "text-amber-500" : "text-white/40 group-hover:text-white"}`} />
              <span className={`text-[9px] font-bold tracking-tighter ${activeMood === mood.id ? "text-amber-200" : "text-white/30"}`}>{mood.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Sticky Glass Category Filter */}
      <nav className="relative z-40 sticky top-0 bg-[#050505]/80 backdrop-blur-3xl border-y border-white/5 px-6 py-4 mb-16 shadow-2xl">
        <div className="max-w-2xl mx-auto flex gap-4 overflow-x-auto no-scrollbar">
          {["すべて", "赤", "白", "ロゼ", "泡"].map(c => (
            <button 
              key={c} 
              onClick={() => setFilterColor(c)} 
              className={`px-8 py-2.5 rounded-full text-[11px] font-black border transition-all duration-700 shrink-0 ${
                filterColor === c 
                ? "bg-white text-black border-white shadow-xl scale-105" 
                : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
              }`}
            >
              {c === "すべて" ? t.all : c === "赤" ? t.red : c === "白" ? t.white : c === "ロゼ" ? t.rose : t.sparkling}
            </button>
          ))}
        </div>
      </nav>

      {/* Wine Collection with Strategic UX */}
      <div className="relative z-10 max-w-2xl mx-auto space-y-32 py-10 px-8">
        {displayWines.map((w, idx) => (
          <div 
            key={w.id} 
            className={`group relative flex flex-col md:flex-row gap-12 items-center md:items-start transition-all duration-1000 ${
              w.is_priority ? 'scale-[1.03]' : 'opacity-90 hover:opacity-100'
            }`}
          >
            {/* Priority Visual Aura */}
            {w.is_priority === 1 && (
              <>
                <div className="absolute inset-[-60px] bg-[radial-gradient(circle,#f59e0b08_0%,transparent_70%)] animate-pulse pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none rounded-[4rem]">
                  <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent skew-x-[-25deg] group-hover:left-[100%] transition-all duration-[1500ms] ease-in-out" />
                </div>
              </>
            )}

            {/* Bottle Artwork Section */}
            <div className="relative shrink-0 w-56 h-80 flex items-center justify-center group/bottle">
              <div className={`absolute inset-0 bg-white/[0.02] rounded-[4rem] border transition-all duration-1000 ${
                w.is_priority ? 'border-amber-500/20 shadow-[0_40px_80px_rgba(0,0,0,0.6),0_0_20px_rgba(180,83,9,0.1)]' : 'border-white/5'
              }`} />
              
              <img 
                src={w.image_url || 'https://placehold.co/400x600/111/444?text=WINE'} 
                className={`relative w-40 h-64 object-contain drop-shadow-[0_25px_40px_rgba(0,0,0,0.9)] transition-all duration-1000 group-hover/bottle:scale-110 group-hover/bottle:rotate-2 ${
                  w.is_priority ? 'grayscale-0' : 'grayscale-[0.5] group-hover:grayscale-0'
                }`} 
                alt={w.name_jp} 
              />

              {/* Strategic Badge */}
              {w.is_priority === 1 && (
                <div className="absolute -top-4 -left-4 z-20">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-amber-500 blur-md animate-pulse opacity-50" />
                    <div className="relative bg-gradient-to-br from-amber-300 via-amber-600 to-amber-900 text-black text-[10px] font-black px-6 py-2 rounded-full border border-white/20 shadow-2xl tracking-widest">
                      {t.labels.recommend}
                    </div>
                  </div>
                </div>
              )}

              {/* Flavor Radar Overlay */}
              <div className="absolute -bottom-10 -right-10 z-20 scale-110 transition-transform duration-500 group-hover:scale-125">
                <FlavorRadar data={w} lang={lang} />
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 space-y-8 text-center md:text-left">
              <div className="space-y-3">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <span className="text-amber-500 text-[10px] font-black tracking-[0.5em] uppercase">{w.country}</span>
                  <span className="w-1 h-1 bg-white/10 rounded-full" />
                  <span className="text-white/30 text-[10px] font-bold tracking-widest uppercase">{w.region}</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-serif text-white leading-tight transition-colors group-hover:text-amber-50/100">
                  {lang === 'ja' ? w.name_jp : w.name_en}
                </h2>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
                  <span className="px-4 py-1 rounded-full text-[9px] font-black border border-white/10 bg-white/5 text-white/40 tracking-[0.2em] uppercase">{w.grape}</span>
                  <span className="px-4 py-1 rounded-full text-[9px] font-black border border-white/10 bg-white/5 text-white/40 tracking-[0.2em] uppercase">{w.vintage || 'NV'}</span>
                  {w.is_priority === 1 && <span className="px-4 py-1 rounded-full text-[9px] font-black border border-amber-500/20 bg-amber-500/5 text-amber-500/80 tracking-[0.2em] uppercase flex items-center gap-1"><Gem size={10}/> EXCLUSIVE</span>}
                </div>
              </div>

              {/* Dynamic Pricing Engine */}
              <div className="flex items-end justify-center md:justify-start gap-12">
                <div className="group/price relative cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-1 bg-amber-500 rounded-full" />
                    <span className="text-[9px] text-white/40 font-black tracking-widest uppercase">{t.labels.bottle}</span>
                  </div>
                  <p className="text-5xl font-light text-amber-100 italic tracking-tighter hover:text-white transition-colors duration-500">
                    ¥{Number(w.price_bottle || 0).toLocaleString()}
                  </p>
                </div>
                {w.price_glass > 0 && (
                  <div className="border-l border-white/10 pl-12 group/glass">
                    <div className="flex items-center gap-2 mb-1">
                      <GlassWater size={12} className="text-amber-500/60" />
                      <span className="text-[9px] text-white/40 font-black tracking-widest uppercase">{t.labels.glass}</span>
                    </div>
                    <p className="text-3xl font-light text-amber-100/60 italic tracking-tighter group-hover/glass:text-white transition-colors">
                      ¥{Number(w.price_glass).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Sommelier's Note (AI Explanation) */}
              {w.ai_explanation && (
                <div className="relative p-8 bg-gradient-to-br from-white/[0.03] to-transparent rounded-[2.5rem] border-l border-amber-500/30 backdrop-blur-sm group-hover:from-white/[0.05] transition-all duration-700">
                  <p className="text-[13px] text-white/60 leading-relaxed font-serif italic tracking-wide">
                    {w.ai_explanation}
                  </p>
                  <div className="absolute top-[-10px] left-8 bg-[#050505] px-3 text-[8px] font-black text-amber-500/50 uppercase tracking-[0.4em]">
                    Tasting Note
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Concierge Artifact */}
      <div className="fixed bottom-10 left-0 right-0 z-[100] px-8 flex justify-center pointer-events-none">
        <button 
          onClick={() => setIsChatOpen(true)} 
          className="pointer-events-auto w-full max-w-sm py-6 bg-gradient-to-br from-amber-800 via-amber-600 to-amber-900 text-white rounded-full flex items-center justify-center gap-4 shadow-[0_30px_60px_rgba(0,0,0,1),0_0_40px_rgba(180,83,9,0.3)] border border-white/20 active:scale-95 transition-all group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1200ms]" />
          <div className="relative">
            <Sparkles size={24} className="text-amber-200 group-hover:rotate-12 transition-transform duration-500" />
            <div className="absolute inset-0 bg-white blur-md opacity-0 group-hover:opacity-40 transition-opacity" />
          </div>
          <span className="text-xs font-black tracking-[0.4em] uppercase drop-shadow-md">{t.aiConsult}</span>
        </button>
      </div>

      {/* AI Sommelier Concierge Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/98 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="bg-[#080808] w-full max-w-2xl h-[95vh] md:h-[800px] md:rounded-[4rem] border-t md:border border-white/10 flex flex-col relative shadow-[0_0_100px_rgba(0,0,0,1)]">
            {/* Modal Header */}
            <div className="p-10 border-b border-white/5 flex justify-between items-start bg-gradient-to-b from-white/[0.02] to-transparent">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  <h3 className="text-3xl font-serif italic text-amber-500 tracking-tight">{t.chat.title}</h3>
                </div>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-black">{t.chat.sub}</p>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)} 
                className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all active:scale-90"
              >
                <X size={28}/>
              </button>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide no-scrollbar">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-6">
                  <Wine size={48} className="text-amber-500 mb-2" />
                  <p className="text-xl font-serif italic text-amber-50/80 leading-relaxed max-w-xs">{t.chat.sub}</p>
                </div>
              ) : (
                history.map((h, i) => (
                  <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4`}>
                    <div className={`max-w-[85%] p-7 rounded-[2.5rem] text-[13px] leading-relaxed shadow-2xl ${
                      h.role === 'user' 
                      ? 'bg-amber-700/80 text-white font-bold backdrop-blur-md border border-white/10' 
                      : 'bg-white/[0.05] text-amber-50/90 border border-white/5 font-serif italic'
                    }`}>
                      {h.content}
                    </div>
                  </div>
                ))
              )}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-6 rounded-full animate-pulse flex gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Section */}
            <div className="p-10 bg-black/50 border-t border-white/5 pb-14">
              <div className="relative group">
                <div className="absolute inset-0 bg-amber-500/5 blur-xl group-focus-within:bg-amber-500/10 transition-all" />
                <input 
                  type="text" 
                  value={chatMsg}
                  onChange={(e) => setChatMsg(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t.chat.placeholder} 
                  className="relative w-full bg-white/5 border border-white/10 rounded-[2.5rem] py-7 pl-10 pr-24 outline-none focus:border-amber-500/50 transition-all font-bold text-sm shadow-inner backdrop-blur-md" 
                />
                <button 
                  onClick={handleSend}
                  disabled={!chatMsg.trim() || isTyping}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-400 text-black p-4 rounded-full transition-all active:scale-90 disabled:opacity-30 shadow-xl"
                >
                  <Send size={24}/>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
