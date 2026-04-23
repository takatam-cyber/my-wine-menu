// app/[slug]/page.tsx
"use client";
export const runtime = 'edge';
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, X, Send, Loader2, Wine, Info, Star, 
  Filter, ArrowUpDown, AlertTriangle, ChevronDown
} from 'lucide-react';

/**
 * PREVIEW MOCK DATA (Fallback)
 */
const MOCK_WINES = [
  { id: "1", name_jp: "パスカルトソ CS レゼルヴァ", name_en: "Cabernet Sauvignon Reserva", country: "アルゼンチン", grape: "CS", color: "赤", price_bottle: 5500, ai_explanation: "熟したベリーとバニラの優雅な共演。", is_priority: 1, sweetness: 1, body: 4, acidity: 3, tannins: 4 },
  { id: "2", name_jp: "パスカルトソ シャルドネ", name_en: "Chardonnay", country: "アルゼンチン", grape: "シャルドネ", color: "白", price_bottle: 2800, ai_explanation: "キレのある酸味が心地よい辛口。", is_priority: 0, sweetness: 1, body: 3, acidity: 4, tannins: 0 }
];

/**
 * UTILS
 */
const getSafeUrl = (path: string) => {
  if (typeof window === 'undefined') return path;
  try {
    const origin = window.location.origin;
    if (!origin || origin === 'null' || origin.startsWith('blob:')) return path;
    return new URL(path, origin).href;
  } catch (e) { return path; }
};

/**
 * Flavor Radar Component
 */
function FlavorRadar({ data }: { data: any }) {
  const size = 110;
  const center = size / 2;
  const scale = (val: number) => (val / 5) * (size / 2.6);
  const pts = [
    `${center},${center - scale(data.body || 0)}`,
    `${center + scale(data.sweetness || 0)},${center}`,
    `${center},${center + scale(data.tannins || 0)}`,
    `${center - scale(data.acidity || 0)},${center}`
  ].join(' ');

  return (
    <div className="relative w-28 h-28 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 shadow-2xl">
      <svg width={size} height={size} className="transform rotate-45">
        <circle cx={center} cy={center} r={size/2.6} fill="none" stroke="white" strokeOpacity="0.05" strokeWidth="0.5" />
        <line x1={0} y1={center} x2={size} y2={center} stroke="white" strokeOpacity="0.1" />
        <line x1={center} y1={0} x2={center} y2={size} stroke="white" strokeOpacity="0.1" />
        <polygon points={pts} fill="rgba(245, 158, 11, 0.5)" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col justify-between p-1.5 text-[8px] font-black text-amber-500/60 uppercase tracking-tighter pointer-events-none">
        <span className="text-center">ボディ</span>
        <div className="flex justify-between px-0.5"><span>酸味</span><span>甘味</span></div>
        <span className="text-center">渋み</span>
      </div>
    </div>
  );
}

export default function PublicMenu({ params }: { params: any }) {
  const [slug, setSlug] = useState<string | null>(null);
  const [wines, setWines] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [filterColor, setFilterColor] = useState("すべて");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "none">("none");

  useEffect(() => {
    const resolve = async () => {
      let s = (params instanceof Promise) ? (await params).slug : params?.slug;
      if (!s || s === '[slug]') s = new URLSearchParams(window.location.search).get('slug') || 'demo';
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
        if (wRes.ok && cRes.ok) {
          const wd = await wRes.json();
          setWines(wd.length > 0 ? wd : MOCK_WINES);
          setConfig(await cRes.json());
        } else { setWines(MOCK_WINES); setConfig({ store_name: "PIEROTH SELECTION" }); }
      } catch (e) { setWines(MOCK_WINES); setConfig({ store_name: "PIEROTH SELECTION" }); }
      setLoading(false);
    };
    fetchAll();
  }, [slug]);

  const displayWines = useMemo(() => {
    let result = [...wines];
    if (filterColor !== "すべて") result = result.filter(w => w.color === filterColor);
    if (sortOrder === "asc") result.sort((a, b) => (a.price_bottle || 0) - (b.price_bottle || 0));
    else if (sortOrder === "desc") result.sort((a, b) => (b.price_bottle || 0) - (a.price_bottle || 0));
    else result.sort((a, b) => (b.is_priority || 0) - (a.is_priority || 0));
    return result;
  }, [wines, filterColor, sortOrder]);

  const handleSend = async () => {
    if (!chatMsg.trim()) return;
    const newH = [...history, { role: 'user', content: chatMsg }];
    setHistory(newH); setChatMsg(""); setIsTyping(true);
    try {
      const res = await fetch(getSafeUrl('/api/sommelier'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatMsg, history: newH, wineList: wines, storeName: config?.store_name })
      });
      const d = await res.json();
      setHistory([...newH, { role: 'assistant', content: d.response }]);
    } catch (e) { setHistory([...newH, { role: 'assistant', content: "申し訳ございません。ソムリエが席を外しております。" }]); }
    setIsTyping(false);
  };

  if (loading && !slug) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-amber-600" size={48} /></div>;

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans selection:bg-amber-900 pb-32 overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_center,#1a1a1a_0%,#050505_100%)] opacity-70" />
      
      {/* Premium Header */}
      <header className="relative text-center pt-24 pb-16 px-6">
        <div className="inline-block p-5 bg-amber-500/10 rounded-[2.5rem] mb-8 border border-amber-500/20 shadow-[0_0_60px_rgba(180,83,9,0.15)]">
          <Wine className="text-amber-500" size={40} />
        </div>
        <h1 className="text-4xl md:text-6xl font-serif italic tracking-[0.2em] text-amber-50/90 uppercase leading-tight">{config?.store_name || 'LOADING...'}</h1>
        <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto mt-10 opacity-50" />
      </header>

      {/* Glassmorphic Controls */}
      <div className="relative sticky top-0 z-40 bg-[#050505]/60 backdrop-blur-2xl border-y border-white/5 px-4 py-4 mb-12 shadow-2xl">
        <div className="max-w-2xl mx-auto flex flex-col gap-5">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <div className="flex items-center px-3 text-amber-500/50"><Filter size={16}/></div>
            {["すべて", "赤", "白", "ロゼ", "泡"].map(c => (
              <button key={c} onClick={() => setFilterColor(c)} className={`px-5 py-2.5 rounded-full text-[11px] font-black border transition-all shrink-0 ${filterColor === c ? "bg-amber-600 border-amber-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"}`}>{c}</button>
            ))}
          </div>
          <div className="flex gap-2 border-t border-white/5 pt-4">
            <div className="flex items-center px-3 text-amber-500/50"><ArrowUpDown size={16}/></div>
            <button onClick={() => setSortOrder(sortOrder === "asc" ? "none" : "asc")} className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${sortOrder === "asc" ? "bg-amber-600/20 border-amber-500 text-amber-500" : "bg-white/5 border-white/10 text-white/40"}`}>価格の安い順</button>
            <button onClick={() => setSortOrder(sortOrder === "desc" ? "none" : "desc")} className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${sortOrder === "desc" ? "bg-amber-600/20 border-amber-500 text-amber-500" : "bg-white/5 border-white/10 text-white/40"}`}>価格の高い順</button>
          </div>
        </div>
      </div>

      {/* Elevated Wine Cards */}
      <div className="relative max-w-2xl mx-auto space-y-32 py-10 px-6">
        {displayWines.map(w => (
          <div key={w.id} className={`group flex flex-col md:flex-row gap-12 items-start transition-all duration-1000 ${w.is_priority ? 'scale-105' : 'opacity-90 hover:opacity-100'}`}>
            <div className="relative shrink-0 mx-auto md:mx-0">
               <div className="absolute inset-0 bg-amber-500/10 blur-[80px] rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
               <div className="relative w-48 h-72 flex items-center justify-center bg-white/[0.03] rounded-[4rem] border border-white/10 overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)] transition-all group-hover:border-amber-500/40">
                  <img src={w.image_url} className={`relative w-40 h-64 object-contain transition-all duration-1000 drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)] ${w.is_priority ? 'scale-110' : 'grayscale-[0.15] group-hover:grayscale-0'}`} alt={w.name_jp} onError={(e:any) => e.target.style.display='none'} />
               </div>
               {w.is_priority === 1 && (
                 <div className="absolute -top-6 -left-6 bg-gradient-to-br from-amber-400 to-amber-700 text-black text-[10px] font-black px-5 py-2.5 rounded-full shadow-2xl animate-pulse flex items-center gap-1 border border-white/20">
                   <Star size={12} fill="currentColor"/> SOMMELIER'S PICK
                 </div>
               )}
               <div className="absolute -bottom-8 -right-8 scale-110 group-hover:scale-125 transition-transform duration-700">
                  <FlavorRadar data={w} />
               </div>
            </div>

            <div className="flex-1 space-y-6 text-center md:text-left pt-6">
              <div className="space-y-2">
                <p className="text-amber-600 text-[11px] font-black tracking-[0.5em] uppercase">{w.country} / {w.region || 'Select Region'}</p>
                <h2 className="text-4xl font-serif tracking-tight leading-tight text-amber-50/95 group-hover:text-white transition-colors">{w.name_jp}</h2>
                <p className="text-[11px] text-white/30 font-bold tracking-[0.2em] uppercase italic">{w.name_en}</p>
              </div>

              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border transition-colors ${w.color === '赤' ? 'bg-red-950/40 border-red-500/30 text-red-200' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-100'}`}>{w.color}</span>
                <span className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border border-white/10 bg-white/5 text-white/40 uppercase">{w.grape}</span>
              </div>

              <div className="flex items-end justify-center md:justify-start gap-4">
                <p className="text-4xl font-light text-amber-200 italic tracking-tighter flex items-end">
                  <span className="text-xs text-white/30 not-italic mr-2 mb-2 uppercase tracking-widest">Bottle</span>
                  ¥{Number(w.price_bottle || 0).toLocaleString()}
                </p>
                {w.price_glass > 0 && (
                  <p className="text-xl font-light text-white/40 italic tracking-tighter flex items-end mb-1">
                    <span className="text-[10px] mr-2 mb-1">Glass</span>
                    ¥{Number(w.price_glass).toLocaleString()}
                  </p>
                )}
              </div>

              {w.ai_explanation && (
                <div className="relative p-7 bg-white/[0.02] rounded-[2.5rem] border-l-2 border-amber-600/40 backdrop-blur-sm group-hover:bg-white/[0.04] transition-all">
                  <p className="text-xs text-white/60 leading-relaxed italic font-light font-serif tracking-wide">{w.ai_explanation}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Floating AI Button */}
      <button onClick={() => setIsChatOpen(true)} className="fixed bottom-10 left-1/2 -translate-x-1/2 px-12 py-7 bg-amber-700 hover:bg-amber-600 text-white rounded-full flex items-center gap-4 shadow-[0_30px_60px_rgba(180,83,9,0.5)] transition-all active:scale-95 group z-50 border border-white/20">
        <Sparkles size={28} className="text-amber-200 group-hover:rotate-12 transition-transform" />
        <span className="text-sm font-black tracking-[0.3em] uppercase">AI Sommelier Consulting</span>
      </button>

      {/* Premium Chat Interface */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/95 backdrop-blur-xl p-0 md:p-6 animate-in fade-in duration-500">
          <div className="bg-[#0a0a0a] w-full max-w-xl h-[94vh] md:h-[700px] md:rounded-[4rem] border-t md:border border-white/10 flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)] relative overflow-hidden">
            <button onClick={() => setIsChatOpen(false)} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors z-20"><X size={32}/></button>
            <div className="p-12 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
              <h3 className="text-3xl font-serif italic text-amber-500">Wine Concierge</h3>
              <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] mt-2 font-black">AIソムリエが最適な一本をエスコートします</p>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
              {history.length === 0 && (
                <div className="text-center py-24 space-y-8 opacity-20">
                  <Wine className="mx-auto text-amber-500" size={48}/>
                  <div className="space-y-2"><p className="text-xl font-serif italic">「今夜の気分をお聞かせください」</p><p className="text-[10px] tracking-widest uppercase">お好みに合わせて特別な一本をご提案します</p></div>
                </div>
              )}
              {history.map((h, i) => (
                <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4`}>
                  <div className={`max-w-[85%] p-7 rounded-[2.5rem] text-[13px] leading-relaxed shadow-lg ${h.role === 'user' ? 'bg-amber-700 text-white font-bold' : 'bg-white/[0.05] text-amber-50/90 border border-white/10 font-light'}`}>{h.content}</div>
                </div>
              ))}
              {isTyping && <div className="flex justify-start px-4"><div className="bg-white/5 p-6 rounded-3xl animate-pulse flex gap-2"><div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" /><div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]" /><div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]" /></div></div>}
            </div>
            <div className="p-10 bg-black/50 border-t border-white/5">
              <div className="relative group">
                <input type="text" placeholder="ソムリエに相談する..." className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] py-7 pl-10 pr-20 outline-none focus:border-amber-500/50 transition-all font-bold text-sm shadow-inner group-focus-within:bg-white/10" value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} />
                <button onClick={handleSend} disabled={!chatMsg.trim() || isTyping} className="absolute right-5 top-1/2 -translate-y-1/2 text-amber-500 hover:text-amber-400 p-3 disabled:opacity-20 transition-transform active:scale-90"><Send size={28}/></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
