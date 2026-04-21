"use client";
export const runtime = 'edge';
import { useState, useEffect, useMemo, useRef, use } from 'react'; // useを追記
import { Sparkles, X, Send, Loader2, Utensils, Star, ChevronRight } from 'lucide-react';

export default function StoreMenu({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params); // Next.js 15方式の解決
  const [wines, setWines] = useState<any[]>([]);
  const [config, setConfig] = useState({ store_name: '' });
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedWine, setSelectedWine] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    // 店舗別のワイン（在庫あり）を取得
    fetch(`/api/wines?slug=${slug}`).then(res => res.json()).then(data => {
      setWines(Array.isArray(data) ? data : []);
    }).catch(() => setWines([]));
    
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
    } finally { setIsTyping(false); }
  };

  const filteredWines = useMemo(() => wines.filter(w => w.is_visible !== 0), [wines]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-32 text-slate-900">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b p-6 text-center">
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">{config.store_name || 'WINE MENU'}</h1>
      </header>

      <div className="max-w-2xl mx-auto px-5 pt-8 space-y-8 text-left">
        {filteredWines.map(wine => (
          <div key={wine.id} onClick={() => setSelectedWine(wine)} className={`relative bg-white rounded-[2rem] overflow-hidden shadow-xl border-2 transition-all active:scale-95 cursor-pointer ${wine.is_priority ? 'border-amber-400' : 'border-transparent'}`}>
            {wine.is_priority === 1 && <div className="absolute top-4 left-4 z-10 bg-amber-400 text-black text-[10px] font-black px-3 py-1 rounded-full shadow-md">★ PRO RECOMMENDED</div>}
            <div className="relative aspect-[16/9]"><img src={wine.image_url} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" />
              <div className="absolute bottom-4 left-6 text-white">
                <p className="text-[10px] font-bold text-amber-400 uppercase">{wine.country}</p>
                <h2 className="text-xl font-black leading-tight">{wine.name_jp}</h2>
                <p className="text-lg font-bold">¥{Number(wine.price_bottle).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setChatOpen(true)} className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-3 border-2 border-amber-500 z-50 hover:scale-105 transition-all">
        <Sparkles className="text-amber-400" /><span className="font-black uppercase text-sm tracking-widest">AI Sommelier</span>
      </button>

      {selectedWine && (
        <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-md flex items-end">
          <div className="bg-white w-full max-h-[90vh] rounded-t-[3rem] overflow-y-auto pb-12 relative shadow-2xl">
            <button onClick={() => setSelectedWine(null)} className="absolute top-6 right-6 p-3 bg-slate-100 rounded-full z-20"><X size={20}/></button>
            <div className="p-8 space-y-6 text-left">
              <img src={selectedWine.image_url} className="w-full aspect-square object-contain bg-slate-50 rounded-3xl" />
              <h2 className="text-3xl font-black">{selectedWine.name_jp}</h2>
              <p className="text-slate-600 leading-relaxed font-medium">{selectedWine.ai_explanation}</p>
              {selectedWine.pairing && <div className="bg-emerald-50 p-6 rounded-2xl text-emerald-800 font-bold flex gap-3"><Utensils/> {selectedWine.pairing}</div>}
              <button onClick={() => {setChatOpen(true); setSelectedWine(null);}} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest">AIに詳しく聞く</button>
            </div>
          </div>
        </div>
      )}

      {chatOpen && (
        <div className="fixed inset-0 bg-white z-[80] flex flex-col">
          <header className="p-6 border-b flex justify-between items-center bg-white sticky top-0 shadow-sm">
            <div className="flex items-center gap-3"><Sparkles className="text-amber-500"/><h2 className="font-black tracking-tighter">AI SOMMELIER</h2></div>
            <button onClick={() => setChatOpen(false)}><X size={24}/></button>
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
            {history.map((h, i) => (
              <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-5 rounded-[1.5rem] font-bold shadow-sm ${h.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
                  {h.role === 'assistant' ? (
                    <div className="space-y-4 text-left">
                      <p className="whitespace-pre-wrap">{h.content.replace(/【ID:\d+】/g, '').trim()}</p>
                      {Array.from(h.content.matchAll(/【ID:(\d+)】/g)).map((m: any) => {
                        const w = wines.find(x => x.id === m[1]);
                        return w && (
                          <button key={w.id} onClick={() => { setSelectedWine(w); setChatOpen(false); }} className={`w-full p-3 rounded-xl border-2 flex gap-3 text-left ${w.is_priority ? 'border-amber-400 bg-amber-50' : 'bg-slate-50'}`}>
                            <img src={w.image_url} className="w-12 h-16 object-cover rounded" />
                            <div className="flex-1 min-w-0 flex flex-col justify-center"><p className="text-xs font-black truncate">{w.name_jp}</p><p className="text-sm font-black">¥{Number(w.price_bottle).toLocaleString()}</p></div>
                            <ChevronRight className="self-center text-slate-300" />
                          </button>
                        );
                      })}
                    </div>
                  ) : h.content}
                </div>
              </div>
            ))}
            {isTyping && <div className="flex justify-start p-4"><Loader2 className="animate-spin text-amber-500" /></div>}
            <div ref={chatEndRef} />
          </div>
          <div className="p-6 border-t bg-white flex gap-2">
            <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="どんな気分ですか？" className="flex-1 p-4 bg-slate-100 rounded-xl font-bold outline-none" />
            <button onClick={handleChat} disabled={!message.trim()} className="bg-slate-900 text-white p-4 rounded-xl shadow-lg active:scale-95"><Send/></button>
          </div>
        </div>
      )}
    </main>
  );
}
