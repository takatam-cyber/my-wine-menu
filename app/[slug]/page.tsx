"use client";
export const runtime = 'edge';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, X, Send, Loader2, Utensils, Star, Info, ChevronRight } from 'lucide-react';

// --- Types ---
interface Wine {
  id: string;
  name_jp: string;
  name_en?: string;
  country: string;
  region?: string;
  price_bottle: number;
  price_glass?: number;
  ai_explanation: string;
  image_url: string;
  pairing?: string;
  is_priority?: boolean;
  shipper?: string;
  visible?: string;
  is_visible?: number;
  tags?: string;
}

export default function StoreMenu() {
  const { slug } = useParams();
  const [wines, setWines] = useState<Wine[]>([]);
  const [config, setConfig] = useState({ store_name: '', theme_color: '#000000' });
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slug) {
      fetch(`/api/wines?slug=${slug}`)
        .then(res => res.json())
        .then(data => {
          const processed = data.map((w: any) => ({
            ...w,
            is_priority: w.shipper?.includes('ピーロート') || w.is_priority === 1
          }));
          setWines(processed);
        })
        .catch(err => console.error("Fetch error:", err));

      fetch(`/api/store/config/public?slug=${slug}`)
        .then(res => res.json())
        .then(setConfig)
        .catch(() => {});
    }
  }, [slug]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isTyping]);

  const trackView = async (wineId: string) => {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wine_id: wineId, store_slug: slug })
    });
  };

  const handleChat = async () => {
    if (!message.trim()) return;
    const userMsg = message;
    setHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setMessage("");
    setIsTyping(true);

    try {
      const res = await fetch('/api/sommelier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history, wineList: wines })
      });
      const data = await res.json();
      setHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (e) {
      setHistory(prev => [...prev, { role: 'assistant', content: "申し訳ありません。エラーが発生しました。" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const filteredWines = useMemo(() => {
    return wines.filter((w) => w.visible === 'ON' || w.is_visible === 1);
  }, [wines]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-32 text-slate-900 font-sans tracking-tight">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-8 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Exclusive Wine Selection</p>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">
          {config.store_name || 'THE WINE LIST'}
        </h1>
      </header>

      <div className="max-w-2xl mx-auto px-5 pt-8 space-y-10">
        {filteredWines.map((wine) => (
          <div 
            key={wine.id} 
            onClick={() => { setSelectedWine(wine); trackView(wine.id); }}
            className={`group relative bg-white rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl active:scale-[0.98] cursor-pointer border-2 ${
              wine.is_priority ? 'border-amber-400 shadow-amber-100 shadow-2xl' : 'border-transparent shadow-xl'
            }`}
          >
            {wine.is_priority && (
              <div className="absolute top-5 left-5 z-20 bg-amber-400 text-black text-[10px] font-black px-4 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                <Star size={12} fill="currentColor" /> SPECIAL SELECTION
              </div>
            )}

            <div className="relative aspect-[16/10] overflow-hidden">
              <img 
                src={wine.image_url || "/api/placeholder/400/300"} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                alt={wine.name_jp}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
              
              <div className="absolute bottom-6 left-8 right-8 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded uppercase tracking-widest text-amber-300">
                    {wine.country}
                  </span>
                </div>
                <h2 className="text-2xl font-black leading-tight mb-2 group-hover:text-amber-400 transition-colors">
                  {wine.name_jp}
                </h2>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-black text-white">
                      ¥{Number(wine.price_bottle).toLocaleString()}
                    </span>
                    <span className="text-[10px] ml-2 text-slate-400 uppercase font-bold tracking-widest">Bottle</span>
                  </div>
                  {wine.price_glass && wine.price_glass > 0 && (
                    <div className="text-right">
                      <span className="text-lg font-bold text-amber-400">¥{Number(wine.price_glass).toLocaleString()}</span>
                      <span className="block text-[8px] text-slate-400 uppercase font-bold tracking-widest text-center">Glass</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={() => setChatOpen(true)} 
        className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-12 py-6 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 border-2 border-amber-500/50 z-50 hover:bg-black hover:scale-105 active:scale-95 transition-all group"
      >
        <Sparkles className="text-amber-400" />
        <span className="font-black uppercase tracking-[0.2em] text-sm">AI Sommelier</span>
      </button>

      {selectedWine && (
        <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-md flex items-end animate-in slide-in-from-bottom duration-500">
          <div className="bg-white w-full max-h-[95vh] rounded-t-[3.5rem] overflow-y-auto pb-16 shadow-2xl relative">
            <div className="sticky top-0 right-0 p-6 flex justify-end z-20 pointer-events-none">
              <button onClick={() => setSelectedWine(null)} className="p-4 bg-white/90 backdrop-blur shadow-xl rounded-full pointer-events-auto border border-slate-100 active:scale-90 transition-all">
                <X size={24} className="text-slate-900"/>
              </button>
            </div>
            <div className="px-8 -mt-6">
              <div className="relative w-full aspect-square mb-8">
                <img src={selectedWine.image_url} className="w-full h-full object-contain mix-blend-multiply drop-shadow-2xl" />
              </div>
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 leading-tight mb-2">{selectedWine.name_jp}</h2>
                  <p className="text-slate-400 font-bold italic tracking-wider">{selectedWine.name_en}</p>
                </div>
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                   <p className="text-lg text-slate-700 leading-relaxed font-medium">{selectedWine.ai_explanation}</p>
                </div>
                {selectedWine.pairing && (
                  <div className="bg-emerald-50 p-8 rounded-[2rem] text-emerald-900 border border-emerald-100">
                    <p className="text-xl font-bold font-black mb-2 flex items-center gap-2"><Utensils size={20}/> Best Pairing</p>
                    <p className="text-lg font-bold">{selectedWine.pairing}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {chatOpen && (
        <div className="fixed inset-0 bg-white z-[80] flex flex-col animate-in slide-in-from-bottom duration-500">
          <header className="px-8 py-8 border-b flex justify-between items-center bg-white sticky top-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center">
                <Sparkles size={20} className="text-amber-400"/>
              </div>
              <div>
                <h2 className="font-black text-lg leading-none uppercase">AI SOMMELIER</h2>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="p-2 bg-slate-100 rounded-full">
              <X size={24} className="text-slate-400"/>
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#FDFDFD]">
            {history.map((h, i) => (
              <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-6 rounded-[2rem] ${h.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none shadow-xl' : 'bg-white text-slate-900 shadow-lg border border-slate-100 rounded-tl-none'}`}>
                  {h.role === 'assistant' ? (
                    <div className="space-y-6">
                      <p className="text-lg font-bold leading-relaxed whitespace-pre-wrap">{h.content.replace(/【ID:(\d+)】/g, '').trim()}</p>
                      <div className="grid gap-3">
                        {Array.from(h.content.matchAll(/【ID:(\d+)】/g)).map(match => {
                          const wine = wines.find(w => w.id === match[1]);
                          return wine && (
                            <button key={wine.id} onClick={() => { setSelectedWine(wine); setChatOpen(false); trackView(wine.id); }} className={`w-full p-4 rounded-2xl border-2 flex gap-4 text-left transition-all ${wine.is_priority ? 'border-amber-400 bg-amber-50' : 'border-slate-100 bg-slate-50'}`}>
                              <img src={wine.image_url} className="w-16 h-20 object-contain bg-white rounded-lg" />
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <p className="text-xs font-black text-slate-900 truncate">{wine.name_jp}</p>
                                <p className="text-sm font-black text-slate-900">¥{Number(wine.price_bottle).toLocaleString()}</p>
                              </div>
                              <ChevronRight className="self-center text-slate-300" size={20} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-lg font-bold leading-relaxed">{h.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isTyping && <div className="flex justify-start"><Loader2 className="animate-spin text-amber-500" /></div>}
            <div ref={chatEndRef} />
          </div>

          <div className="p-8 border-t bg-white">
            <div className="flex gap-3 bg-slate-100 p-2 rounded-3xl border border-slate-200">
              <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="気分や好みを入力..." className="flex-1 bg-transparent px-6 py-4 font-bold text-slate-900 outline-none" />
              <button onClick={handleChat} disabled={!message.trim()} className="bg-slate-900 text-white w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center disabled:opacity-50 transition-all active:scale-90">
                <Send size={24} />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
