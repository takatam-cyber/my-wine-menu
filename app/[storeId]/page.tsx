"use client";
export const runtime = 'edge';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, X, Send, Loader2, ChevronRight, Utensils, GlassWater, RotateCcw, Banknote, Wine as WineIcon, Heart } from 'lucide-react';

export default function StoreMenu() {
  const { storeId } = useParams();
  const [wines, setWines] = useState([]);
  const [config, setConfig] = useState({ menu_name: '' });
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [diag, setDiag] = useState({ step: 0, format: '', color: '', style: '', budget: '', scene: '' });
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
      return matchColor && isVisible && w.name_jp;
    });
  }, [wines, filterColor]);

  const nextDiag = (key: string, val: string) => {
    const next = { ...diag, [key]: val, step: diag.step + 1 };
    setDiag(next);
    if (next.step === 5) {
      handleChat(`【診断】${next.format}/${next.color}/${next.style}/${next.budget}/${next.scene}。最適なおすすめを教えてください。`);
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

  // 鉄壁のカード検知ロジック
  const renderMessageContent = (content: string) => {
    const idMatches = Array.from(content.matchAll(/(?:【ID:|ID:|id:)\s*(\d+)/gi));
    const textWithoutIds = content.replace(/(?:【ID:|ID:|id:)\s*(\d+)\s*】?/gi, '').trim();
    const suggestedWines = idMatches.map(match => wines.find((w: any) => w.id === match[1])).filter(w => w);

    return (
      <div className="space-y-4 text-left">
        <p className="text-base font-black leading-relaxed text-black whitespace-pre-wrap">{textWithoutIds}</p>
        {suggestedWines.map((wine: any) => (
          <button 
            key={wine.id}
            onClick={() => {
              const el = document.getElementById(`wine-${wine.id}`);
              if (el) { setChatOpen(false); setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300); }
            }}
            className="w-full text-left bg-white rounded-3xl border-2 border-amber-500 shadow-2xl p-4 flex gap-4 animate-in zoom-in-95 active:scale-95"
          >
            <img src={wine.image} className="w-20 h-24 object-cover rounded-xl shadow-md border border-slate-100" alt="" />
            <div className="flex-1">
              <p className="text-[10px] font-black text-[#2f5d3a] uppercase mb-1">{wine.color} / {wine.type}</p>
              <p className="text-sm font-black text-black leading-tight mb-2">{wine.name_jp}</p>
              <div className="flex justify-between items-center">
                <p className="text-base font-black text-amber-700">¥{Number(wine.price_bottle).toLocaleString()}</p>
                <span className="text-[10px] font-black text-white bg-black px-4 py-1.5 rounded-full">詳細 <ChevronRight size={12} className="inline"/></span>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-white pb-40">
      <header className="py-16 text-center border-b-2 border-slate-100">
        <h1 className="text-3xl font-black uppercase text-black tracking-tighter italic">{config.menu_name || 'SELECT SELECTION'}</h1>
        <div className="h-1 w-12 bg-black mx-auto mt-4 rounded-full"></div>
      </header>

      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-6 py-5 border-b-2 flex gap-3 overflow-x-auto no-scrollbar shadow-sm">
        {['ALL', '赤', '白', 'ロゼ', '泡'].map(c => (
          <button key={c} onClick={() => setFilterColor(c)} className={`px-7 py-3 rounded-2xl text-[11px] font-black transition-all ${filterColor === c ? 'bg-black text-white shadow-xl' : 'bg-slate-100 text-black border border-slate-200'}`}>{c}</button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-6 space-y-12 mt-10">
        {filteredWines.map((wine: any) => (
          <div key={wine.id} id={`wine-${wine.id}`} className="bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100">
            <div className="relative aspect-[4/3]">
              {wine.image && <img src={wine.image} className="w-full h-full object-cover" alt="" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
              <div className="absolute bottom-8 left-8 right-8 text-white text-left">
                <p className="text-xs font-black text-amber-400 mb-2 uppercase">{wine.country} / {wine.vintage}</p>
                <div className="flex justify-between items-end"><h2 className="text-2xl font-black flex-1 pr-4 leading-tight">{wine.name_jp}</h2><p className="text-2xl font-black text-amber-400">¥{Number(wine.price_bottle).toLocaleString()}</p></div>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-x-12 gap-y-6 border-y-2 border-slate-100 py-6">
                <FlavorDots label="Body" val={wine.body} color="#000" />
                <FlavorDots label="Acidity" val={wine.acidity} color="#000" />
                <FlavorDots label="Sweetness" val={wine.sweetness} color="#000" />
                <FlavorDots label={wine.color === '赤' ? 'Tannin' : 'Aroma'} val={wine.color === '赤' ? wine.tannin : wine.aroma_intensity} color="#000" />
              </div>
              <p className="text-base text-black font-black italic bg-slate-50 p-6 rounded-3xl border-l-8 border-black text-left leading-relaxed">「{wine.menu_short}」</p>
              {wine.pairing && <div className="flex items-center gap-3 bg-black text-white px-6 py-4 rounded-2xl text-xs font-black"><Utensils size={18} className="text-amber-400"/> 相性: {wine.pairing}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-10 left-0 right-0 flex justify-center z-50 pointer-events-none">
        <button onClick={() => setChatOpen(true)} className="pointer-events-auto bg-black text-white px-10 py-6 rounded-full shadow-2xl flex items-center gap-4 animate-bounce border-2 border-amber-500"><Sparkles size={24} className="text-amber-400" /><span className="text-sm font-black tracking-widest uppercase">Consult AI Sommelier</span></button>
      </div>

      {chatOpen && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="flex justify-between items-center p-7 border-b-4 border-black bg-white">
            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-amber-400"><Sparkles size={20} /></div><h2 className="text-xl font-black text-black uppercase">Sommelier</h2></div>
            <div className="flex items-center gap-5">
              {history.length > 0 && <button onClick={() => setHistory([])} className="text-[11px] font-black text-black bg-slate-100 px-4 py-2 rounded-full uppercase">Reset</button>}
              <button onClick={() => setChatOpen(false)} className="text-black p-2"><X size={32}/></button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50">
            {history.length === 0 ? (
              <div className="space-y-8 max-w-lg mx-auto">
                <div className="bg-black text-white p-10 rounded-[3rem] border-4 border-amber-500 shadow-2xl text-left"><p className="text-2xl font-black mb-4">Concierge</p><p className="text-slate-100 text-lg font-bold">{diag.step === 0 ? "飲み方を教えてください。" : diag.step === 1 ? "ご希望の色は？" : diag.step === 2 ? "味わいの好みは？" : diag.step === 3 ? "ご予算は？" : "今のシーンは？"}</p></div>
                <div className="grid grid-cols-1 gap-4">
                  {diag.step === 0 && <><ChatOption icon={<GlassWater/>} label="グラスで" onClick={() => nextDiag('format', 'グラス')} /><ChatOption icon={<WineIcon/>} label="ボトルで" onClick={() => nextDiag('format', 'ボトル')} /></>}
                  {diag.step === 1 && <><ChatOption icon={<div className="w-6 h-6 rounded-full bg-red-700"/>} label="赤ワイン" onClick={() => nextDiag('color', '赤')} /><ChatOption icon={<div className="w-6 h-6 rounded-full bg-amber-100 border-2"/>} label="白ワイン" onClick={() => nextDiag('color', '白')} /><ChatOption icon={<div className="w-4 h-4 rounded-full bg-pink-300"/>} label="泡 / ロゼ" onClick={() => nextDiag('color', 'ロゼ・泡')} /></>}
                  {diag.step === 2 && (
                    <>{diag.color === '赤' ? (
                        <><ChatOption icon={<Heart className="text-red-600"/>} label="果実味のリッチ系" onClick={() => nextDiag('style', '果実味リッチ')} /><ChatOption icon={<Sparkles className="text-purple-600"/>} label="洗練のエレガント系" onClick={() => nextDiag('style', 'エレガント')} /></>
                      ) : (
                        <><ChatOption icon={<GlassWater className="text-blue-600"/>} label="爽快ドライ系" onClick={() => nextDiag('style', 'ドライ')} /><ChatOption icon={<Heart className="text-amber-600"/>} label="華やかフルーティー系" onClick={() => nextDiag('style', 'フルーティー')} /></>
                      )}</>
                  )}
                  {diag.step === 3 && <><ChatOption icon={<Banknote className="text-green-700"/>} label="カジュアル" onClick={() => nextDiag('budget', 'カジュアル')} /><ChatOption icon={<Banknote className="text-amber-700"/>} label="標準" onClick={() => nextDiag('budget', '標準')} /><ChatOption icon={<Banknote className="text-purple-700"/>} label="贅沢に" onClick={() => nextDiag('budget', 'プレミアム')} /></>}
                  {diag.step === 4 && <><ChatOption icon={<Utensils/>} label="お肉料理に" onClick={() => nextDiag('scene', 'お肉')} /><ChatOption icon={<Utensils/>} label="お魚・前菜に" onClick={() => nextDiag('scene', '魚介')} /><ChatOption icon={<Sparkles/>} label="旬のイチオシを" onClick={() => nextDiag('scene', 'イチオシ')} /></>}
                </div>
              </div>
            ) : (
              history.map((h, i) => (
                <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-7 rounded-[2rem] shadow-lg ${h.role === 'user' ? 'bg-black text-white border-2 border-amber-500' : 'bg-white text-black border-2 border-slate-100'}`}>
                    {h.role === 'assistant' ? renderMessageContent(h.content) : <p className="text-lg font-black whitespace-pre-wrap">{h.content}</p>}
                  </div>
                </div>
              ))
            )}
            {isTyping && <div className="flex justify-start"><Loader2 className="animate-spin text-black" size={32} /></div>}
            <div ref={chatEndRef} />
          </div>

          <div className="p-8 bg-white border-t-4 border-black flex gap-4">
            <input type="text" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="メッセージを入力..." className="flex-1 bg-slate-100 rounded-3xl py-5 px-8 text-xl font-black text-black border-4 border-transparent focus:border-black outline-none placeholder:text-slate-400" />
            <button onClick={() => handleChat()} className="bg-black text-white p-6 rounded-3xl shadow-xl active:scale-90 border-2 border-amber-500"><Send size={28}/></button>
          </div>
        </div>
      )}
    </main>
  );
}

function ChatOption({ icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-5 w-full p-7 bg-white border-4 border-slate-100 rounded-[2rem] text-black font-black text-lg shadow-sm hover:border-black active:scale-[0.98] transition-all">
      <div className="text-black">{icon}</div><span className="flex-1 text-left uppercase tracking-tighter">{label}</span><ChevronRight size={24} className="text-slate-300" />
    </button>
  );
}

function FlavorDots({ label, val, color }: { label: string, val: string, color: string }) {
  const level = parseInt(val) || 0;
  return (
    <div className="space-y-2 flex-1">
      <span className="text-[10px] font-black uppercase text-black tracking-widest block">{label}</span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((step) => <div key={step} className={`h-2 flex-1 rounded-full ${step <= level ? '' : 'bg-slate-200'}`} style={{ backgroundColor: step <= level ? color : undefined }} />)}
      </div>
    </div>
  );
}
