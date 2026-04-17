// app/[storeId]/page.tsx
"use client";
export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, MessageCircle, X, Send, Loader2 } from 'lucide-react';

export default function StoreMenu() {
  const { storeId } = useParams();
  const [wines, setWines] = useState([]);
  const [config, setConfig] = useState({ menu_name: '', slug: '' });
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (storeId) {
      // storeIdをデコード（メールアドレスの場合、特殊文字が含まれる可能性があるため）
      const decodedStoreId = decodeURIComponent(storeId as string);
      
      // ワインリスト取得
      fetch(`/api/wines?storeId=${decodedStoreId}`)
        .then(res => res.json())
        .then(data => setWines(Array.isArray(data) ? data : []))
        .catch(err => console.error("Wines fetch error:", err));

      // 店舗設定取得
      fetch(`/api/config`, { headers: { 'x-store-id': decodedStoreId } })
        .then(res => res.json())
        .then(data => setConfig(data))
        .catch(err => console.error("Config fetch error:", err));
    }
  }, [storeId]);

  const handleChat = async () => {
    if (!message) return;
    const userMsg = { role: 'user', content: message };
    setHistory(prev => [...prev, userMsg]);
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
      <header className="py-24 px-6 text-center border-b border-white/5">
        <h1 className="text-4xl font-light tracking-[0.4em] text-[#f8f8f8] uppercase mb-4">{config.menu_name || 'WINE MENU'}</h1>
        <div className="h-[1px] w-24 bg-[#c5a059] mx-auto opacity-30"></div>
        <p className="text-[10px] tracking-[0.5em] mt-8 opacity-40 uppercase font-sans font-black tracking-widest">Sommelier Selection</p>
      </header>

      <div className="max-w-xl mx-auto px-6 space-y-24 mt-16">
        {/* 在庫が0より大きいもの、または在庫設定がないものを表示 */}
        {wines.length === 0 ? (
          <div className="text-center py-20 opacity-30 font-sans text-sm tracking-widest uppercase">No Wines registered yet.</div>
        ) : (
          wines.filter((w: any) => !w.stock || parseInt(w.stock) > 0).map((wine: any) => (
            <div key={wine.id} className="space-y-12 animate-in fade-in duration-700">
              <div className="relative aspect-[3/4] rounded-sm overflow-hidden shadow-2xl border border-white/5 bg-[#1a1c23]">
                {wine.image && <img src={wine.image} className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
                  <div className="pr-4">
                    <p className="text-[10px] tracking-[0.4em] font-sans font-black uppercase text-[#c5a059] opacity-80">{wine.country} / {wine.vintage}</p>
                    <h2 className="text-3xl text-white font-light leading-tight">{wine.name_jp}</h2>
                  </div>
                  <p className="text-3xl font-sans text-white font-bold tracking-tighter">¥{Number(wine.price).toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-8 px-2">
                <div className="flex flex-wrap gap-4 text-[11px] font-sans font-black uppercase tracking-[0.2em] opacity-40">
                  <span className="bg-white/10 px-3 py-1 rounded-full">{wine.type}</span>
                  <span>{wine.region}</span>
                  <span>{wine.grape}</span>
                </div>
                <p className="text-xl text-slate-200 leading-relaxed italic font-light border-l-2 border-[#c5a059]/40 pl-8">"{wine.advice}"</p>
                {wine.pairing && <p className="text-xs font-sans font-black uppercase tracking-widest text-[#c5a059] opacity-60">Matching: {wine.pairing}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      <button onClick={() => setChatOpen(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-[#c5a059] text-black rounded-full shadow-2xl flex items-center justify-center animate-bounce z-50">
        <MessageCircle size={32}/>
      </button>

      {chatOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[60] flex flex-col p-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-light tracking-widest text-white uppercase flex items-center gap-3"><Sparkles className="text-[#c5a059]"/> AI Sommelier</h2>
            <button onClick={() => setChatOpen(false)} className="text-white opacity-50"><X size={32}/></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-6 mb-6 px-2">
            {history.map((h: any, i) => (
              <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-5 rounded-2xl ${h.role === 'user' ? 'bg-[#c5a059] text-black font-bold font-sans text-sm' : 'bg-white/5 text-slate-100 leading-relaxed'}`}>
                  {h.content}
                </div>
              </div>
            ))}
            {isTyping && <Loader2 className="animate-spin text-[#c5a059] mx-auto mt-4" />}
          </div>
          <div className="relative">
            <input type="text" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="今の気分や料理を教えてください" className="w-full bg-white/10 border border-[#c5a059]/30 rounded-full py-5 px-8 text-white outline-none focus:border-[#c5a059] transition-all font-sans" />
            <button onClick={handleChat} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c5a059]"><Send size={24}/></button>
          </div>
        </div>
      )}
    </main>
  );
}
