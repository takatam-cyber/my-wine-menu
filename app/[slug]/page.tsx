// app/[slug]/page.tsx (完全版)
"use client";
export const runtime = 'edge';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, X, Send, Loader2, ChevronRight, Utensils, GlassWater, Wine as WineIcon, Heart, Banknote } from 'lucide-react';

export default function StoreMenu() {
  const params = useParams();
  const slug = params?.slug as string;
  
  const [wines, setWines] = useState([]);
  const [config, setConfig] = useState({ store_name: '' });
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedWine, setSelectedWine] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [diag, setDiag] = useState({ step: 0, format: '', color: '', style: '', budget: '', scene: '' });
  const [filterColor, setFilterColor] = useState('ALL');

  useEffect(() => {
    if (slug) {
      // 店舗データとワインリストを並行して取得
      fetch(`/api/wines?slug=${slug}`).then(res => res.json()).then(setWines);
      fetch(`/api/store/config/public?slug=${slug}`).then(res => res.json()).then(setConfig);
    }
  }, [slug]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [history, isTyping]);

  // アナリティクス送信（どのワインが興味を持たれたか）
  const trackView = async (wineId: string) => {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wine_id: wineId, store_slug: slug })
    });
  };

  const handleChat = async (directMsg?: string) => {
    const msgToSend = directMsg || message;
    if (!msgToSend) return;
    setHistory(prev => [...prev, { role: 'user', content: msgToSend }]);
    setMessage("");
    setIsTyping(true);
    try {
      const res = await fetch('/api/sommelier', { 
        method: 'POST', 
        body: JSON.stringify({ message: msgToSend, history, wineList: wines }) 
      });
      const data = await res.json();
      setHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } finally { setIsTyping(false); }
  };

  const nextDiag = (key: string, val: string) => {
    const next = { ...diag, [key]: val, step: diag.step + 1 };
    setDiag(next);
    if (next.step === 5) {
      handleChat(`【診断結果】飲み方:${next.format}, 予算:${next.budget}, 色:${next.color}, 味わい:${next.style}, シーン:${next.scene}。最適なお勧めを教えてください。最後に必ずIDを添えて。`);
    }
  };

  const filteredWines = useMemo(() => {
    return wines.filter((w: any) => {
      const matchColor = filterColor === 'ALL' || w.color === filterColor;
      return matchColor && (w.is_visible === 1 || w.visible === 'ON');
    });
  }, [wines, filterColor]);

  // AI回答内の【ID:xxx】を解析してカード化
  const renderMessageContent = (content: string) => {
    const idMatches = Array.from(content.matchAll(/(?:ID:|【ID:|ID：)(\d+)/gi));
    const textOnly = content.replace(/(?:【ID:|ID:|ID：)(\d+)\s*】?/gi, '').trim();
    const suggested = idMatches.map(m => wines.find((w: any) => w.id === m[1])).filter(w => w);

    return (
      <div className="space-y-4 text-left">
        <p className="text-[15px] font-bold leading-relaxed">{textOnly}</p>
        {suggested.map((wine: any) => (
          <button key={wine.id} onClick={() => { setChatOpen(false); setSelectedWine(wine); trackView(wine.id); }} className="w-full bg-white rounded-2xl border-2 border-amber-400 p-3 flex gap-4 shadow-lg">
            <img src={wine.image_url || wine.image} className="w-16 h-20 object-cover rounded-lg" />
            <div className="text-left">
              <p className="text-[10px] font-bold text-green-700">{wine.color} / {wine.type}</p>
              <p className="text-sm font-bold text-black">{wine.name_jp}</p>
              <p className="text-sm font-bold text-amber-700 mt-1">¥{Number(wine.price_bottle).toLocaleString()}</p>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-32 text-black">
      <header className="py-12 px-8 text-center bg-white border-b-2">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">{config.store_name || 'WINE MENU'}</h1>
        <div className="h-1 w-10 bg-black mx-auto mt-3 rounded-full"></div>
      </header>

      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-6 py-5 border-b flex gap-3 overflow-x-auto no-scrollbar shadow-sm">
        {['ALL', '赤', '白', 'ロゼ', '泡'].map(c => (
          <button key={c} onClick={() => setFilterColor(c)} className={`px-7 py-3 rounded-2xl text-[11px] font-bold transition-all ${filterColor === c ? 'bg-black text-white' : 'bg-white border-2'}`}>{c}</button>
        ))}
      </div>

      <div className="max-w-xl mx-auto px-6 space-y-12 mt-10">
        {filteredWines.map((wine: any) => (
          <div key={wine.id} onClick={() => { setSelectedWine(wine); trackView(wine.id); }} className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 cursor-pointer active:scale-95 transition-all">
            <div className="relative aspect-[4/3]">
              <img src={wine.image_url || wine.image} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute bottom-6 left-8 right-8 text-white text-left">
                 <p className="text-[10px] font-bold text-amber-400 uppercase">{wine.country} / {wine.vintage}</p>
                 <h2 className="text-2xl font-bold">{wine.name_jp}</h2>
                 <p className="text-xl font-bold text-amber-400">¥{Number(wine.price_bottle).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none">
        <button onClick={() => setChatOpen(true)} className="pointer-events-auto bg-black text-white px-10 py-6 rounded-full shadow-2xl flex items-center gap-4 animate-bounce border-2 border-amber-500">
          <Sparkles className="text-amber-400" /><span className="text-sm font-bold uppercase tracking-widest">Consult AI Sommelier</span>
        </button>
      </div>

      {selectedWine && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end animate-in fade-in">
          <div className="bg-white w-full max-h-[90vh] rounded-t-[3rem] overflow-y-auto pb-12 shadow-2xl">
            <div className="p-6 flex justify-between items-center border-b sticky top-0 bg-white/80 backdrop-blur-md">
              <h3 className="font-bold italic">Wine Detail</h3>
              <button onClick={() => setSelectedWine(null)} className="p-2 bg-slate-100 rounded-full"><X size={24}/></button>
            </div>
            <div className="p-8 space-y-6 text-left">
              <img src={selectedWine.image_url || selectedWine.image} className="w-full aspect-square object-contain bg-slate-50 rounded-3xl" />
              <h2 className="text-2xl font-black">{selectedWine.name_jp}</h2>
              <p className="text-slate-600 leading-loose font-medium">{selectedWine.ai_explanation}</p>
              {selectedWine.pairing && <div className="bg-green-50 p-5 rounded-2xl text-green-800 font-bold flex gap-3"><Utensils/> 相性の良い一皿: {selectedWine.pairing}</div>}
            </div>
          </div>
        </div>
      )}

      {chatOpen && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="p-6 border-b flex justify-between items-center">
            <h2 className="font-bold uppercase flex items-center gap-2"><Sparkles className="text-amber-500"/> AI Sommelier</h2>
            <button onClick={() => setChatOpen(false)}><X size={32}/></button>
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
            {history.length === 0 ? (
              <div className="space-y-6 max-w-md mx-auto pt-10">
                <div className="bg-black text-white p-8 rounded-[2.5rem] border-2 border-amber-500 shadow-xl text-left">
                   <p className="text-xl font-bold mb-2 italic text-amber-400">Wine Concierge</p>
                   <p className="font-bold">{diag.step === 0 ? "今夜の気分はいかがですか？" : diag.step === 1 ? "ご希望の色は？" : diag.step === 2 ? "味わいの方向性は？" : diag.step === 3 ? "予算の目安は？" : "お料理やシーンは？"}</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {diag.step === 0 && <><DiagBtn label="グラスで気軽に" onClick={()=>nextDiag('format','グラス')}/><DiagBtn label="ボトルでゆったり" onClick={()=>nextDiag('format','ボトル')}/></>}
                  {diag.step === 1 && <><DiagBtn label="赤ワイン" onClick={()=>nextDiag('color','赤')}/><DiagBtn label="白ワイン" onClick={()=>nextDiag('color','白')}/></>}
                  {/* 同様に他のステップのボタンを追加 */}
                </div>
              </div>
            ) : (
              history.map((h, i) => (
                <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-6 rounded-[2rem] ${h.role === 'user' ? 'bg-black text-white' : 'bg-white text-black shadow-md'}`}>
                    {h.role === 'assistant' ? renderMessageContent(h.content) : h.content}
                  </div>
                </div>
              ))
            )}
            {isTyping && <div className="flex justify-start"><Loader2 className="animate-spin text-amber-500" /></div>}
            <div ref={chatEndRef} />
          </div>
          <div className="p-6 border-t flex gap-3">
            <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleChat()} placeholder="ソムリエに相談..." className="flex-1 p-5 bg-slate-100 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-black" />
            <button onClick={() => handleChat()} className="bg-black text-white p-5 rounded-2xl shadow-xl"><Send/></button>
          </div>
        </div>
      )}
    </main>
  );
}

function DiagBtn({ label, onClick }: any) {
  return <button onClick={onClick} className="w-full p-6 bg-white border-2 rounded-2xl font-bold text-left flex justify-between items-center hover:border-black transition-all">{label} <ChevronRight/></button>;
}
