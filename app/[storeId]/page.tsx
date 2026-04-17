// app/[storeId]/page.tsx
"use client";
export const runtime = 'edge';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, MessageCircle, X, Send, Loader2, ChevronRight, Utensils, GlassWater } from 'lucide-react';

export default function StoreMenu() {
  const { storeId } = useParams();
  const [wines, setWines] = useState([]);
  const [config, setConfig] = useState({ menu_name: '' });
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
      const inStock = !w.stock || parseInt(w.stock) > 0;
      return matchColor && inStock;
    });
  }, [wines, filterColor]);

  // チャットを閉じて状態をリセットする関数
  const closeAndResetChat = () => {
    setChatOpen(false);
    setHistory([]);    // 履歴をリセット
    setMessage("");    // 入力文字をリセット
    setIsTyping(false); // タイピング状態をリセット
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
        <h1 className="text-2xl font-bold tracking-[0.2em] text-[#1a1a1a] uppercase mb-2">{config.menu_name || 'WINE SELECTION'}</h1>
        <div className="h-[2px] w-8 bg-[#2f5d3a] mx-auto"></div>
      </header>

      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-100 shadow-sm">
        <div className="max-w-xl mx-auto flex gap-2 overflow-x-auto no-scrollbar">
          {['ALL', '赤', '白', 'ロゼ', '泡'].map(c => (
            <button key={c} onClick={() => setFilterColor(c)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filterColor === c ? 'bg-[#2f5d3a] text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
              {c === 'ALL' ? 'Everything' : c}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 space-y-8 mt-8">
        {filteredWines.map((wine: any) => (
          <div key={wine.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
            <div className="relative aspect-[16/10] bg-slate-50">
              {wine.image && <img src={wine.image} className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-5 right-5 text-white">
                <p className="text-[10px] font-black uppercase opacity-80 mb-1">{wine.country} / {wine.vintage}</p>
                <div className="flex justify-between items-end">
                  <h2 className="text-lg font-bold">{wine.name_jp}</h2>
                  <p className="text-base font-black tracking-tighter">¥{Number(String(wine.price_bottle || 0).replace(/[^0-9]/g, '')).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap gap-2 text-[8px] font-black uppercase opacity-40">
                <span className="border px-2 py-0.5 rounded">{wine.type}</span>
                <span>{wine.region}</span>
                <span>{wine.grape}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 py-1">
                <FlavorDots label="Body" val={wine.body} color="#2f5d3a" />
                <FlavorDots label="Acidity" val={wine.acidity} color="#2f5d3a" />
                <FlavorDots label="Sweet" val={wine.sweetness} color="#2f5d3a" />
                <FlavorDots label={wine.color === '赤' ? 'Tannin' : 'Aroma'} val={wine.color === '赤' ? wine.tannin : wine.aroma} color={wine.color === '赤' ? '#8b0000' : '#2f5d3a'} />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border-l-4 border-[#2f5d3a]">{wine.advice}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
        <button onClick={() => setChatOpen(true)} className="pointer-events-auto bg-[#2f5d3a] text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 animate-bounce active:scale-95 transition-all">
          <Sparkles size={20} className="text-amber-400" />
          <span className="text-sm font-bold tracking-wider">AIソムリエに相談する</span>
        </button>
      </div>

      {chatOpen && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="flex justify-between items-center p-6 border-b bg-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2f5d3a] rounded-full flex items-center justify-center"><Sparkles size={16} className="text-amber-400" /></div>
              <h2 className="text-lg font-bold tracking-widest text-[#2f5d3a]">AI SOMMELIER</h2>
            </div>
            {/* 戻る（リセット）ボタン */}
            <button onClick={closeAndResetChat} className="text-slate-400 p-2 active:scale-90 transition-all"><X size={28}/></button>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8f9f8]">
            {history.length === 0 ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <p className="text-[#2f5d3a] font-bold text-lg mb-2">いらっしゃいませ。</p>
                  <p className="text-slate-600 text-sm leading-relaxed">どのようなワインをお探しですか？本日のおすすめや、お料理との相性をご案内いたします。</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <ChatOption icon={<Utensils size={16}/>} label="お料理に合わせて選びたい" onClick={() => handleChat("今日のご飯に合うワインを教えて")} />
                  <ChatOption icon={<GlassWater size={16}/>} label="今の気分で選びたい" onClick={() => handleChat("今の気分にぴったりのワインを提案して")} />
                  <ChatOption icon={<Sparkles size={16}/>} label="本日のイチオシを知りたい" onClick={() => handleChat("今日のおすすめの1本を教えて")} />
                </div>
              </div>
            ) : (
              history.map((h: any, i) => (
                <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl ${h.role === 'user' ? 'bg-[#2f5d3a] text-white' : 'bg-white text-slate-800 shadow-sm border border-slate-100'}`}>
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{h.content}</p>
                  </div>
                </div>
              ))
            )}
            {isTyping && <div className="flex justify-start"><div className="bg-white p-4 rounded-2xl border border-slate-100"><Loader2 className="animate-spin text-[#2f5d3a]" size={20} /></div></div>}
            <div ref={chatEndRef} />
          </div>

          <div className="p-6 bg-white border-t">
            <div className="relative max-w-xl mx-auto flex gap-2">
              <input type="text" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="メッセージを入力..." className="flex-1 bg-slate-100 rounded-2xl py-4 px-6 text-sm font-bold border-none outline-none focus:ring-2 ring-[#2f5d3a]/20" />
              <button onClick={() => handleChat()} className="bg-[#2f5d3a] text-white p-4 rounded-2xl active:scale-90 transition-all shadow-lg"><Send size={20}/></button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ChatOption({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-4 w-full p-5 bg-white border border-slate-100 rounded-2xl text-slate-700 font-bold text-sm active:scale-[0.98] shadow-sm">
      <div className="text-[#2f5d3a]">{icon}</div>
      <span className="flex-1 text-left">{label}</span>
      <ChevronRight size={16} className="opacity-30" />
    </button>
  );
}

function FlavorDots({ label, val, color }: { label: string, val: string, color: string }) {
  const level = parseInt(val) || 3;
  return (
    <div className="space-y-1.5 flex-1">
      <span className="text-[8px] font-black uppercase tracking-tighter opacity-30 block">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className={`h-1 flex-1 rounded-full ${step <= level ? '' : 'bg-slate-100'}`} style={{ backgroundColor: step <= level ? color : undefined }}></div>
        ))}
      </div>
    </div>
  );
}
