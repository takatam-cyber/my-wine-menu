// app/[storeId]/page.tsx
"use client";
export const runtime = 'edge';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, X, Send, Loader2, ChevronRight, Utensils, GlassWater, Tag, RotateCcw } from 'lucide-react';

export default function StoreMenu() {
  const { storeId } = useParams();
  const [wines, setWines] = useState([]);
  const [config, setConfig] = useState({ menu_name: '' });
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 診断用ステート (0: 色選択, 1: スタイル選択, 2: シーン選択)
  const [diag, setDiag] = useState({ step: 0, color: '', style: '', food: '' });
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

  // 表示フィルタ（不具合修正版）
  const filteredWines = useMemo(() => {
    return wines.filter((w: any) => {
      const matchColor = filterColor === 'ALL' || w.color === filterColor;
      // 改行コードや空白を除去して判定
      const isVisible = String(w.visible || 'ON').trim().toUpperCase() === 'ON';
      const stockNum = parseInt(String(w.stock || '1').trim());
      const inStock = isNaN(stockNum) || stockNum > 0;
      return matchColor && isVisible && inStock;
    });
  }, [wines, filterColor]);

  const closeAndResetChat = () => {
    setChatOpen(false);
    setHistory([]);
    setMessage("");
    setIsTyping(false);
    setDiag({ step: 0, color: '', style: '', food: '' });
  };

  const nextDiag = (key: string, val: string) => {
    const next = { ...diag, [key]: val, step: diag.step + 1 };
    setDiag(next);
    // 最終ステップ完了時にAIへ送信
    if (next.step === 3) {
      const finalMsg = `${next.color}のワインで、味わいは${next.style}なもの。今日は${next.food}なので、リストから最適な1本を選んでエレガントに提案してください。`;
      handleChat(finalMsg);
    }
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
    } catch (e) {
      setHistory(prev => [...prev, { role: 'assistant', content: "申し訳ありません。少々お時間を置いてから再度お試しください。" }]);
    } finally { setIsTyping(false); }
  };

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans pb-32">
      <header className="py-12 px-8 text-center bg-white border-b border-slate-100">
        <h1 className="text-2xl font-bold tracking-[0.2em] text-[#1a1a1a] uppercase mb-2">
          {config.menu_name || 'WINE SELECTION'}
        </h1>
        <div className="h-[2px] w-8 bg-[#2f5d3a] mx-auto"></div>
      </header>

      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-100 shadow-sm">
        <div className="max-w-xl mx-auto flex gap-2 overflow-x-auto no-scrollbar">
          {['ALL', '赤', '白', 'ロゼ', '泡'].map(c => (
            <button 
              key={c} 
              onClick={() => setFilterColor(c)} 
              className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filterColor === c ? 'bg-[#2f5d3a] text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}
            >
              {c === 'ALL' ? 'Everything' : c}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 space-y-10 mt-8">
        {filteredWines.map((wine: any) => (
          <div key={wine.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100">
            <div className="relative aspect-[16/10] bg-slate-50">
              {wine.image && <img src={wine.image} className="w-full h-full object-cover" alt={wine.name_jp} />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-5 left-6 right-6 text-white">
                <p className="text-[10px] font-black uppercase opacity-80 mb-1">
                  {wine.country} {wine.vintage && `/ ${wine.vintage}`}
                </p>
                <div className="flex justify-between items-end">
                  <h2 className="text-xl font-bold leading-tight">{wine.name_jp}</h2>
                  <p className="text-lg font-black tracking-tighter">¥{Number(wine.price_bottle).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase text-slate-400">
                <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">{wine.type}</span>
                <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">{wine.region}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 py-2 border-y border-slate-50">
                <FlavorDots label="Body" val={wine.body} color="#2f5d3a" />
                <FlavorDots label="Acidity" val={wine.acidity} color="#2f5d3a" />
                <FlavorDots label="Sweetness" val={wine.sweetness} color="#2f5d3a" />
                <FlavorDots label={wine.color === '赤' ? 'Tannin' : 'Aroma'} val={wine.color === '赤' ? wine.tannin : wine.aroma_intensity} color={wine.color === '赤' ? '#8b0000' : '#2f5d3a'} />
              </div>
              <p className="text-sm text-slate-800 font-bold italic">「{wine.menu_short}」</p>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
        <button onClick={() => setChatOpen(true)} className="pointer-events-auto bg-[#2f5d3a] text-white px-8 py-5 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
          <Sparkles size={20} className="text-amber-400" />
          <span className="text-sm font-black tracking-widest uppercase">Consult AI Sommelier</span>
        </button>
      </div>

      {chatOpen && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="flex justify-between items-center p-6 border-b bg-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2f5d3a] rounded-full flex items-center justify-center"><Sparkles size={16} className="text-amber-400" /></div>
              <h2 className="text-lg font-bold tracking-widest text-[#2f5d3a] uppercase">AI Sommelier</h2>
            </div>
            <button onClick={closeAndResetChat} className="text-slate-400 p-2"><X size={28}/></button>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8f9f8]">
            {history.length === 0 ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                  <p className="text-[#2f5d3a] font-black text-xl mb-2">ワイン診断</p>
                  <p className="text-slate-600 text-sm font-medium leading-relaxed">
                    {diag.step === 0 && "いらっしゃいませ。まずは、ご希望の「色」をお選びください。"}
                    {diag.step === 1 && "どのような口当たりがお好みですか？"}
                    {diag.step === 2 && "本日の気分やお料理は？"}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {diag.step === 0 && (
                    <>
                      <ChatOption icon={<div className="w-4 h-4 rounded-full bg-red-700"/>} label="赤ワイン" onClick={() => nextDiag('color', '赤')} />
                      <ChatOption icon={<div className="w-4 h-4 rounded-full bg-amber-100 border"/>} label="白ワイン" onClick={() => nextDiag('color', '白')} />
                      <ChatOption icon={<div className="w-4 h-4 rounded-full bg-pink-300"/>} label="ロゼ / 泡" onClick={() => nextDiag('color', 'ロゼまたは泡')} />
                      <ChatOption icon={<Sparkles size={16}/>} label="ソムリエにおまかせ" onClick={() => handleChat("今日のおすすめの1本を教えて")} />
                    </>
                  )}

                  {diag.step === 1 && (
                    <>
                      {diag.color === '赤' ? (
                        <>
                          <ChatOption icon={<ChevronRight size={16}/>} label="軽やかでフルーティー" onClick={() => nextDiag('style', '軽やかでフルーティー')} />
                          <ChatOption icon={<ChevronRight size={16}/>} label="重厚でパワフル" onClick={() => nextDiag('style', '重厚でパワフル')} />
                        </>
                      ) : (
                        <>
                          <ChatOption icon={<ChevronRight size={16}/>} label="スッキリ辛口" onClick={() => nextDiag('style', 'スッキリ辛口')} />
                          <ChatOption icon={<ChevronRight size={16}/>} label="芳醇でリッチ" onClick={() => nextDiag('style', '芳醇でリッチ')} />
                        </>
                      )}
                      <button onClick={() => setDiag({...diag, step: 0})} className="text-xs font-bold text-slate-400 mt-2 flex items-center justify-center gap-1"><RotateCcw size={12}/> 最初からやり直す</button>
                    </>
                  )}

                  {diag.step === 2 && (
                    <>
                      <ChatOption icon={<Utensils size={16}/>} label="お肉料理と一緒に" onClick={() => nextDiag('food', 'お肉料理')} />
                      <ChatOption icon={<GlassWater size={16}/>} label="お魚や軽いおつまみと" onClick={() => nextDiag('food', 'お魚や軽いおつまみ')} />
                      <ChatOption icon={<Sparkles size={16}/>} label="ワインだけでゆっくり楽しむ" onClick={() => nextDiag('food', 'ワイン単体')} />
                      <button onClick={() => setDiag({...diag, step: 1})} className="text-xs font-bold text-slate-400 mt-2 text-center">スタイルを選び直す</button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              history.map((h: any, i) => (
                <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-5 rounded-2xl ${h.role === 'user' ? 'bg-[#2f5d3a] text-white' : 'bg-white text-slate-800 border'}`}>
                    <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{h.content}</p>
                  </div>
                </div>
              ))
            )}
            {isTyping && <div className="flex justify-start"><div className="bg-white p-4 rounded-2xl border"><Loader2 className="animate-spin text-[#2f5d3a]" size={20} /></div></div>}
            <div ref={chatEndRef} />
          </div>

          <div className="p-6 bg-white border-t">
            <div className="relative max-w-xl mx-auto flex gap-2">
              <input type="text" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="メッセージを入力..." className="flex-1 bg-slate-100 rounded-2xl py-4 px-6 text-sm font-bold border-none outline-none" />
              <button onClick={() => handleChat()} className="bg-[#2f5d3a] text-white p-4 rounded-2xl"><Send size={20}/></button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ChatOption({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-4 w-full p-6 bg-white border border-slate-100 rounded-2xl text-slate-700 font-bold text-sm active:scale-[0.98] shadow-sm">
      <div className="text-[#2f5d3a]">{icon}</div>
      <span className="flex-1 text-left">{label}</span>
      <ChevronRight size={16} className="opacity-30" />
    </button>
  );
}

function FlavorDots({ label, val, color }: { label: string, val: string, color: string }) {
  const level = parseInt(val) || 0;
  return (
    <div className="space-y-1.5 flex-1">
      <span className="text-[8px] font-black uppercase tracking-widest opacity-30 block">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className={`h-1 flex-1 rounded-full ${step <= level ? '' : 'bg-slate-100'}`} style={{ backgroundColor: step <= level ? color : undefined }}></div>
        ))}
      </div>
    </div>
  );
}
