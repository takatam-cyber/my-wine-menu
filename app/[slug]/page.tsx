"use client";
export const runtime = 'edge';

import { useState, useEffect, useRef, use } from 'react';
import { Sparkles, X, Send, Loader2, Utensils, ChevronRight, Info, Wine } from 'lucide-react';

export default function StoreMenu({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
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
    // 店舗別ワインデータを取得
    fetch(`/api/wines?slug=${slug}`)
      .then(res => res.json())
      .then(data => setWines(Array.isArray(data) ? data : []))
      .catch(() => setWines([]));
    
    // 店舗基本設定を取得
    fetch(`/api/store/config/public?slug=${slug}`)
      .then(res => res.json())
      .then(setConfig)
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isTyping]);

  const handleChat = async () => {
    if (!message.trim() || isTyping) return;
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
      setHistory(prev => [...prev, { role: 'assistant', content: "申し訳ありません。少し考え込んでしまいました。もう一度お聞きいただけますか？" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] pb-40 text-[#E5E5E5] font-sans selection:bg-amber-500">
      {/* ラグジュアリー・ヘッダー */}
      <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5 p-8 text-center">
        <h1 className="text-3xl font-serif italic tracking-[0.2em] text-white uppercase">
          {config.store_name || 'PRIVATE SELECTION'}
        </h1>
        <div className="w-12 h-[1px] bg-amber-600 mx-auto mt-4" />
      </header>

      {/* メインリスト */}
      <div className="max-w-xl mx-auto px-6 pt-12 space-y-16">
        {wines.map(wine => (
          <div 
            key={wine.id} 
            onClick={() => setSelectedWine(wine)} 
            className="group relative cursor-pointer"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-zinc-900">
              <img 
                src={wine.image_url || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1000'} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              
              {/* インポーターの推薦バッジ */}
              {wine.is_priority === 1 && (
                <div className="absolute top-6 left-6 border border-amber-500/50 bg-black/40 backdrop-blur-md text-amber-500 text-[10px] font-bold px-4 py-2 tracking-widest uppercase shadow-2xl">
                  Importer's Selection
                </div>
              )}

              <div className="absolute bottom-8 left-8 right-8 text-left">
                <p className="text-amber-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-2">{wine.country}</p>
                <h2 className="text-2xl font-serif text-white mb-2 leading-tight group-hover:text-amber-200 transition-colors">{wine.name_jp}</h2>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-light tracking-widest text-zinc-300">
                    ¥{Number(wine.price_bottle).toLocaleString()}
                  </span>
                  <div className="h-[1px] flex-1 bg-white/10" />
                  <Info size={16} className="text-zinc-500" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AIコンシェルジュ起動ボタン */}
      <button 
        onClick={() => setChatOpen(true)} 
        className="fixed bottom-12 left-1/2 -translate-x-1/2 group z-[60]"
      >
        <div className="absolute inset-0 bg-amber-600 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
        <div className="relative bg-black border border-white/10 px-12 py-5 rounded-full flex items-center gap-4 hover:border-amber-500 transition-all shadow-2xl">
          <Sparkles className="text-amber-500 w-5 h-5 animate-pulse" />
          <span className="text-[11px] font-bold tracking-[0.4em] uppercase text-white">Ask Sommelier</span>
        </div>
      </button>

      {/* 詳細モーダル */}
      {selectedWine && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-xl flex items-end">
          <div className="bg-zinc-900 w-full max-h-[92vh] rounded-t-[3rem] overflow-y-auto pb-12 relative border-t border-white/10 shadow-2xl">
            <button 
              onClick={() => setSelectedWine(null)} 
              className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors z-20"
            >
              <X size={20} className="text-white" />
            </button>
            <div className="p-10 space-y-10 text-left">
              <div className="flex flex-col md:flex-row gap-10">
                <div className="w-full md:w-1/2 aspect-[3/4] rounded-2xl overflow-hidden bg-black">
                  <img src={selectedWine.image_url} className="w-full h-full object-contain p-4" />
                </div>
                <div className="w-full md:w-1/2 space-y-6">
                  <p className="text-amber-500 text-xs font-bold tracking-widest uppercase">{selectedWine.country} / {selectedWine.region}</p>
                  <h2 className="text-4xl font-serif text-white">{selectedWine.name_jp}</h2>
                  <div className="flex gap-4 text-zinc-400 text-sm">
                    <span className="px-3 py-1 bg-white/5 rounded-full">{selectedWine.grape}</span>
                    <span className="px-3 py-1 bg-white/5 rounded-full">{selectedWine.vintage}</span>
                  </div>
                  <div className="text-3xl font-light text-white pt-4">
                    ¥{Number(selectedWine.price_bottle).toLocaleString()}
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-sm font-medium pt-4 border-t border-white/5">
                    {selectedWine.ai_explanation}
                  </p>
                  {selectedWine.pairing && (
                    <div className="bg-amber-950/20 border border-amber-900/30 p-6 rounded-2xl text-amber-200 text-sm flex gap-4">
                      <Utensils className="shrink-0 text-amber-500" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-tighter mb-1 opacity-60">Sommelier's Pairing</p>
                        <p className="font-bold">{selectedWine.pairing}</p>
                      </div>
                    </div>
                  )}
                  <button 
                    onClick={() => {setChatOpen(true); setSelectedWine(null);}} 
                    className="w-full py-5 bg-white text-black rounded-xl font-bold uppercase tracking-widest hover:bg-amber-500 transition-all"
                  >
                    このワインについてAIに聞く
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AIチャットインターフェース */}
      {chatOpen && (
        <div className="fixed inset-0 bg-[#0A0A0A] z-[80] flex flex-col animate-in slide-in-from-bottom">
          <header className="p-8 border-b border-white/5 flex justify-between items-center bg-black/80 backdrop-blur-md sticky top-0">
            <div className="flex items-center gap-3">
              <Sparkles className="text-amber-500 w-5 h-5"/>
              <h2 className="font-serif text-xl tracking-widest text-white">AI CONCIERGE</h2>
            </div>
            <button onClick={() => setChatOpen(false)} className="p-2 hover:bg-white/5 rounded-full"><X size={24}/></button>
          </header>
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gradient-to-b from-black to-zinc-900">
            {history.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <Wine size={48} className="text-amber-500" />
                <p className="text-sm font-light tracking-[0.2em]">どのようなワインをお探しですか？</p>
              </div>
            )}
            {history.map((h, i) => (
              <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-6 rounded-2xl text-sm font-medium leading-relaxed shadow-lg ${h.role === 'user' ? 'bg-amber-600 text-white' : 'bg-zinc-800 text-zinc-100 border border-white/5'}`}>
                  {h.role === 'assistant' ? (
                    <div className="space-y-6">
                      <p className="whitespace-pre-wrap">{h.content.replace(/【ID:\d+】/g, '').trim()}</p>
                      {/* チャット内レコメンド */}
                      {Array.from(h.content.matchAll(/【ID:(\d+)】/g)).map((m: any) => {
                        const w = wines.find(x => x.id === m[1]);
                        return w && (
                          <button 
                            key={w.id} 
                            onClick={() => { setSelectedWine(w); setChatOpen(false); }} 
                            className="w-full p-4 bg-black/40 rounded-xl border border-white/10 flex gap-4 text-left hover:border-amber-500 transition-all"
                          >
                            <img src={w.image_url} className="w-12 h-16 object-cover rounded shadow-md" />
                            <div className="flex-1 flex flex-col justify-center">
                              <p className="text-[10px] text-amber-500 font-bold uppercase mb-1">{w.country}</p>
                              <p className="text-xs font-bold text-white truncate">{w.name_jp}</p>
                              <p className="text-sm font-light">¥{Number(w.price_bottle).toLocaleString()}</p>
                            </div>
                            <ChevronRight size={16} className="self-center text-zinc-600" />
                          </button>
                        );
                      })}
                    </div>
                  ) : h.content}
                </div>
              </div>
            ))}
            {isTyping && <div className="flex justify-start"><Loader2 className="animate-spin text-amber-500" /></div>}
            <div ref={chatEndRef} />
          </div>
          <div className="p-8 border-t border-white/5 bg-black flex gap-4">
            <input 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleChat()} 
              placeholder="お料理や気分を教えてください..." 
              className="flex-1 p-5 bg-zinc-900 rounded-xl text-white font-medium outline-none border border-white/5 focus:border-amber-500 transition-all" 
            />
            <button 
              onClick={handleChat} 
              disabled={!message.trim()} 
              className="bg-amber-600 text-white p-5 rounded-xl shadow-xl hover:bg-amber-500 active:scale-95 transition-all disabled:opacity-30"
            >
              <Send size={20}/>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
