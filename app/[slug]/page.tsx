"use client";
export const runtime = 'edge';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, X, Send, Loader2, Utensils, Star, Info, ChevronRight } from 'lucide-react';

interface Wine {
  id: string; name_jp: string; name_en?: string; country: string; region?: string;
  price_bottle: number; price_glass?: number; ai_explanation: string; image_url: string;
  pairing?: string; is_priority?: boolean; shipper?: string; visible?: string; is_visible?: number;
}

export default function StoreMenu() {
  const { slug } = useParams();
  const [wines, setWines] = useState<Wine[]>([]);
  const [config, setConfig] = useState({ store_name: '' });
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/wines?slug=${slug}`).then(res => res.json()).then(data => {
      setWines(data.map((w: any) => ({ 
        ...w, 
        is_priority: w.shipper?.includes('ピーロート') || w.is_priority === 1 
      })));
    }).catch(console.error);
    fetch(`/api/store/config/public?slug=${slug}`).then(res => res.json()).then(setConfig).catch(() => {});
  }, [slug]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history, isTyping]);

  const handleChat = async () => {
    if (!message.trim() || isTyping) return;
    const userMsg = message; setHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setMessage(""); setIsTyping(true);
    try {
      const res = await fetch('/api/sommelier', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history, wineList: wines })
      });
      const data = await res.json();
      setHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (e) {
      setHistory(prev => [...prev, { role: 'assistant', content: "通信エラーが発生しました。もう一度お試しください。" }]);
    } finally { setIsTyping(false); }
  };

  const filteredWines = useMemo(() => wines.filter(w => w.visible === 'ON' || w.is_visible === 1), [wines]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-32 text-slate-900 font-sans">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b p-6 text-center shadow-sm">
        <h1 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">
          {config.store_name || 'THE WINE LIST'}
        </h1>
      </header>

      <div className="max-w-2xl mx-auto px-5 pt-8 space-y-8">
        {filteredWines.map(wine => (
          <div key={wine.id} onClick={() => setSelectedWine(wine)} className={`group relative bg-white rounded-[2.5rem] overflow-hidden shadow-xl border-2 transition-all active:scale-95 cursor-pointer ${wine.is_priority ? 'border-amber-400' : 'border-transparent'}`}>
            {wine.is_priority && (
              <div className="absolute top-5 left-5 z-20 bg-amber-400 text-black text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Star size={10} fill="currentColor"/> SPECIAL SELECTION
              </div>
            )}
            <div className="relative aspect-[16/10]">
              <img src={wine.image_url || "/api/placeholder/400/300"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={wine.name_jp} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent" />
              <div className="absolute bottom-6 left-8 right-8 text-white">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">{wine.country}</p>
                <h2 className="text-2xl font-black leading-tight mb-2">{wine.name_jp}</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black">¥{Number(wine.price_bottle).toLocaleString()}</span>
                  {wine.price_glass && <span className="text-sm text-slate-300">Glass: ¥{Number(wine.price_glass).toLocaleString()}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setChatOpen(true)} className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-12 py-6 rounded-full shadow-2xl flex items-center gap-4 border-2 border-amber-500 z-50 hover:bg-black hover:scale-105 transition-all group">
        <Sparkles className="text-amber-400 group-hover:rotate-12 transition-transform" />
        <span className="font-black uppercase tracking-widest text-sm">AI Sommelier</span>
      </button>

      {selectedWine && (
        <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-md flex items-end animate-in fade-in duration-300">
          <div className="bg-white w-full max-h-[90vh] rounded-t-[3.5rem] overflow-y-auto pb-12 shadow-2xl relative">
            <button onClick={() => setSelectedWine(null)} className="absolute top-6 right-6 p-4 bg-slate-100 rounded-full z-20 hover:bg-slate-200 transition-colors"><X size={24}/></button>
            <div className="p-8 space-y-8">
              <div className="relative w-full aspect-square"><img src={selectedWine.image_url} className="w-full h-full object-contain mix-blend-multiply drop-shadow-2xl" /></div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 leading-tight mb-2">{selectedWine.name_jp}</h2>
                <p className="text-slate-400 font-bold italic">{selectedWine.name_en}</p>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                <p className="text-lg text-slate-700 leading-relaxed font-medium">{selectedWine.ai_explanation}</p>
              </div>
              {selectedWine.pairing && (
                <div className="bg-emerald-50 p-8 rounded-[2rem] text-emerald-900 border border-emerald-100">
                  <div className="flex items-center gap-3 mb-2 font-black uppercase text-xs tracking-widest text-emerald-600"><Utensils size={16}/> Best Pairing</div>
                  <p className="text-xl font-bold">{selectedWine.pairing}</p>
                </div>
              )}
              <button onClick={() => {setChatOpen(true); setSelectedWine(null);}} className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black shadow-xl transition-all">AIに相談して決める</button>
            </div>
          </div>
        </div>
      )}

      {chatOpen && (
        <div className="fixed inset-0 bg-white z-[80] flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="px-8 py-8 border-b flex justify-between items-center bg-white sticky top-0 z-10">
            <div className="flex items-center gap-3"><div className="p-2 bg-slate-900 rounded-lg"><Sparkles size={20} className="text-amber-400"/></div><h2 className="font-black text-lg tracking-tighter">AI SOMMELIER</h2></div>
            <button onClick={() => setChatOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><X size={24}/></button>
          </header>
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#FDFDFD]">
            {history.map((h, i) => (
              <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-6 rounded-[2rem] shadow-lg ${h.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-900 border border-slate-100 rounded-tl-none'}`}>
                  {h.role === 'assistant' ? (
                    <div className="space-y-6">
                      <p className="text-lg font-bold leading-relaxed whitespace-pre-wrap">{h.content.replace(/【ID:(\d+)】/g, '').trim()}</p>
                      <div className="grid gap-3">
                        {Array.from(h.content.matchAll(/【ID:(\d+)】/g)).map(m => {
                          const w = wines.find(x => x.id === m[1]);
                          return w && (
                            <button key={w.id} onClick={() => { setSelectedWine(w); setChatOpen(false); }} className={`w-full p-4 rounded-2xl border-2 flex gap-4 text-left transition-all hover:scale-[1.02] active:scale-95 ${w.is_priority ? 'border-amber-400 bg-amber-50' : 'border-slate-100 bg-slate-50'}`}>
                              <img src={w.image_url} className="w-16 h-20 object-contain bg-white rounded-lg shadow-sm" />
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                {w.is_priority && <span className="text-[8px] font-black text-amber-600 mb-1">PRO CHOICE</span>}
                                <p className="text-xs font-black text-slate-900 truncate">{w.name_jp}</p>
                                <p className="text-sm font-black text-slate-900">¥{Number(w.price_bottle).toLocaleString()}</p>
                              </div>
                              <ChevronRight className="self-center text-slate-300" size={20} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : <p className="text-lg font-bold">{h.content}</p>}
                </div>
              </div>
            ))}
            {isTyping && <div className="flex justify-start"><div className="bg-white p-6 rounded-[2rem] shadow-md border border-slate-100"><Loader2 className="animate-spin text-amber-500" /></div></div>}
            <div ref={chatEndRef} />
          </div>
          <div className="p-8 border-t bg-white flex gap-3">
            <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="どんな気分ですか？例：重めの赤が飲みたい" className="flex-1 bg-slate-100 px-6 py-5 rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 ring-amber-400 transition-all" />
            <button onClick={handleChat} disabled={!message.trim() || isTyping} className="bg-slate-900 text-white w-16 h-16 rounded-2xl shadow-xl flex items-center justify-center disabled:opacity-50 active:scale-90 transition-all"><Send/></button>
          </div>
        </div>
      )}
    </main>
  );
}
