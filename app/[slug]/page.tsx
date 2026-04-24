// app/[slug]/page.tsx
"use client";

export const runtime = 'edge';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Sparkles, X, Send, Wine, Languages, GlassWater, Gem,
  Flame, Zap, Utensils, Info, ChevronRight, Star
} from 'lucide-react';

/**
 * プレビュー・本番環境共通のパス解決ヘルパー
 * 相対パスを確実に絶対URLに変換し、fetchのエラーを防ぎます。
 */
const getSafeUrl = (path: string) => {
  if (!path) return '#';
  if (typeof window === 'undefined') return path;
  try {
    const origin = window.location.origin;
    // blob URL や null origin の場合、現在の href をベースにする
    const baseUrl = (origin && origin !== 'null' && !origin.startsWith('blob:')) 
      ? origin 
      : window.location.href.split('?')[0].split('#')[0];
    
    const safePath = path.startsWith('/') ? path : `/${path}`;
    return new URL(safePath, baseUrl).href;
  } catch (e) { 
    return path; 
  }
};

const translations = {
  ja: {
    loading: "至高のコレクションを準備中...",
    moods: {
      elegant: "優雅なひととき",
      refresh: "爽やかに乾杯",
      rich: "贅沢な重厚感",
      pairing: "料理とのマリアージュ"
    },
    chat: {
      title: "AI Sommelier Concierge",
      sub: "専任ソムリエが、あなたに最適な1本をエスコートします。",
      placeholder: "今の気分やお料理を教えてください..."
    },
    aiConsult: "AIソムリエに相談"
  },
  en: {
    loading: "Curating the finest selection...",
    moods: {
      elegant: "Elegant",
      refresh: "Refresh",
      rich: "Rich & Bold",
      pairing: "Pairing"
    },
    chat: {
      title: "AI Sommelier Concierge",
      sub: "Let our AI guide you to the perfect bottle.",
      placeholder: "Tell me about your meal or mood..."
    },
    aiConsult: "Consult AI Sommelier"
  }
};

// 味わいのレーダーチャート
function FlavorRadar({ data }: { data: any }) {
  const size = 100;
  const center = size / 2;
  const scale = (val: number) => (val / 5) * (size / 2.5);
  
  const pts = [
    `${center},${center - scale(data.body || 3)}`,     // Top: Body
    `${center + scale(data.sweetness || 3)},${center}`, // Right: Sweet
    `${center},${center + scale(data.tannins || 3)}`,   // Bottom: Tannin
    `${center - scale(data.acidity || 3)},${center}`    // Left: Acid
  ].join(' ');

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg width={size} height={size} className="transform rotate-45">
        <circle cx={center} cy={center} r={size/2.5} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <line x1={0} y1={center} x2={size} y2={center} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        <line x1={center} y1={0} x2={center} y2={size} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        <polygon points={pts} fill="rgba(245, 158, 11, 0.35)" stroke="#f59e0b" strokeWidth="1.5" className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex flex-col justify-between p-1 text-[7px] font-bold text-amber-500/60 uppercase tracking-tighter pointer-events-none">
        <span className="text-center">Body</span>
        <div className="flex justify-between px-1"><span>Acid</span><span>Sweet</span></div>
        <span className="text-center">Tannin</span>
      </div>
    </div>
  );
}

export default function PublicMenu({ params }: { params: any }) {
  const [lang, setLang] = useState<'ja' | 'en'>('ja');
  const [wines, setWines] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  
  const [chatMsg, setChatMsg] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const t = translations[lang];

  // パラメータ解決のためのEffect (React 18 互換)
  useEffect(() => {
    const resolve = async () => {
      try {
        const p = await params;
        let s = p?.slug;
        if (!s || s === '[slug]') {
          const urlParams = new URLSearchParams(window.location.search);
          s = urlParams.get('slug') || 'demo';
        }
        setSlug(s);
      } catch (e) {
        console.error("Params resolution error", e);
        setSlug('demo');
      }
    };
    resolve();
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    const fetchData = async () => {
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
    fetchData();
  }, [slug]);

  const displayWines = useMemo(() => {
    let res = [...wines];
    if (activeMood === 'rich') res = res.filter(w => (w.body || 0) >= 4);
    if (activeMood === 'refresh') res = res.filter(w => (w.acidity || 0) >= 4 || w.color === '泡');
    return res.sort((a, b) => (b.is_priority || 0) - (a.is_priority || 0));
  }, [wines, activeMood]);

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

  if (loading || !slug) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center space-y-8">
      <div className="relative">
        <div className="w-20 h-20 border border-amber-500/20 rounded-full animate-ping absolute inset-0" />
        <Wine className="text-amber-500 w-12 h-12 relative z-10" />
      </div>
      <p className="text-amber-500/40 text-[10px] font-black tracking-[0.5em] uppercase animate-pulse">{t.loading}</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-amber-900/50 overflow-x-hidden font-sans">
      {/* プレミアム・背景エフェクト */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#1e1b15_0%,#050505_75%)]" />
        <div className="absolute top-[20%] left-[-10%] w-[70%] h-[70%] bg-amber-900/5 blur-[120px] rounded-full animate-pulse" />
      </div>

      {/* ヘッダー */}
      <header className="relative z-50 pt-24 pb-16 px-8 text-center">
        <div className="absolute top-8 right-8">
          <button 
            onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
            className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-black tracking-widest backdrop-blur-xl"
          >
            <Languages size={14} className="text-amber-500" />
            {lang === 'ja' ? 'ENGLISH' : '日本語'}
          </button>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter text-white mb-6 drop-shadow-2xl">
          {config?.store_name || "Selection"}
        </h1>
        <div className="flex items-center justify-center gap-4 text-[9px] font-black text-amber-500/40 tracking-[0.4em] uppercase">
          <span className="w-8 h-[1px] bg-amber-500/20" />
          Pieroth Exclusive List
          <span className="w-8 h-[1px] bg-amber-500/20" />
        </div>
      </header>

      {/* ムード・セレクター */}
      <section className="relative z-40 max-w-2xl mx-auto px-6 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { id: 'elegant', icon: Gem, label: t.moods.elegant },
            { id: 'refresh', icon: Zap, label: t.moods.refresh },
            { id: 'rich', icon: Flame, label: t.moods.rich },
            { id: 'pairing', icon: Utensils, label: t.moods.pairing }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setActiveMood(activeMood === m.id ? null : m.id)}
              className={`flex flex-col items-center justify-center p-5 rounded-[2rem] border transition-all duration-500 ${
                activeMood === m.id ? "bg-amber-500/10 border-amber-500 shadow-lg scale-105" : "bg-white/[0.02] border-white/5"
              }`}
            >
              <m.icon size={22} className={activeMood === m.id ? "text-amber-500" : "text-white/20"} />
              <span className={`text-[10px] font-bold mt-2 ${activeMood === m.id ? "text-amber-200" : "text-white/30"}`}>{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ワインリスト */}
      <div className="relative z-10 max-w-2xl mx-auto space-y-32 px-8 pb-60">
        {displayWines.map((w) => (
          <div key={w.id} className="group relative flex flex-col md:flex-row gap-12 items-center md:items-start animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {/* 優先商品（Pieroth Exclusive）への光彩演出 */}
            {w.is_priority === 1 && (
              <div className="absolute inset-[-40px] bg-[radial-gradient(circle,#f59e0b05_0%,transparent_70%)] animate-pulse pointer-events-none" />
            )}

            {/* ボトルビジュアル */}
            <div className="relative shrink-0 w-60 h-84 flex items-center justify-center">
              <div className={`absolute inset-0 bg-white/[0.02] rounded-[3.5rem] border transition-all duration-700 ${
                w.is_priority ? 'border-amber-500/20 shadow-2xl' : 'border-white/5'
              }`} />
              <img 
                src={w.image_url || 'https://placehold.co/400x600/111/444?text=WINE'} 
                className="relative w-44 h-72 object-contain drop-shadow-[0_35px_50px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-700" 
                alt={w.name_jp} 
              />
              <div className="absolute -bottom-10 -right-8 scale-110">
                <FlavorRadar data={w} />
              </div>
            </div>

            {/* 詳細情報 */}
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="space-y-3">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <span className="text-amber-500 text-[10px] font-black tracking-widest uppercase">{w.country}</span>
                  <span className="w-1 h-1 bg-white/20 rounded-full" />
                  <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">{w.vintage}</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-serif text-white leading-tight">
                  {lang === 'ja' ? w.name_jp : w.name_en}
                </h2>
              </div>

              {/* 価格 */}
              <div className="flex items-end justify-center md:justify-start gap-12">
                <div className="space-y-1">
                  <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">Bottle</span>
                  <p className="text-5xl font-light text-amber-100 italic tracking-tighter">¥{Number(w.price_bottle).toLocaleString()}</p>
                </div>
                {w.price_glass > 0 && (
                  <div className="space-y-1 border-l border-white/10 pl-12">
                    <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">Glass</span>
                    <p className="text-3xl font-light text-amber-100/60 italic tracking-tighter">¥{Number(w.price_glass).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* AIソムリエの解説 */}
              {w.ai_explanation && (
                <div className="p-8 bg-white/[0.03] rounded-[2.5rem] border-l-2 border-amber-500/40 backdrop-blur-sm">
                  <p className="text-[13px] text-white/70 leading-relaxed italic font-serif">
                    {w.ai_explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 浮遊コンシェルジュ・ボタン */}
      <div className="fixed bottom-10 left-0 right-0 z-[100] px-8 flex justify-center pointer-events-none">
        <button 
          onClick={() => setIsChatOpen(true)}
          className="pointer-events-auto w-full max-w-sm h-18 bg-gradient-to-br from-amber-800 to-amber-950 text-white rounded-full flex items-center justify-center gap-4 shadow-2xl border border-white/20 active:scale-95 transition-all group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <Sparkles size={20} className="text-amber-200 animate-pulse" />
          <span className="text-xs font-black tracking-[0.4em] uppercase">{t.aiConsult}</span>
        </button>
      </div>

      {/* AI チャットモーダル */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col animate-in fade-in duration-500">
          <div className="p-10 flex justify-between items-center border-b border-white/5">
            <div>
              <h3 className="text-3xl font-serif italic text-amber-500">{t.chat.title}</h3>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">{t.chat.sub}</p>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="p-4 bg-white/5 rounded-full"><X size={28}/></button>
          </div>
          
          {/* チャットコンテンツ */}
          <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-6">
                <Wine size={48} className="text-amber-500 mb-2" />
                <p className="text-xl font-serif italic leading-relaxed max-w-xs">{t.chat.sub}</p>
              </div>
            ) : (
              history.map((h, i) => (
                <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4`}>
                  <div className={`max-w-[85%] p-6 rounded-[2rem] text-[13px] leading-relaxed shadow-xl ${
                    h.role === 'user' 
                    ? 'bg-amber-700 text-white font-bold border border-white/10' 
                    : 'bg-white/5 text-amber-50 border border-white/5 font-serif italic'
                  }`}>
                    {h.content}
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/5 p-4 rounded-full animate-pulse flex gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* 入力エリア */}
          <div className="p-10 bg-black/50 border-t border-white/5 pb-14">
            <div className="relative group max-w-2xl mx-auto">
              <input 
                type="text" 
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t.chat.placeholder} 
                className="w-full bg-white/5 border border-white/10 rounded-full py-6 pl-10 pr-20 outline-none focus:border-amber-500/50 transition-all font-bold text-sm shadow-inner backdrop-blur-md" 
              />
              <button 
                onClick={handleSend}
                disabled={!chatMsg.trim() || isTyping}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-400 text-black p-4 rounded-full transition-all active:scale-90 disabled:opacity-30 shadow-xl"
              >
                <Send size={20}/>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
