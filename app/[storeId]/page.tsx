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
      return matchColor && isVisible;
    });
  }, [wines, filterColor]);

  const minimizeChat = () => setChatOpen(false);
  const resetChat = () => { setHistory([]); setDiag({ step: 0, format: '', color: '', style: '', budget: '', scene: '' }); setMessage(""); };

  const nextDiag = (key: string, val: string) => {
    const next = { ...diag, [key]: val, step: diag.step + 1 };
    setDiag(next);
    if (next.step === 5) {
      handleChat(`【診断完了】飲み方:${next.format}, 種類:${next.color}, スタイル:${next.style}, 予算:${next.budget}, 場面:${next.scene}。これに合う最高の1本を教えてください。必ずIDの付記をお願いします。`);
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
      setHistory(prev => [...prev, { role: 'assistant', content: "接続エラーが発生しました。" }]);
    } finally { setIsTyping(false); }
  };

  const renderMessageContent = (content: string) => {
    const idMatches = Array.from(content.matchAll(/【ID:(\d+)】/g));
    const textWithoutIds = content.replace(/【ID:\d+】/g, '').trim();
    const suggestedWines = idMatches.map(match => wines.find((w: any) => w.id === match[1])).filter(w => w);

    return (
      <div className="space-y-4">
        <p className="text-base font-bold leading-relaxed text-black whitespace-pre-wrap">{textWithoutIds}</p>
        {suggestedWines.map((wine: any) => (
          <button 
            key={wine.id}
            onClick={() => {
              const el = document.getElementById(`wine-${wine.id}`);
              if (el) { minimizeChat(); setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300); }
            }}
            className="w-full text-left bg-white rounded-3xl border-2 border-amber-400 shadow-xl p-4 flex gap-4 animate-in zoom-in-95 active:scale-95"
          >
            <img src={wine.image} className="w-20 h-24 object-cover rounded-xl shadow-md" alt="" />
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-[10px] font-black text-[#2f5d3a] uppercase tracking-tighter mb-1">{wine.color} / {wine.type}</p>
              <p className="text-sm font-black text-black leading-tight mb-2">{wine.name_jp}</p>
              <div className="flex justify-between items-center">
                <p className="text-base font-black text-amber-700">¥{Number(wine.price_bottle).toLocaleString()}</p>
                <span className="text-[10px] font-black text-white bg-black px-4 py-1.5 rounded-full flex items-center gap-1 shadow-md">詳細 <ChevronRight size={12}/></span>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#FDFCFB] pb-40">
      {/* 判別しやすいヘッダー */}
      <header className="py-16 px-8 text-center bg-white border-b-2 border-slate-100">
        <h1 className="text-3xl font-black tracking-[0.25em] uppercase text-black italic">{config.menu_name || 'SELECT SELECTION'}</h1>
        <div className="h-1 w-12 bg-black mx-auto mt-4 rounded-full"></div>
      </header>

      {/* 視認性の高いフィルタ */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-6 py-5 border-b-2 border-slate-100 flex gap-3 overflow-x-auto no-scrollbar shadow-sm">
        {['ALL', '赤', '白', 'ロゼ', '泡'].map(c => (
          <button key={c} onClick={() => setFilterColor(c)} className={`px-7 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${filterColor === c ? 'bg-black text-white shadow-xl scale-105' : 'bg-white text-black border-2 border-slate-200 hover:border-black'}`}>{c}</button>
        ))}
      </div>

      {/* winelyを超えるカードデザイン */}
      <div className="max-w-2xl mx-auto px-6 space-y-12 mt-10">
        {filteredWines.map((wine: any) => (
          <div key={wine.id} id={`wine-${wine.id}`} className="bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100 transition-all duration-500">
            <div className="relative aspect-[4/3]">
              {wine.image && <img src={wine.image} className="w-full h-full object-cover" alt="" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <p className="text-[11px] font-black uppercase tracking-widest text-amber-400 mb-2">{wine.country} {wine.vintage && `/ ${wine.vintage}`}</p>
                <div className="flex justify-between items-end"><h2 className="text-2xl font-black leading-tight flex-1 pr-4">{wine.name_jp}</h2><p className="text-2xl font-black tracking-tighter text-amber-400">¥{Number(wine.price_bottle).toLocaleString()}</p></div>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-x-12 gap-y-6 border-y-2 border-slate-50 py-6">
                <FlavorDots label="Body" val={wine.body} color="#000000" />
                <FlavorDots label="Acidity" val={wine.acidity} color="#000000" />
                <FlavorDots label="Sweetness" val={wine.sweetness} color="#000000" />
                <FlavorDots label={wine.color === '赤' ? 'Tannin' : 'Aroma'} val={wine.color === '赤' ? wine.tannin : wine.aroma_intensity} color="#000000" />
              </div>
              <p className="text-base text-black font-black italic leading-relaxed bg-slate-50 p-6 rounded-3xl border-l-8 border-black">「{wine.menu_short}」</p>
              {wine.pairing && <div className="flex items-center gap-3 text-white bg-black px-6 py-4 rounded-2xl text-xs font-black shadow-lg"><Utensils size={18} className="text-amber-400"/> Best Pairing: {wine.pairing}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* フローティングAIコンシェルジュ */}
      <div className="fixed bottom-10 left-0 right-0 flex justify-center z-50 pointer-events-none">
        <button onClick={() => setChatOpen(true)} className="pointer-events-auto bg-black text-white px-10 py-6 rounded-full shadow-2xl flex items-center gap-4 animate-bounce border-2 border-amber-500"><Sparkles size={24} className="text-amber-400" /><span className="text-sm font-black tracking-[0.2em] uppercase">Open Concierge</span></button>
      </div>

      {/* 文字をはっきりさせたチャットモーダル */}
      {chatOpen && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="flex justify-between items-center p-7 border-b-2 border-slate-100 bg-white">
            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-amber-400"><Sparkles size={20} /></div><h2 className="text-xl font-black tracking-widest uppercase text-black">Master Sommelier</h2></div>
            <div className="flex items-center gap-5">
              {history.length > 0 && <button onClick={resetChat} className="text-[11px] font-black text-black flex items-center gap-1 uppercase bg-slate-100 px-4 py-2 rounded-full"><RotateCcw size={14}/> Reset</button>}
              <button onClick={minimizeChat} className="text-black p-2 hover:bg-slate-100 rounded-full"><X size={32}/></button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50">
            {history.length === 0 ? (
              <div className="space-y-8 max-w-lg mx-auto">
                <div className="bg-black text-white p-10 rounded-[3rem] shadow-2xl border-2 border-amber-500"><p className="text-2xl font-black mb-4 tracking-tighter italic">Wine Selection</p><p className="text-slate-100 text-base font-bold leading-relaxed">{diag.step === 0 ? "今夜はどのように楽しまれますか？" : diag.step === 1 ? "ご希望の色を教えてください。" : diag.step === 2 ? "味わいの方向性はいかがでしょう？" : diag.step === 3 ? "ご予算の目安をお聞かせください。" : "最後にお料理やシーンを教えてください。"}</p></div>
                <div className="grid grid-cols-1 gap-4">
                  {diag.step === 0 && <><ChatOption icon={<GlassWater size={24}/>} label="グラスで気軽に" onClick={() => nextDiag('format', 'グラス')} /><ChatOption icon={<WineIcon size={24}/>} label="ボトルでゆったり" onClick={() => nextDiag('format', 'ボトル')} /></>}
                  {diag.step === 1 && <><ChatOption icon={<div className="w-6 h-6 rounded-full bg-red-700 shadow-md"/>} label="赤ワイン" onClick={() => nextDiag('color', '赤')} /><ChatOption icon={<div className="w-6 h-6 rounded-full bg-amber-100 border-2 shadow-md"/>} label="白ワイン" onClick={() => nextDiag('color', '白')} /><ChatOption icon={<div className="w-6 h-6 rounded-full bg-pink-300 shadow-md"/>} label="ロゼ / 泡" onClick={() => nextDiag('color', 'ロゼ・泡')} /></>}
                  {diag.step === 2 && (
                    <>{diag.color === '赤' ? (
                        <><ChatOption icon={<Heart className="text-red-600"/>} label="果実味のリッチな凝縮感" onClick={() => nextDiag('style', '果実味豊かなリッチ系')} /><ChatOption icon={<Sparkles className="text-purple-600"/>} label="洗練されたエレガンス" onClick={() => nextDiag('style', '洗練されたエレガント系')} /></>
                      ) : (
                        <><ChatOption icon={<GlassWater className="text-blue-600"/>} label="キリッと爽快なドライ" onClick={() => nextDiag('style', 'ドライな辛口系')} /><ChatOption icon={<Heart className="text-amber-600"/>} label="芳醇でフルーティー" onClick={() => nextDiag('style', '華やかなフルーティー系')} /></>
                      )}</>
                  )}
                  {diag.step === 3 && <><ChatOption icon={<Banknote size={24} className="text-green-700"/>} label="カジュアルに (〜4,000円)" onClick={() => nextDiag('budget', 'カジュアル')} /><ChatOption icon={<Banknote size={24} className="text-amber-700"/>} label="標準的に (4,000〜10,000円)" onClick={() => nextDiag('budget', '標準')} /><ChatOption icon={<Banknote size={24} className="text-purple-700"/>} label="贅沢に (10,000円以上)" onClick={() => nextDiag('budget', 'プレミアム')} /></>}
                  {diag.step === 4 && <><ChatOption icon={<Utensils/>} label="お肉料理に合わせて" onClick={() => nextDiag('scene', 'お肉料理')} /><ChatOption icon={<Utensils/>} label="お魚や前菜を華やかに" onClick={() => nextDiag('scene', 'お魚・前菜')} /><ChatOption icon={<Sparkles/>} label="今、ソムリエのおすすめを" onClick={() => nextDiag('scene', '旬のイチオシ')} /></>}
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
            {isTyping && <div className="flex justify-start"><div className="bg-white p-5 rounded-full border shadow-md"><Loader2 className="animate-spin text-black" size={24} /></div></div>}
            <div ref={chatEndRef} />
          </div>

          {/* 入力時の文字を絶対に読みやすくした入力エリア */}
          <div className="p-8 bg-white border-t-2 border-slate-100 flex gap-4">
            <input type="text" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="追加の要望をどうぞ..." className="flex-1 bg-slate-100 rounded-[1.5rem] py-5 px-8 text-lg font-black text-black border-2 border-transparent focus:border-black outline-none placeholder:text-slate-400" />
            <button onClick={() => handleChat()} className="bg-black text-white p-5 rounded-2xl shadow-xl active:scale-90 transition-all border-2 border-amber-500"><Send size={24}/></button>
          </div>
        </div>
      )}
    </main>
  );
}

function ChatOption({ icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-5 w-full p-7 bg-white border-2 border-slate-100 rounded-[2rem] text-black font-black text-sm shadow-sm hover:border-black hover:bg-slate-50 transition-all active:scale-[0.98]">
      <div className="text-black">{icon}</div><span className="flex-1 text-left uppercase tracking-widest leading-none">{label}</span><ChevronRight size={24} className="text-slate-300" />
    </button>
  );
}

function FlavorDots({ label, val, color }: { label: string, val: string, color: string }) {
  const level = parseInt(val) || 0;
  return (
    <div className="space-y-2 flex-1">
      <span className="text-[10px] font-black uppercase text-black tracking-wider block">{label}</span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className={`h-2 flex-1 rounded-full ${step <= level ? '' : 'bg-slate-200'}`} style={{ backgroundColor: step <= level ? color : undefined }} />
        ))}
      </div>
    </div>
  );
}
