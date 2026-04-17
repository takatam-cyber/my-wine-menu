// app/[storeId]/page.tsx
"use client";
export const runtime = 'edge';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, MessageCircle, X, Send, Loader2 } from 'lucide-react';

export default function StoreMenu() {
  const { storeId } = useParams();
  const [wines, setWines] = useState([]);
  const [config, setConfig] = useState({ menu_name: '' });
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const [filterColor, setFilterColor] = useState('ALL');
  const [maxPrice, setMaxPrice] = useState(50000);

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
      const res = await fetch('/api/sommelier', { method: 'POST', body: JSON.stringify({ message: msgToSend, history, wineList: wines, storeId }) });
      const data = await res.json();
      setHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (e) {
      setHistory(prev => [...prev, { role: 'assistant', content: "ソムリエはただいま席を外しております。" }]);
    } finally { setIsTyping(false); }
  };

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans pb-24">
      {/* 高級感のある白背景ヘッダー */}
      <header className="py-16 px-8 text-center bg-white border-b border-slate-100">
        <h1 className="text-2xl font-luxury tracking-[0.3em] text-[#1a1a1a] uppercase mb-3">{config.menu_name || 'WINE LIST'}</h1>
        <div className="h-[2px] w-8 bg-[#2f5d3a] mx-auto"></div>
        <p className="text-[9px] tracking-[0.4em] mt-6 opacity-40 uppercase font-black">Sommelier Selection</p>
      </header>

      {/* フィルタバー */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl px-6 py-4 border-b border-slate-100 shadow-sm">
        <div className="max-w-xl mx-auto flex gap-2 overflow-x-auto no-scrollbar">
          {['ALL', '赤', '白', '泡'].map(c => (
            <button key={c} onClick={() => setFilterColor(c)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterColor === c ? 'bg-[#2f5d3a] text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
              {c === 'ALL' ? 'Everything' : c}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 space-y-12 mt-10">
        {filteredWines.map((wine: any) => (
          <div key={wine.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 写真エリア：明るさを最大化 */}
            <div className="relative aspect-[3/2] bg-slate-50">
              {wine.image && <img src={wine.image} className="w-full h-full object-cover" />}
              {/* 文字の可読性のための薄いグラデーションのみ残す */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-5 left-6 right-6 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">{wine.country} / {wine.vintage}</p>
                <div className="flex justify-between items-end">
                  <h2 className="text-xl font-bold tracking-tight">{wine.name_jp}</h2>
                  <p className="text-lg font-black tracking-tighter">¥{Number(String(wine.price).replace(/[^0-9]/g, '')).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* 詳細情報エリア */}
            <div className="p-6 space-y-5">
              <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-widest opacity-50">
                <span className="border border-slate-200 px-2 py-0.5 rounded">{wine.type}</span>
                <span>{wine.region}</span>
                <span>{wine.grape}</span>
              </div>

              {/* 味わいチャート：画像のデザインをさらに洗練させて再現 */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 py-2">
                <FlavorDots label="Body" val={wine.body} color="#2f5d3a" />
                <FlavorDots label="Acidity" val={wine.acidity} color="#2f5d3a" />
                <FlavorDots label="Sweetness" val={wine.sweetness} color="#2f5d3a" />
                <FlavorDots label={wine.color === '赤' ? 'Tannin' : 'Aroma'} val={wine.color === '赤' ? wine.tannin : wine.aroma} color={wine.color === '赤' ? '#8b0000' : '#2f5d3a'} />
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border-l-4 border-[#2f5d3a]">
                {wine.advice}
              </p>
              
              {wine.pairing && (
                <div className="flex items-center gap-3 text-slate-400">
                  <span className="text-[8px] font-black uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">Marriage</span>
                  <p className="text-xs font-bold">{wine.pairing}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* フローティング接客UI */}
      <button onClick={() => setChatOpen(true)} className="fixed bottom-6 right-6 w-14 h-14 bg-[#2f5d3a] text-white rounded-full shadow-2xl flex items-center justify-center animate-bounce z-50 active:scale-90 transition-all">
        <MessageCircle size={28}/>
      </button>

      {chatOpen && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-xl z-[60] flex flex-col animate-in fade-in duration-300">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-lg font-black tracking-widest uppercase flex items-center gap-2"><Sparkles className="text-[#2f5d3a]" size={18}/> AI Sommelier</h2>
            <button onClick={() => setChatOpen(false)} className="text-slate-400 p-2"><X size={28}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {history.length === 0 && (
              <div className="space-y-3 pt-10 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-6">Recommendations</p>
                {['今の気分に合う一本は？', 'お肉料理に合う重めな赤を', '1万円以下でおすすめを'].map(q => (
                  <button key={q} onClick={() => handleChat(q)} className="w-full p-4 bg-slate-50 rounded-2xl text-slate-600 font-bold text-sm border border-slate-100 active:bg-slate-100">{q}</button>
                ))}
              </div>
            )}
            {history.map((h: any, i) => (
              <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl ${h.role === 'user' ? 'bg-[#2f5d3a] text-white' : 'bg-slate-100 text-slate-800'}`}>
                  <p className="text-sm font-bold leading-relaxed">{h.content}</p>
                </div>
              </div>
            ))}
            {isTyping && <Loader2 className="animate-spin text-[#2f5d3a] mx-auto" />}
          </div>
          <div className="p-6 border-t bg-white">
            <div className="relative max-w-xl mx-auto">
              <input type="text" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="ソムリエに相談する" className="w-full bg-slate-100 rounded-full py-4 px-6 text-sm font-bold outline-none focus:ring-2 ring-[#2f5d3a]/20 transition-all" />
              <button onClick={() => handleChat()} className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#2f5d3a] text-white p-2 rounded-full active:scale-90"><Send size={18}/></button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// 味わいチャート：画像のデザインをスマホ向けにアレンジ
function FlavorDots({ label, val, color }: { label: string, val: string, color: string }) {
  const level = parseInt(val) || 3;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[8px] font-black uppercase tracking-tighter opacity-30">{label}</span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((step) => (
          <div 
            key={step} 
            className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${step <= level ? '' : 'bg-slate-100'}`}
            style={{ backgroundColor: step <= level ? color : undefined }}
          ></div>
        ))}
      </div>
    </div>
  );
}
