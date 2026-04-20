"use client";
export const runtime = 'edge';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, X, Send, Loader2, ChevronRight, Utensils, GlassWater, Tag, RotateCcw, Banknote, Wine as WineIcon, Heart } from 'lucide-react';

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

  const minimizeChat = () => setChatOpen(false);
  const resetChat = () => {
    setHistory([]);
    setDiag({ step: 0, format: '', color: '', style: '', budget: '', scene: '' });
    setMessage("");
  };

  const nextDiag = (key: string, val: string) => {
    const next = { ...diag, [key]: val, step: diag.step + 1 };
    setDiag(next);
    if (next.step === 5) {
      handleChat(`飲み方は「${next.format}」、予算は「${next.budget}」。種類は「${next.color}」で「${next.style}」な味わいを希望。場面は「${next.scene}」です。最適な提案をお願いします。最後に必ず 【ID:番号】 を付けてください。`);
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
      setHistory(prev => [...prev, { role: 'assistant', content: "申し訳ございません。通信環境をご確認ください。" }]);
    } finally { setIsTyping(false); }
  };

  const renderMessageContent = (content: string) => {
    const idMatches = Array.from(content.matchAll(/【ID:(\d+)】/g));
    const textWithoutIds = content.replace(/【ID:\d+】/g, '').trim();
    const suggestedWines = idMatches.map(match => wines.find((w: any) => w.id === match[1])).filter(w => w);

    return (
      <div className="space-y-4">
        <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap text-slate-900">{textWithoutIds}</p>
        {suggestedWines.map((wine: any) => (
          <button 
            key={wine.id}
            onClick={() => {
              const el = document.getElementById(`wine-${wine.id}`);
              if (el) { 
                minimizeChat();
                setTimeout(() => {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.classList.add('ring-4', 'ring-amber-500');
                  setTimeout(() => el.classList.remove('ring-4', 'ring-amber-500'), 2500);
                }, 300);
              }
            }}
            className="w-full text-left bg-white rounded-2xl border-2 border-amber-200 shadow-lg p-3 flex gap-4 animate-in zoom-in-95"
          >
            <img src={wine.image} className="w-16 h-20 object-cover rounded-lg flex-shrink-0" alt="" />
            <div className="flex-1">
              <p className="text-[8px] font-black text-[#2f5d3a] uppercase">{wine.color} / {wine.type}</p>
              <p className="text-xs font-black text-slate-900 leading-tight mb-1">{wine.name_jp}</p>
              <p className="text-xs font-black text-amber-600">¥{Number(wine.price_bottle).toLocaleString()}</p>
              <p className="text-right text-[#2f5d3a] font-black text-[9px] mt-1">詳細を見る <ChevronRight size={10} className="inline"/></p>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#fafafa] pb-32">
      <header className="py-12 px-8 text-center bg-white border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-[0.2em] uppercase text-black">{config.menu_name || 'WINE SELECTION'}</h1>
        <div className="h-[2px] w-8 bg-[#2f5d3a] mx-auto mt-2"></div>
      </header>

      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex gap-2 overflow-x-auto no-scrollbar">
        {['ALL', '赤', '白', 'ロゼ', '泡'].map(c => (
          <button key={c} onClick={() => setFilterColor(c)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${filterColor === c ? 'bg-[#2f5d3a] text-white shadow-lg' : 'bg-slate-200 text-slate-700'}`}>{c}</button>
        ))}
      </div>

      <div className="max-w-xl mx-auto px-6 space-y-10 mt-8">
        {filteredWines.map((wine: any) => (
          <div key={wine.id} id={`wine-${wine.id}`} className="bg-white rounded-[2.5rem] overflow-hidden shadow-md border border-slate-200 transition-all duration-500">
            <div className="relative aspect-[16/10]">
              {wine.image && <img src={wine.image} className="w-full h-full object-cover" alt="" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-5 left-6 right-6 text-white text-left">
                <p className="text-[10px] font-black uppercase mb-1">{wine.country} {wine.vintage && `/ ${wine.vintage}`}</p>
                <div className="flex justify-between items-end"><h2 className="text-xl font-bold leading-tight">{wine.name_jp}</h2><p className="text-lg font-black tracking-tighter">¥{Number(wine.price_bottle).toLocaleString()}</p></div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-100 text-left">
                <FlavorDots label="Body" val={wine.body} color="#2f5d3a" />
                <FlavorDots label="Acidity" val={wine.acidity} color="#2f5d3a" />
                <FlavorDots label="Sweetness" val={wine.sweetness} color="#2f5d3a" />
                <FlavorDots label={wine.color === '赤' ? 'Tannin' : 'Aroma'} val={wine.color === '赤' ? wine.tannin : wine.aroma_intensity} color={wine.color === '赤' ? '#8b0000' : '#2f5d3a'} />
              </div>
              <p className="text-sm text-slate-900 font-bold italic leading-relaxed text-left">「{wine.menu_short}」</p>
              {wine.pairing && <div className="flex items-center gap-2 text-[#2f5d3a] bg-[#2f5d3a]/10 p-3 rounded-2xl text-[11px] font-black"><Utensils size={14}/> 相性: {wine.pairing}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
        <button onClick={() => setChatOpen(true)} className="pointer-events-auto bg-[#2f5d3a] text-white px-8 py-5 rounded-full shadow-2xl flex items-center gap-3 animate-bounce"><Sparkles size={20} className="text-amber-400" /><span className="text-sm font-black tracking-widest uppercase">Consult AI Sommelier</span></button>
      </div>

      {chatOpen && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="flex justify-between items-center p-6 border-b border-slate-200">
            <div className="flex items-center gap-2"><div className="w-8 h-8 bg-[#2f5d3a] rounded-full flex items-center justify-center text-amber-400"><Sparkles size={16} /></div><h2 className="text-lg font-bold tracking-widest uppercase text-[#2f5d3a]">AI Sommelier</h2></div>
            <div className="flex items-center gap-4">
              {history.length > 0 && <button onClick={resetChat} className="text-[10px] font-black text-slate-600 flex items-center gap-1 uppercase"><RotateCcw size={12}/>最初から</button>}
              <button onClick={minimizeChat} className="text-slate-600 p-2"><X size={28}/></button>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8f9f8]">
            {history.length === 0 ? (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200"><p className="text-[#2f5d3a] font-black text-xl mb-2">{diag.step === 0 ? "今夜はどのようなスタイルで楽しまれますか？" : diag.step === 1 ? "ご希望の色はございますか？" : diag.step === 2 ? "味わいの方向性はいかがでしょう？" : diag.step === 3 ? "ご予算の目安を教えてください。" : "最後にお料理やシーンは？"}</p></div>
                <div className="grid grid-cols-1 gap-3">
                  {diag.step === 0 && <><ChatOption icon={<GlassWater/>} label="グラスで気軽に" onClick={() => nextDiag('format', 'グラス')} /><ChatOption icon={<WineIcon/>} label="ボトルでゆったり" onClick={() => nextDiag('format', 'ボトル')} /></>}
                  {diag.step === 1 && <><ChatOption icon={<div className="w-4 h-4 rounded-full bg-red-700"/>} label="赤ワイン" onClick={() => nextDiag('color', '赤')} /><ChatOption icon={<div className="w-4 h-4 rounded-full bg-amber-100 border"/>} label="白ワイン" onClick={() => nextDiag('color', '白')} /><ChatOption icon={<div className="w-4 h-4 rounded-full bg-pink-300"/>} label="ロゼ / 泡" onClick={() => nextDiag('color', 'ロゼ・泡')} /></>}
                  {diag.step === 2 && (
                    <>
                      {diag.color === '赤' ? (
                        <><ChatOption icon={<Heart className="text-red-500"/>} label="凝縮感のある果実味（リッチ系）" onClick={() => nextDiag('style', '果実味豊かなリッチ系')} /><ChatOption icon={<Sparkles className="text-purple-600"/>} label="洗練されたエレガンス（綺麗め系）" onClick={() => nextDiag('style', '洗練されたエレガント系')} /></>
                      ) : (
                        <><ChatOption icon={<GlassWater className="text-blue-600"/>} label="キリッと爽快なドライ（辛口系）" onClick={() => nextDiag('style', 'ドライな辛口系')} /><ChatOption icon={<Heart className="text-amber-600"/>} label="芳醇でフルーティー（華やか系）" onClick={() => nextDiag('style', '華やかなフルーティー系')} /></>
                      )}
                    </>
                  )}
                  {diag.step === 3 && <><ChatOption icon={<Banknote className="text-green-700"/>} label="カジュアルに (〜4,000円)" onClick={() => nextDiag('budget', 'カジュアル')} /><ChatOption icon={<Banknote className="text-amber-700"/>} label="標準的に (4,000〜10,000円)" onClick={() => nextDiag('budget', '標準')} /><ChatOption icon={<Banknote className="text-purple-700"/>} label="贅沢に (10,000円以上)" onClick={() => nextDiag('budget', 'プレミアム')} /></>}
                  {diag.step === 4 && <><ChatOption icon={<Utensils/>} label="お肉料理に合わせて" onClick={() => nextDiag('scene', 'お肉料理')} /><ChatOption icon={<Utensils/>} label="お魚や前菜を華やかに" onClick={() => nextDiag('scene', 'お魚・前菜')} /><ChatOption icon={<Sparkles/>} label="今飲むべきイチオシを" onClick={() => nextDiag('scene', '旬のイチオシ')} /></>}
                </div>
              </div>
            ) : (
              history.map((h, i) => (
                <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-5 rounded-3xl ${h.role === 'user' ? 'bg-[#2f5d3a] text-white shadow-lg' : 'bg-white text-slate-900 border border-slate-200'}`}>
                    {h.role === 'assistant' ? renderMessageContent(h.content) : <p className="text-sm font-bold whitespace-pre-wrap">{h.content}</p>}
                  </div>
                </div>
              ))
            )}
            {isTyping && <div className="flex justify-start"><div className="bg-white p-4 rounded-full border shadow-sm"><Loader2 className="animate-spin text-[#2f5d3a]" size={20} /></div></div>}
            <div ref={chatEndRef} />
          </div>
          <div className="p-6 bg-white border-t border-slate-200 flex gap-2">
            <input type="text" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="メッセージを入力..." className="flex-1 bg-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-black outline-none border-2 border-transparent focus:border-[#2f5d3a]" />
            <button onClick={() => handleChat()} className="bg-[#2f5d3a] text-white p-4 rounded-2xl"><Send size={20}/></button>
          </div>
        </div>
      )}
    </main>
  );
}

function ChatOption({ icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-4 w-full p-6 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm shadow-sm hover:border-[#2f5d3a] transition-all active:scale-[0.98]">
      <div className="text-[#2f5d3a]">{icon}</div><span className="flex-1 text-left">{label}</span><ChevronRight size={16} className="text-slate-400" />
    </button>
  );
}

function FlavorDots({ label, val, color }: { label: string, val: string, color: string }) {
  const level = parseInt(val) || 0;
  return (
    <div className="space-y-1 flex-1">
      <span className="text-[8px] font-black uppercase text-slate-500 block">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((step) => <div key={step} className={`h-1 flex-1 rounded-full ${step <= level ? '' : 'bg-slate-200'}`} style={{ backgroundColor: step <= level ? color : undefined }} />)}
      </div>
    </div>
  );
}
