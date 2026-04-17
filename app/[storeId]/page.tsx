// app/[storeId]/page.tsx
"use client";
export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Wine as WineIcon, Sparkles, MessageCircle, X, Send, Loader2 } from 'lucide-react';

export default function StoreMenu() {
  const { storeId } = useParams();
  const [wines, setWines] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    fetch(`/api/wines?storeId=${storeId}`).then(res => res.json()).then(data => setWines(data));
  }, [storeId]);

  const handleChat = async () => {
    if (!message) return;
    const userMsg = { role: 'user', content: message };
    setHistory([...history, userMsg]);
    setMessage("");
    setIsTyping(true);

    const res = await fetch('/api/sommelier', {
      method: 'POST',
      body: JSON.stringify({ message, history, wineList: wines })
    });
    const data = await res.json();
    setHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    setIsTyping(false);
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#c5a059] font-serif pb-24">
      <header className="py-20 px-6 text-center">
        <h1 className="text-4xl font-light tracking-[0.3em] text-[#f8f8f8] uppercase mb-4">{storeId}</h1>
        <div className="h-[1px] w-20 bg-[#c5a059] mx-auto opacity-30"></div>
      </header>

      <div className="max-w-xl mx-auto px-6 space-y-20">
        {wines.filter((w: any) => parseInt(w.stock) > 0).map((wine: any) => (
          <div key={wine.id} className="group">
            <div className="relative aspect-[3/4] rounded-sm overflow-hidden shadow-2xl mb-8 border border-white/5">
              <img src={wine.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
              <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-[#c5a059] mb-2">{wine.country} / {wine.vintage}</p>
                  <h2 className="text-3xl text-white font-light">{wine.name_jp}</h2>
                </div>
                <p className="text-2xl text-white font-sans font-bold italic">¥{Number(wine.price).toLocaleString()}</p>
              </div>
            </div>
            <p className="text-slate-300 leading-relaxed italic font-light text-lg px-2">"{wine.advice}"</p>
          </div>
        ))}
      </div>

      {/* AI Sommelier Floating Button */}
      <button onClick={() => setChatOpen(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-[#c5a059] text-black rounded-full shadow-2xl flex items-center justify-center animate-bounce hover:scale-110 transition-transform z-50">
        <MessageCircle size={32}/>
      </button>

      {chatOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex flex-col p-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-light tracking-widest text-white uppercase flex items-center gap-3">
              <Sparkles className="text-[#c5a059]"/> AI Sommelier
            </h2>
            <button onClick={() => setChatOpen(false)} className="text-white opacity-50"><X size={32}/></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-6 mb-6 px-2 scrollbar-hide">
            {history.map((h: any, i) => (
              <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl ${h.role === 'user' ? 'bg-[#c5a059] text-black font-bold' : 'bg-white/5 text-slate-200 leading-relaxed'}`}>
                  {h.content}
                </div>
              </div>
            ))}
            {isTyping && <Loader2 className="animate-spin text-[#c5a059] mx-auto" />}
          </div>
          <div className="relative">
            <input type="text" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="どんなワインをお探しですか？" className="w-full bg-white/10 border border-[#c5a059]/30 rounded-full py-5 px-8 text-white outline-none focus:border-[#c5a059] transition-all" />
            <button onClick={handleChat} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c5a059]"><Send size={24}/></button>
          </div>
        </div>
      )}
    </main>
  );
}
