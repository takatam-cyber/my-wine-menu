// app/[slug]/page.tsx (完全上書き)
"use client";
export const runtime = 'edge';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, X, Send, Loader2, Utensils, GlassWater, Wine as WineIcon } from 'lucide-react';

export default function StoreMenu() {
  const { slug } = useParams();
  const [wines, setWines] = useState([]);
  const [config, setConfig] = useState({ store_name: '' });
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedWine, setSelectedWine] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slug) {
      fetch(`/api/wines?slug=${slug}`).then(res => res.json()).then(setWines);
      fetch(`/api/store/config/public?slug=${slug}`).then(res => res.json()).then(setConfig);
    }
  }, [slug]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [history, isTyping]);

  const trackView = async (wineId: string) => {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wine_id: wineId, store_slug: slug })
    });
  };

  const handleChat = async () => {
    if (!message) return;
    setHistory(prev => [...prev, { role: 'user', content: message }]);
    const currentMsg = message;
    setMessage("");
    setIsTyping(true);
    try {
      const res = await fetch('/api/sommelier', { 
        method: 'POST', 
        body: JSON.stringify({ message: currentMsg, history, wineList: wines }) 
      });
      const data = await res.json();
      setHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } finally { setIsTyping(false); }
  };

  const filteredWines = useMemo(() => {
    return wines.filter((w: any) => w.is_visible === 1 || w.visible === 'ON');
  }, [wines]);

  return (
    <main className="min-h-screen bg-slate-50 pb-32 text-black text-left">
      <header className="py-12 px-8 text-center bg-white border-b-2">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">{config.store_name || 'WINE MENU'}</h1>
      </header>

      <div className="max-w-xl mx-auto px-6 space-y-12 mt-10">
        {filteredWines.map((wine: any) => (
          <div key={wine.id} onClick={() => { setSelectedWine(wine); trackView(wine.id); }} className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 cursor-pointer active:scale-95 transition-all">
            <div className="relative aspect-[4/3]">
              <img src={wine.image_url || wine.image} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute bottom-6 left-8 right-8 text-white">
                 <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">{wine.country}</p>
                 <h2 className="text-2xl font-black leading-tight">{wine.name_jp}</h2>
                 <p className="text-xl font-bold text-amber-400">¥{Number(wine.price_bottle).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none">
        <button onClick={() => setChatOpen(true)} className="pointer-events-auto bg-black text-white px-10 py-6 rounded-full shadow-2xl flex items-center gap-4 animate-bounce border-2 border-amber-500">
          <Sparkles className="text-amber-400" /><span className="text-sm font-black uppercase tracking-widest">AI Sommelier</span>
        </button>
      </div>

      {selectedWine && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end animate-in fade-in">
          <div className="bg-white w-full max-h-[90vh] rounded-t-[3rem] overflow-y-auto pb-12 shadow-2xl">
            <div className="p-6 flex justify-between items-center border-b sticky top-0 bg-white/80 backdrop-blur-md">
              <h3 className="font-bold italic">Wine Detail</h3>
              <button onClick={() => setSelectedWine(null)} className="p-2 bg-slate-100 rounded-full"><X size={24} className="text-slate-400"/></button>
            </div>
            <div className="p-8 space-y-6">
              <img src={selectedWine.image_url} className="w-full aspect-square object-contain bg-slate-50 rounded-3xl" />
              <h2 className="text-2xl font-black">{selectedWine.name_jp}</h2>
              <p className="text-slate-600 leading-loose font-medium">{selectedWine.ai_explanation}</p>
              {selectedWine.pairing && <div className="bg-green-50 p-5 rounded-2xl text-green-800 font-bold flex gap-3"><Utensils/> 相性: {selectedWine.pairing}</div>}
            </div>
          </div>
        </div>
      )}

      {chatOpen && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="p-6 border-b flex justify-between items-center bg-white">
            <h2 className="font-black uppercase flex items-center gap-2"><Sparkles className="text-amber-500"/> AI Sommelier</h2>
            <button onClick={() => setChatOpen(false)}><X size={32} className="text-slate-400"/></button>
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
            {history.map((h, i) => (
              <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-6 rounded-[2rem] font-bold ${h.role === 'user' ? 'bg-black text-white' : 'bg-white text-black shadow-md'}`}>{h.content}</div>
              </div>
            ))}
            {isTyping && <div className="flex justify-start"><Loader2 className="animate-spin text-amber-500" /></div>}
            <div ref={chatEndRef} />
          </div>
          <div className="p-6 border-t flex gap-3 bg-white">
            <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleChat()} placeholder="ソムリエに相談..." className="flex-1 p-5 bg-slate-100 rounded-2xl font-bold outline-none" />
            <button onClick={handleChat} className="bg-black text-white p-5 rounded-2xl shadow-xl"><Send/></button>
          </div>
        </div>
      )}
    </main>
  );
}
