// app/[slug]/page.tsx
"use client";
export const runtime = 'edge';
import { useState, useEffect, use } from 'react';
import { Sparkles, X, Send, Loader2, Wine } from 'lucide-react';

// 味覚を視覚化する簡易レーダーチャートコンポーネント
function FlavorRadar({ data }: { data: { sweetness: number, body: number, acidity: number, tannins: number } }) {
  const size = 80;
  const center = size / 2;
  const scale = (val: number) => (val / 5) * (size / 2.5);

  // 四角形の座標計算
  const points = [
    `${center},${center - scale(data.body)}`,      // 上: Body
    `${center + scale(data.sweetness)},${center}`, // 右: Sweet
    `${center},${center + scale(data.tannins)}`,   // 下: Tannin
    `${center - scale(data.acidity)},${center}`,   // 左: Acid
  ].join(' ');

  return (
    <div className="relative w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
      <svg width={size} height={size} className="transform rotate-45">
        {/* 背景グリッド */}
        <circle cx={center} cy={center} r={size/2.5} fill="none" stroke="white" strokeOpacity="0.1" strokeWidth="0.5" />
        <line x1={0} y1={center} x2={size} y2={center} stroke="white" strokeOpacity="0.1" />
        <line x1={center} y1={0} x2={center} y2={size} stroke="white" strokeOpacity="0.1" />
        {/* フレーバーポリゴン */}
        <polygon points={points} fill="rgba(245, 158, 11, 0.6)" stroke="#f59e0b" strokeWidth="1" />
      </svg>
      <div className="absolute inset-0 flex flex-col justify-between p-0.5 text-[6px] font-black text-amber-500/50 uppercase pointer-events-none">
        <span className="text-center">Body</span>
        <div className="flex justify-between px-0.5"><span>Acid</span><span>Sweet</span></div>
        <span className="text-center">Tan</span>
      </div>
    </div>
  );
}

export default function PublicMenu({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [wines, setWines] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    fetch(`/api/wines?slug=${slug}`).then(res => res.json()).then(setWines);
    fetch(`/api/store/config/public?slug=${slug}`).then(res => res.json()).then(setConfig);
  }, [slug]);

  const handleSend = async () => {
    if (!chatMsg.trim()) return;
    const newHistory = [...history, { role: 'user', content: chatMsg }];
    setHistory(newHistory);
    setChatMsg("");
    setIsTyping(true);

    const res = await fetch('/api/sommelier', {
      method: 'POST',
      body: JSON.stringify({ 
        message: chatMsg, 
        history: newHistory, 
        wineList: wines,
        storeName: config?.store_name 
      }),
    });
    const data = await res.json();
    setHistory([...newHistory, { role: 'assistant', content: data.response }]);
    setIsTyping(false);
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans selection:bg-amber-900 overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_center,#1a1a1a_0%,#050505_100%)] opacity-70 pointer-events-none" />
      
      {/* Header */}
      <header className="relative text-center py-24 border-b border-white/5 px-6">
        <div className="inline-block p-3 bg-amber-500/10 rounded-2xl mb-6 border border-amber-500/20">
          <Wine className="text-amber-500" size={32} />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif italic tracking-[0.2em] text-amber-50/90 uppercase">{config?.store_name || 'LOADING...'}</h1>
        <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto mt-8" />
      </header>

      {/* Wine List */}
      <div className="relative max-w-2xl mx-auto space-y-20 py-20 px-6">
        {wines.map(wine => (
          <div key={wine.id} className={`group transition-all duration-1000 ${wine.is_priority ? 'scale-105' : 'opacity-80'}`}>
            <div className="flex flex-col md:flex-row gap-10 items-start md:items-center">
              {/* Bottle Image & Visualizer */}
              <div className="relative shrink-0 mx-auto md:mx-0">
                <img 
                  src={wine.image_url} 
                  className={`w-32 h-48 object-contain transition-all duration-700 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] ${wine.is_priority ? 'scale-110' : 'grayscale-[0.3]'}`} 
                  alt={wine.name_jp} 
                />
                {wine.is_priority === 1 && (
                   <div className="absolute -top-4 -left-4 bg-amber-600 text-[10px] font-black px-3 py-1.5 rounded-full tracking-widest uppercase shadow-2xl animate-pulse">Sommelier's Pick</div>
                )}
                <div className="absolute -bottom-6 -right-6">
                   <FlavorRadar data={{ sweetness: wine.sweetness, body: wine.body, acidity: wine.acidity, tannins: wine.tannins }} />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 space-y-4 text-center md:text-left">
                <p className="text-amber-600 text-xs font-black tracking-[0.3em] uppercase">{wine.country} / {wine.region}</p>
                <h2 className="text-3xl font-serif tracking-tight leading-tight">{wine.name_jp}</h2>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {wine.grape?.split(',').map((g: string) => (
                    <span key={g} className="text-[10px] border border-white/10 px-2 py-1 rounded text-white/40 uppercase">{g.trim()}</span>
                  ))}
                </div>
                <p className="text-2xl font-light text-amber-200/90 italic tracking-tighter">
                  ¥{Number(wine.price_bottle).toLocaleString()} <span className="text-xs text-white/30 not-italic ml-2">/ Bottle</span>
                </p>
                {wine.ai_explanation && (
                  <p className="text-xs text-white/50 leading-relaxed italic border-l border-amber-500/30 pl-4 py-1">{wine.ai_explanation}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Sommelier Button */}
      <button 
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-12 left-1/2 -translate-x-1/2 px-10 py-6 bg-amber-700 hover:bg-amber-600 text-white rounded-full flex items-center gap-4 shadow-[0_20px_60px_rgba(180,83,9,0.5)] transition-all active:scale-95 group z-40"
      >
        <Sparkles size={24} className="text-amber-200 animate-pulse" />
        <span className="text-sm font-black tracking-[0.2em] uppercase">AI Sommelier Consulting</span>
      </button>

      {/* Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/90 backdrop-blur-md p-0 md:p-6">
          <div className="bg-[#0d0d0d] w-full max-w-lg h-[90vh] md:h-[600px] md:rounded-[3rem] border-t md:border border-white/10 flex flex-col shadow-2xl relative overflow-hidden">
            <button onClick={() => setIsChatOpen(false)} className="absolute top-6 right-6 text-white/30 hover:text-white z-10"><X size={32}/></button>
            
            <div className="p-8 border-b border-white/5">
              <h3 className="text-xl font-serif italic text-amber-500">Sommelier Consultation</h3>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">プロンプトにより最適化された提案</p>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
              {history.length === 0 && (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto"><Wine className="text-amber-500/20" size={32}/></div>
                  <p className="text-sm text-white/40 italic">「今日のおすすめは？」「肉料理に合うワインは？」<br/>など、お気軽にお尋ねください。</p>
                </div>
              )}
              {history.map((h, i) => (
                <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-5 rounded-2xl text-sm leading-relaxed ${h.role === 'user' ? 'bg-amber-700 text-white font-bold' : 'bg-white/5 text-amber-50/90 border border-white/5'}`}>
                    {h.content}
                  </div>
                </div>
              ))}
              {isTyping && <div className="flex justify-start"><div className="bg-white/5 p-4 rounded-2xl"><Loader2 className="animate-spin text-amber-500" size={20}/></div></div>}
            </div>

            <div className="p-6 bg-white/5 border-t border-white/5">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="メッセージを入力..." 
                  className="w-full bg-black/50 border border-white/10 rounded-2xl py-5 pl-6 pr-16 outline-none focus:border-amber-500 transition-all font-bold"
                  value={chatMsg}
                  onChange={e => setChatMsg(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 hover:text-amber-400 p-2"><Send size={24}/></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
