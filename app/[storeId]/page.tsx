"use client";
export const runtime = 'edge';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, X, Send, Loader2, ChevronRight, Utensils, GlassWater, Tag, RotateCcw, Banknote, Wine as WineIcon } from 'lucide-react';

export default function StoreMenu() {
  const { storeId } = useParams();
  const [wines, setWines] = useState([]);
  const [config, setConfig] = useState({ menu_name: '' });
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [diag, setDiag] = useState({ step: 0, format: '', color: '', budget: '', preference: '' });
  const [filterColor, setFilterColor] = useState('ALL');

  useEffect(() => {
    if (storeId) {
      const decodedStoreId = decodeURIComponent(storeId as string);
      fetch(`/api/wines?storeId=${decodedStoreId}`).then(res => res.json()).then(data => setWines(Array.isArray(data) ? data : []));
      fetch(`/api/config`, { headers: { 'x-store-id': decodedStoreId } }).then(res => res.json()).then(data => setConfig(data));
    }
  }, [storeId]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [history, isTyping]);

  const filteredWines = useMemo(() => {
    return wines.filter((w: any) => {
      const matchColor = filterColor === 'ALL' || w.color === filterColor;
      const isVisible = String(w.visible || 'ON').trim().toUpperCase() === 'ON';
      const stockNum = parseInt(String(w.stock || '1').trim());
      const inStock = isNaN(stockNum) || stockNum > 0;
      return matchColor && isVisible && inStock;
    });
  }, [wines, filterColor]);

  const minimizeChat = () => setChatOpen(false);
  const resetChat = () => {
    setHistory([]);
    setDiag({ step: 0, format: '', color: '', budget: '', preference: '' });
    setMessage("");
  };

  const nextDiag = (key: string, val: string) => {
    const next = { ...diag, [key]: val, step: diag.step + 1 };
    setDiag(next);
    if (next.step === 4) {
      handleChat(`飲み方は「${next.format}」で、予算は「${next.budget}」。色は「${next.color}」で、今日は「${next.preference}」の気分です。最適な1本を選び、理由と共に提案してください。最後に 【ID:ワインのID】 を付けてください。`);
    }
  };

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
    } catch (e) {
      setHistory(prev => [...prev, { role: 'assistant', content: "現在混み合っております。" }]);
    } finally { setIsTyping(false); }
  };

  const renderMessageContent = (content: string) => {
    const idMatch = content.match(/【ID:(\d+)】/);
    const textWithoutId = content.replace(/【ID:\d+】/, '');
    const suggestedWine = idMatch ? wines.find((w: any) => w.id === idMatch[1]) : null;

    return (
      <div className="space-y-4">
        <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{textWithoutId}</p>
        {suggestedWine && (
          <button 
            onClick={() => {
              const el = document.getElementById(`wine-${suggestedWine.id}`);
              if (el) { 
                minimizeChat();
                setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
              }
            }}
            className="w-full text-left bg-white rounded-2xl overflow-hidden border-2 border-amber-200 shadow-md hover:border-amber-400 transition-all active:scale-95 p-3 flex gap-4"
          >
            <img src={suggestedWine.image} className="w-20 h-24 object-cover rounded-lg" alt="" />
            <div className="flex-1 relative">
              <p className="text-[10px] font-black text-[#2f5d3a] uppercase">{suggestedWine.color} / {suggestedWine.type}</p>
              <p className="text-sm font-black text-slate-800 leading-tight mb-1">{suggestedWine.name_jp}</p>
              <p className="text-xs font-black text-amber-600">¥{Number(suggestedWine.price_bottle).toLocaleString()}</p>
              <p className="absolute bottom-0 right-0 text-[#2f5d3a] font-black text-[9px] flex items-center gap-1">このワインへ移動 <ChevronRight size={10}/></p>
            </div>
          </button>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans pb-32">
      <header className="py-12 px-8 text-center bg-white border-b border-slate-100">
        <h1 className="text-2xl font-bold tracking-[0.2em] uppercase mb-2">{config.menu_name || 'WINE SELECTION'}</h1>
        <div className="h-[2px] w-8 bg-[#2f5d3a] mx-auto"></div>
      </header>

      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-100 shadow-sm overflow-x-auto no-scrollbar flex gap-2">
        {['ALL', '赤', '白', 'ロゼ', '泡'].map(c => (
          <button key={c} onClick={() => setFilterColor(c)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${filterColor === c ? 'bg-[#2f5d3a] text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>{c}</button>
        ))}
      </div>

      <div className="max-w-xl mx-auto px-6 space-y-10 mt-8">
        {filteredWines.map((wine: any) => (
          <div key={wine.id} id={`wine-${wine.id}`} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100">
            <div className="relative aspect-[16/10] bg-slate-50">
              {wine.image && <img src={wine.image} className="w-full h-full object-cover" alt="" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-5 left-6 right-6 text-white">
                <p className="text-[10px] font-black uppercase opacity-80 mb-1">{wine.country} {wine.vintage && `/ ${wine.vintage}`}</p>
                <div className="flex justify-between items-end"><h2 className="text-xl font-bold leading-tight">{wine.name_jp}</h2><p className="text-lg font-black tracking-tighter">¥{Number(wine.price_bottle).toLocaleString()}</p></div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-50">
                <FlavorDots label="Body" val={wine.body} color="#2f5d3a" />
                <FlavorDots label="Acidity" val={wine.acidity} color="#2f5d3a" />
                <FlavorDots label="Sweetness" val={wine.sweetness} color="#2f5d3a" />
                <FlavorDots label={wine.color === '赤' ? 'Tannin' : 'Aroma'} val={wine.color === '赤' ? wine.tannin : wine.aroma_intensity} color={wine.color === '赤' ? '#8b0000' : '#2f5d3a'} />
              </div>
              <p className="text-sm text-slate-800 font-bold italic leading-relaxed">「{wine.menu_short}」</p>
              {wine.pairing && <div className="flex items-start gap-2 text-[#2f5d3a] bg-[#2f5d3a]/5 p-3 rounded-2xl text-[11px] font-bold"><Utensils size={14}/> 相性: {wine.pairing}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
        <button onClick={() => setChatOpen(true)} className="pointer-events-auto bg-[#2f5d3a] text-white px-8 py-5 rounded-full shadow-2xl flex items-center gap-3 animate-bounce"><Sparkles size={20} className="text-amber-400" /><span className="text-sm font-black tracking-widest uppercase">AI Sommelier</span></button>
      </div>

      {chatOpen && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="flex justify-between items-center p-6 border-b">
            <div className="flex items-center gap-2"><div className="w-8 h-8 bg-[#2f5d3a] rounded-full flex items-center justify-center text-amber-400"><Sparkles size={16} /></div><h2 className="text-lg font-bold tracking-widest uppercase text-[#2f5d3a]">AI Sommelier</h2></div>
            <div className="flex items-center gap-4">
              {history.length > 0 && <button onClick={resetChat} className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase"><RotateCcw size={12}/> Reset</button>}
              <button onClick={minimizeChat} className="text-slate-400 p-2"><X size={28}/></button>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8f9f8]">
            {history.length === 0 ? (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border"><p className="text-[#2f5d3a] font-black text-xl mb-2">{diag.step === 0 ? "いらっしゃいませ。まずは飲み方を教えてください。" : diag.step === 1 ? "ご希望の色は？" : diag.step === 2 ? "ご予算の目安はいかがでしょうか？" : "今の気分やお料理は？"}</p></div>
                <div className="grid grid-cols-1 gap-3">
                  {diag.step === 0 && <><ChatOption icon={<GlassWater/>} label="グラスで軽く楽しみたい" onClick={() => nextDiag('format', 'グラス')} /><ChatOption icon={<WineIcon/>} label="ボトルでしっかり楽しみたい" onClick={() => nextDiag('format', 'ボトル')} /></>}
                  {diag.step === 1 && <><ChatOption icon={<div className="w-4 h-4 rounded-full bg-red-700"/>} label="赤ワイン" onClick={() => nextDiag('color', '赤')} /><ChatOption icon={<div className="w-4 h-4 rounded-full bg-amber-100 border"/>} label="白ワイン" onClick={() => nextDiag('color', '白')} /><ChatOption icon={<div className="w-4 h-4 rounded-full bg-pink-300"/>} label="ロゼ / 泡" onClick={() => nextDiag('color', 'ロゼ・泡')} /></>}
                  {diag.step === 2 && <><ChatOption icon={<Banknote/>} label="カジュアルに (~4,000円)" onClick={() => nextDiag('budget', 'カジュアル')} /><ChatOption icon={<Banknote/>} label="標準的に (4,000~10,000円)" onClick={() => nextDiag('budget', '標準')} /><ChatOption icon={<Banknote/>} label="贅沢に (10,000円以上)" onClick={() => nextDiag('budget', 'プレミアム')} /></>}
                  {diag.step === 3 && <><ChatOption icon={<Utensils/>} label="お肉料理に合わせて" onClick={() => nextDiag('preference', '肉料理')} /><ChatOption icon={<Utensils/>} label="お魚料理に合わせて" onClick={() => nextDiag('preference', '魚料理')} /><ChatOption icon={<Sparkles/>} label="今飲むべき一本を教えて" onClick={() => nextDiag('preference', 'ソムリエのイチオシ')} /></>}
                </div>
              </div>
            ) : (
              history.map((h, i) => (
                <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-5 rounded-2xl ${h.role === 'user' ? 'bg-[#2f5d3a] text-white shadow-lg' : 'bg-white text-slate-800 border'}`}>
                    {h.role === 'assistant' ? renderMessageContent(h.content) : <p className="text-sm font-bold whitespace-pre-wrap">{h.content}</p>}
                  </div>
                </div>
              ))
            )}
            {isTyping && <div className="flex justify-start"><div className="bg-white p-4 rounded-2xl border"><Loader2 className="animate-spin text-[#2f5d3a]" size={20} /></div></div>}
            <div ref={chatEndRef} />
          </div>
          <div className="p-6 bg-white border-t flex gap-2">
            <input type="text" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="追加の質問があればどうぞ..." className="flex-1 bg-slate-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none" />
            <button onClick={() => handleChat()} className="bg-[#2f5d3a] text-white p-4 rounded-2xl active:scale-90"><Send size={20}/></button>
          </div>
        </div>
      )}
    </main>
  );
}

function ChatOption({ icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-4 w-full p-6 bg-white border border-slate-100 rounded-2xl text-slate-700 font-bold text-sm shadow-sm hover:border-[#2f5d3a]/20 transition-all">
      <div className="text-[#2f5d3a]">{icon}</div><span className="flex-1 text-left">{label}</span><ChevronRight size={16} className="opacity-30" />
    </button>
  );
}

function FlavorDots({ label, val, color }: { label: string, val: string, color: string }) {
  const level = parseInt(val) || 0;
  return (
    <div className="space-y-1 flex-1">
      <span className="text-[8px] font-black uppercase opacity-30">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((step) => <div key={step} className={`h-1 flex-1 rounded-full ${step <= level ? '' : 'bg-slate-100'}`} style={{ backgroundColor: step <= level ? color : undefined }} />)}
      </div>
    </div>
  );
}
