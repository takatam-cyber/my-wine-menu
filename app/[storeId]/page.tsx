"use client";
export const runtime = 'edge';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, MessageCircle, X, Send, Loader2, Filter, ChevronRight } from 'lucide-react';

export default function StoreMenu() {
  const { storeId } = useParams();
  const [wines, setWines] = useState([]);
  const [config, setConfig] = useState({ menu_name: '' });
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  // フィルタ用State
  const [filterColor, setFilterColor] = useState('ALL');
  const [maxPrice, setMaxPrice] = useState(30000);

  useEffect(() => {
    if (storeId) {
      const decodedStoreId = decodeURIComponent(storeId as string);
      fetch(`/api/wines?storeId=${decodedStoreId}`).then(res => res.json()).then(data => setWines(Array.isArray(data) ? data : []));
      fetch(`/api/config`, { headers: { 'x-store-id': decodedStoreId } }).then(res => res.json()).then(data => setConfig(data));
    }
  }, [storeId]);

  const filteredWines = useMemo(() => {
    return wines.filter((w: any) => {
      const matchColor = filterColor === 'ALL' || w.color === filterColor;
      const matchPrice = Number(String(w.price).replace(/[^0-9]/g, '')) <= maxPrice;
      const inStock = !w.stock || parseInt(w.stock) > 0;
      return matchColor && matchPrice && inStock;
    });
  }, [wines, filterColor, maxPrice]);

  const handleChat = async (directMsg?: string) => {
    const msgToSend = directMsg || message;
    if (!msgToSend) return;
    setHistory(prev => [...prev, { role: 'user', content: msgToSend }]);
    setMessage("");
    setIsTyping(true);
    try {
      const res = await fetch('/api/sommelier', { method: 'POST', body: JSON.stringify({ message: msgToSend, history, wineList: wines }) });
      const data = await res.json();
      setHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (e) { setHistory(prev => [...prev, { role: 'assistant', content: "ソムリエはただいま席を外しております。" }]); } 
    finally { setIsTyping(false); }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#e2e2e2] font-sans pb-24">
      {/* 統一された高級感のあるヘッダー */}
      <header className="py-20 px-8 text-center bg-gradient-to-b from-black/50 to-transparent border-b border-white/5">
        <h1 className="text-3xl font-luxury tracking-[0.4em] text-[#f8f8f8] uppercase mb-4">{config.menu_name || 'WINE SELECTION'}</h1>
        <div className="h-[1px] w-12 bg-[#c5a059] mx-auto opacity-40"></div>
        <p className="text-[9px] tracking-[0.6em] mt-8 opacity-40 uppercase font-black">Refined Wine List</p>
      </header>

      {/* スティッキー・フィルタバー */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl px-6 py-4 border-b border-white/5 shadow-2xl">
        <div className="max-w-xl mx-auto flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {['ALL', '赤', '白', '泡'].map(c => (
            <button key={c} onClick={() => setFilterColor(c)} className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${filterColor === c ? 'bg-[#c5a059] text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 text-[#c5a059] border border-white/5'}`}>
              {c === 'ALL' ? 'Everything' : c === '泡' ? 'Bubble' : c}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 space-y-16 mt-12">
        {filteredWines.map((wine: any) => (
          <div key={wine.id} className="group animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* メインカード */}
            <div className="relative aspect-[3/2] rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-[#121318]">
              {wine.image && <img src={wine.image} className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110" />}
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-[9px] tracking-[0.4em] font-black uppercase text-[#c5a059] mb-2">{wine.country} / {wine.vintage}</p>
                <div className="flex justify-between items-end gap-4">
                  <h2 className="text-2xl text-white font-light tracking-tight leading-tight">{wine.name_jp}</h2>
                  <p className="text-xl font-bold text-white tracking-tighter whitespace-nowrap">¥{Number(String(wine.price).replace(/[^0-9]/g, '')).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* 詳細情報 */}
            <div className="mt-6 px-2 space-y-6">
              <div className="flex flex-wrap gap-3 items-center opacity-40 text-[9px] font-black uppercase tracking-widest">
                <span className="bg-white/10 px-3 py-1 rounded-full">{wine.type}</span>
                <span>{wine.region}</span>
                <span>{wine.grape}</span>
              </div>

              {/* 味わいバー (画像のデザインを再現) */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 py-2 border-l border-white/5 pl-6">
                <FlavorBar label="Body (コク)" val={wine.body} />
                <FlavorBar label="Acidity (酸味)" val={wine.acidity} />
                <FlavorBar label="Sweetness (甘味)" val={wine.sweetness} />
                <FlavorBar label={wine.color === '赤' ? 'Tannin (渋み)' : 'Aroma (香り)'} val={wine.color === '赤' ? wine.tannin : wine.aroma} />
              </div>

              <p className="text-base text-slate-300 leading-relaxed font-light italic border-l-2 border-[#c5a059]/20 pl-6 py-1">
                "{wine.advice}"
              </p>
              
              {wine.pairing && (
                <div className="flex items-center gap-3 pt-2">
                  <div className="h-[1px] flex-1 bg-white/5"></div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#c5a059] opacity-60">Best Match: {wine.pairing}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* フローティング接客UI */}
      <button onClick={() => setChatOpen(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-[#c5a059] text-black rounded-full shadow-2xl flex items-center justify-center animate-bounce z-50 transition-all hover:scale-110 active:scale-95 shadow-amber-500/30">
        <MessageCircle size={30}/>
      </button>

      {chatOpen && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl z-[60] flex flex-col p-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
            <h2 className="text-xl font-luxury tracking-widest text-white uppercase flex items-center gap-3"><Sparkles className="text-[#c5a059]" size={20}/> AI Sommelier</h2>
            <button onClick={() => setChatOpen(false)} className="text-white/40 active:scale-90 p-2"><X size={32}/></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-6 mb-6 px-2 no-scrollbar">
            {history.length === 0 && (
              <div className="space-y-4 pt-10">
                <p className="text-center text-[10px] font-black uppercase tracking-widest opacity-30 mb-8">Suggestions</p>
                {['今の気分に合う一本は？', 'お肉料理に合う重めな赤を', '1万円以下でおすすめを'].map(q => (
                  <button key={q} onClick={() => handleChat(q)} className="w-full text-left p-5 bg-white/5 rounded-2xl text-slate-300 border border-white/5 transition-all font-sans text-sm active:bg-white/10">{q}</button>
                ))}
              </div>
            )}
            {history.map((h: any, i) => (
              <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-5 rounded-3xl ${h.role === 'user' ? 'bg-[#c5a059] text-black font-bold text-sm shadow-xl' : 'bg-white/5 text-slate-100 leading-relaxed font-serif text-base'}`}>
                  {h.content}
                </div>
              </div>
            ))}
            {isTyping && <Loader2 className="animate-spin text-[#c5a059] mx-auto mt-4" />}
          </div>
          <div className="relative">
            <input type="text" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="どんなワインをお探しですか？" className="w-full bg-white/5 border border-white/10 rounded-full py-5 px-8 text-white outline-none focus:border-[#c5a059]/50 transition-all font-sans text-sm" />
            <button onClick={() => handleChat()} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c5a059] p-2 active:scale-90"><Send size={20}/></button>
          </div>
        </div>
      )}
    </main>
  );
}

function FlavorBar({ label, val }: { label: string, val: string }) {
  const level = parseInt(val) || 3;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center pr-2">
        <span className="text-[8px] font-black uppercase tracking-tighter opacity-40">{label}</span>
      </div>
      <div className="h-[3px] w-full bg-white/5 rounded-full overflow-hidden flex gap-[2px]">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className={`h-full flex-1 rounded-sm transition-all duration-1000 ${step <= level ? 'bg-[#c5a059] shadow-[0_0_8px_rgba(197,160,89,0.4)]' : 'bg-white/5'}`}></div>
        ))}
      </div>
    </div>
  );
}
