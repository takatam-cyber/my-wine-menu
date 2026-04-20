// app/[slug]/page.tsx
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

  const handleChat = async () => {
    if (!message) return;
    setHistory(prev => [...prev, { role: 'user', content: message }]);
    const currentMsg = message;
    setMessage("");
    setIsTyping(true);
    try {
      const res = await fetch('/api/sommelier', { 
        method: 'POST', body: JSON.stringify({ message: currentMsg, history, wineList: wines }) 
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
        <h1 className="text-3xl font-black italic uppercase">{config.store_name || 'WINE MENU'}</h1>
      </header>

      <div className="max-w-xl mx-auto px-6 space-y-12 mt-10">
        {filteredWines.map((wine: any) => (
          <div key={wine.id} onClick={() => { setSelectedWine(wine); /* track analytics */ }} className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border cursor-pointer active:scale-95 transition-all">
            <div className="relative aspect-[4/3]">
              <img src={wine.image_url || wine.image} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute bottom-6 left-8 right-8 text-white">
                 <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">{wine.country}</p>
                 <h2 className="text-2xl font-black">{wine.name_jp}</h2>
                 <p className="text-xl font-bold text-amber-400">¥{Number(wine.price_bottle).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setChatOpen(true)} className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black text-white px-10 py-6 rounded-full shadow-2xl flex items-center gap-4 border-2 border-amber-500 animate-bounce">
        <Sparkles className="text-amber-400" /><span className="font-black uppercase">AI Sommelier</span>
      </button>

      {/* 詳細・チャットモーダルUI */}
      {chatOpen && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col">
          <header className="p-6 border-b flex justify-between items-center">
            <h2 className="font-bold flex items-center gap-2"><Sparkles className="text-amber-500"/> AI Sommelier</h2>
            <button onClick={() => setChatOpen(false)}><X size={32}/></button>
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
            {history.map((h, i) => (
              <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-6 rounded-[2rem] ${h.role === 'user' ? 'bg-black text-white' : 'bg-white text-black shadow-md'}`}>
                  {h.role === 'assistant' ? (
                    <div className="space-y-4">
                      <p className="whitespace-pre-wrap font-bold">{h.content.replace(/【ID:\d+】/g, '').trim()}</p>
                      {Array.from(h.content.matchAll(/【ID:(\d+)】/g)).map(match => {
                        const w = wines.find((wine: any) => wine.id === match[1]);
                        return w && (
                          <button key={w.id} onClick={() => { setSelectedWine(w); setChatOpen(false); }} className="w-full bg-slate-50 p-3 rounded-xl border-2 border-amber-400 flex gap-3 text-left">
                            <img src={w.image_url} className="w-12 h-16 object-cover rounded" />
                            <div className="flex-1 overflow-hidden">
                              <p className="text-[10px] font-black truncate">{w.name_jp}</p>
                              <p className="text-xs font-bold text-amber-700">¥{Number(w.price_bottle).toLocaleString()}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : h.content}
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 border-t flex gap-3"><input value={message} onChange={e => setMessage(e.target.value)} className="flex-1 p-5 bg-slate-100 rounded-2xl font-bold" /><button onClick={handleChat} className="bg-black text-white p-5 rounded-2xl"><Send/></button></div>
        </div>
      )}
    </main>
  );
}
