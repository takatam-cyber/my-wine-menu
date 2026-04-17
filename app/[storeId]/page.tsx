"use client";
export const runtime = 'edge';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, MessageCircle, X, Send, Loader2, Search, Filter } from 'lucide-react';

export default function StoreMenu() {
  const { storeId } = useParams();
  const [wines, setWines] = useState([]);
  const [config, setConfig] = useState({ menu_name: '', slug: '' });
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  // フィルタ用State
  const [filterColor, setFilterColor] = useState('ALL');
  const [maxPrice, setMaxPrice] = useState(30000);

  useEffect(() => {
    if (storeId) {
      fetch(`/api/wines?storeId=${storeId}`).then(res => res.json()).then(data => setWines(Array.isArray(data) ? data : []));
      fetch(`/api/config`, { headers: { 'x-store-id': storeId } }).then(res => res.json()).then(data => setConfig(data));
    }
  }, [storeId]);

  // フィルタリングロジック
  const filteredWines = useMemo(() => {
    return wines.filter((w: any) => {
      const matchColor = filterColor === 'ALL' || w.color === filterColor;
      const matchPrice = Number(w.price) <= maxPrice;
      const inStock = parseInt(w.stock) > 0;
      return matchColor && matchPrice && inStock;
    });
  }, [wines, filterColor, maxPrice]);

  const handleChat = async (directMsg?: string) => {
    const msgToSend = directMsg || message;
    if (!msgToSend) return;
    
    const userMsg = { role: 'user', content: msgToSend };
    setHistory(prev => [...prev, userMsg]);
    setMessage("");
    setIsTyping(true);

    try {
      const res = await fetch('/api/sommelier', {
        method: 'POST',
        body: JSON.stringify({ message: msgToSend, history, wineList: wines, storeId })
      });
      const data = await res.json();
      setHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (e) {
      setHistory(prev => [...prev, { role: 'assistant', content: "申し訳ありません。ソムリエはただいま席を外しております。" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#c5a059] font-serif pb-24">
      {/* 統一表題 */}
      <header className="py-24 px-6 text-center border-b border-white/5">
        <h1 className="text-4xl font-light tracking-[0.4em] text-[#f8f8f8] uppercase mb-4">WINE MENU</h1>
        <div className="h-[1px] w-24 bg-[#c5a059] mx-auto opacity-30"></div>
        <p className="text-[10px] tracking-[0.5em] mt-8 opacity-40 uppercase font-sans font-black tracking-widest">Sommelier Selection</p>
      </header>

      {/* 検索・フィルタUI（固定表示） */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md py-6 px-6 border-b border-white/5 space-y-4">
        <div className="max-w-xl mx-auto flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {['ALL', '赤', '白', '泡'].map(c => (
            <button key={c} onClick={() => setFilterColor(c)} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterColor === c ? 'bg-[#c5a059] text-black' : 'bg-white/10 text-[#c5a059]'}`}>
              {c === 'ALL' ? 'ALL WINES' : c === '泡' ? 'Sparkling' : c}
            </button>
          ))}
        </div>
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <input type="range" min="3000" max="50000" step="1000" value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="flex-1 accent-[#c5a059]" />
          <span className="text-[10px] font-sans font-black w-24 text-right">~ ¥{maxPrice.toLocaleString()}</span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 space-y-24 mt-16">
        {filteredWines.length === 0 ? (
          <p className="text-center py-20 opacity-40 font-sans text-sm">条件に合うワインが見つかりませんでした</p>
        ) : (
          filteredWines.map((wine: any) => (
            <div key={wine.id} className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="relative aspect-[3/4] rounded-sm overflow-hidden shadow-2xl border border-white/5 bg-[#1a1c23]">
                <img src={wine.image} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
                  <div className="pr-4">
                    <p className="text-[10px] tracking-[0.4em] font-sans font-black uppercase text-[#c5a059] opacity-80">{wine.country} / {wine.vintage}</p>
                    <h2 className="text-3xl text-white font-light leading-tight">{wine.name_jp}</h2>
                  </div>
                  <p className="text-2xl font-sans text-white font-bold tracking-tighter">¥{Number(wine.price).toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-8 px-2">
                <div className="flex flex-wrap gap-4 text-[11px] font-sans font-black uppercase tracking-[0.2em] opacity-40">
                  <span className="bg-white/10 px-3 py-1 rounded-full">{wine.type}</span>
                  <span>{wine.region}</span>
                  <span>{wine.grape}</span>
                </div>
                <p className="text-xl text-slate-200 leading-relaxed italic font-light border-l-2 border-[#c5a059]/40 pl-8">"{wine.advice}"</p>
                {wine.pairing && <p className="text-xs font-sans font-black uppercase tracking-widest text-[#c5a059] opacity-60">Pairing: {wine.pairing}</p>}
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
          
          <div className="flex-1 overflow-y-auto space-y-6 mb-6 px-2 scroll-smooth">
            {history.length === 0 && (
              <div className="space-y-4 pt-10">
                <p className="text-center text-[10px] font-black uppercase tracking-widest opacity-40 mb-6">AIソムリエへの相談例</p>
                {['今の気分に合う一本を教えて', 'お肉料理に合う重めの赤はある？', '1万円以下でおすすめの白は？'].map(q => (
                  <button key={q} onClick={() => handleChat(q)} className="w-full text-left p-5 bg-white/5 rounded-2xl text-slate-200 border border-white/10 active:border-[#c5a059] transition-all font-sans text-sm">
                    {q}
                  </button>
                ))}
              </div>
            )}
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
            <input type="text" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="例：お肉料理に合う一本は？" className="w-full bg-white/10 border border-[#c5a059]/30 rounded-full py-5 px-8 text-white outline-none focus:border-[#c5a059] transition-all font-sans" />
            <button onClick={() => handleChat()} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c5a059]"><Send size={24}/></button>
          </div>
        </div>
      )}
    </main>
  );
}
