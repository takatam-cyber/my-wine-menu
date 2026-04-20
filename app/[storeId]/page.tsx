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
      handleChat(`【診断結果】飲み方:${next.format} / 予算:${next.budget} / 色:${next.color} / 味わい:${next.style} / シーン:${next.scene}。この気分に寄り添う、プロの言葉での提案を。IDの付記を忘れずに。`);
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
      setHistory(prev => [...prev, { role: 'assistant', content: "接続を確認してください。" }]);
    } finally { setIsTyping(false); }
  };

  const renderMessageContent = (content: string) => {
    const idMatches = Array.from(content.matchAll(/【ID:(\d+)】/g));
    const textWithoutIds = content.replace(/【ID:\d+】/g, '').trim();
    const suggestedWines = idMatches.map(match => wines.find((w: any) => w.id === match[1])).filter(w => w);

    return (
      <div className="space-y-6">
        <p className="text-base font-black leading-relaxed text-black whitespace-pre-wrap">{textWithoutIds}</p>
        {suggestedWines.map((wine: any) => (
          <button 
            key={wine.id}
            onClick={() => {
              const el = document.getElementById(`wine-${wine.id}`);
              if (el) { minimizeChat(); setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300); }
            }}
            className="w-full text-left bg-white rounded-[2rem] border-4 border-amber-400 shadow-2xl p-5 flex gap-5 animate-in zoom-in-95 active:scale-95 transition-all"
          >
            <img src={wine.image} className="w-24 h-32 object-cover rounded-2xl shadow-lg border border-slate-100" alt="" />
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-[10px] font-black text-[#2f5d3a] uppercase tracking-tighter mb-2">{wine.color} / {wine.type}</p>
              <p className="text-lg font-black text-black leading-tight mb-3">{wine.name_jp}</p>
              <div className="flex justify-between items-center">
                <p className="text-lg font-black text-amber-700">¥{Number(wine.price_bottle).toLocaleString()}</p>
                <span className="text-[11px] font-black text-white bg-black px-4 py-2 rounded-full shadow-lg">詳細へ <ChevronRight size={14} className="inline ml-1"/></span>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-white pb-40">
      {/* 視認性最大化ヘッダー */}
      <header className="py-20 px-8 text-center bg-white border-b-4 border-slate-100">
        <h1 className="text-4xl font-black tracking-tighter uppercase text-black italic">{config.menu_name || 'SELECT SELECTION'}</h1>
        <div className="h-1.5 w-16 bg-black mx-auto mt-6 rounded-full shadow-sm"></div>
      </header>

      {/* 漆黒のフィルタボタン */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl px-6 py-6 border-b-4 border-slate-100 flex gap-4 overflow-x-auto no-scrollbar shadow-md">
        {['ALL', '赤', '白', 'ロゼ', '泡'].map(c => (
          <button key={c} onClick={() => setFilterColor(c)} className={`px-8 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${filterColor === c ? 'bg-black text-white shadow-2xl scale-110' : 'bg-slate-100 text-black border-2 border-slate-200'}`}>{c}</button>
        ))}
      </div>

      {/* 圧倒的な存在感のワインカード */}
      <div className="max-w-2xl mx-auto px-6 space-y-16 mt-12">
        {filteredWines.map((wine: any) => (
          <div key={wine.id} id={`wine-${wine.id}`} className="bg-white rounded-[3.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border-2 border-slate-100 transition-all">
            <div className="relative aspect-[4/3]">
              {wine.image && <img src={wine.image} className="w-full h-full object-cover" alt="" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-95"></div>
              <div className="absolute bottom-10 left-10 right-10 text-white">
                <p className="text-[12px] font-black uppercase tracking-[0.2em] text-amber-400 mb-3">{wine.country} {wine.vintage && `/ ${wine.vintage}`}</p>
                <div className="flex justify-between items-end"><h2 className="text-3xl font-black leading-none flex-1 pr-6">{wine.name_jp}</h2><p className="text-3xl font-black tracking-tighter text-amber-400">¥{Number(wine.price_bottle).toLocaleString()}</p></div>
              </div>
            </div>
            <div className="p-10 space-y-8 text-left">
              <div className="grid grid-cols-2 gap-x-16 gap-y-8 border-y-2 border-slate-100 py-10">
                <FlavorDots label="Body" val={wine.body} color="#000" />
                <FlavorDots label="Acidity" val={wine.acidity} color="#000" />
                <FlavorDots label="Sweetness" val={wine.sweetness} color="#000" />
                <FlavorDots label={wine.color === '赤' ? 'Tannin' : 'Aroma'} val={wine.color === '赤' ? wine.tannin : wine.aroma_intensity} color="#000" />
              </div>
              <p className="text-lg text-black font-black italic leading-relaxed bg-slate-50 p-8 rounded-[2.5rem] border-l-[12px] border-black shadow-inner">「{wine.menu_short}」</p>
              {wine.pairing && <div className="flex items-center gap-4 bg-black text-white px-8 py-5 rounded-3xl text-sm font-black shadow-xl"><Utensils size={24} className="text-amber-400"/> Best Pairing: {wine.pairing}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* 黄金のAIボタン */}
      <div className="fixed bottom-10 left-0 right-0 flex justify-center z-50 pointer-events-none">
        <button onClick={() => setChatOpen(true)} className="pointer-events-auto bg-black text-white px-12 py-7 rounded-full shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] flex items-center gap-5 animate-bounce border-2 border-amber-500"><Sparkles size={28} className="text-amber-400" /><span className="text-base font-black tracking-[0.25em] uppercase">Consult Sommelier</span></button>
      </div>

      {/* 高コントラスト・チャットモーダル */}
      {chatOpen && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-bottom duration-500">
          <header className="flex justify-between items-center p-8 border-b-4 border-black bg-white shadow-sm">
            <div className="flex items-center gap-4"><div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-amber-400 shadow-2xl"><Sparkles size={24} /></div><h2 className="text-2xl font-black text-black tracking-widest uppercase">Master Sommelier</h2></div>
            <div className="flex items-center gap-6">
              {history.length > 0 && <button onClick={resetChat} className="text-[12px] font-black text-black bg-slate-100 px-5 py-2.5 rounded-full uppercase transition-all hover:bg-slate-200 shadow-sm"><RotateCcw size={16}/> Reset</button>}
              <button onClick={minimizeChat} className="text-black p-3 hover:bg-slate-100 rounded-full transition-all"><X size={36}/></button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-slate-50">
            {history.length === 0 ? (
              <div className="space-y-10 max-w-xl mx-auto">
                <div className="bg-black text-white p-12 rounded-[3.5rem] border-4 border-amber-500 shadow-2xl text-left"><p className="text-3xl font-black mb-6 italic text-amber-400">Concierge</p><p className="text-slate-100 text-xl font-bold leading-relaxed">{diag.step === 0 ? "今夜はどのようなスタイルで楽しまれますか？" : diag.step === 1 ? "ご希望の色を教えてください。" : diag.step === 2 ? "味わいの方向性はいかがでしょう？" : diag.step === 3 ? "ご予算の目安をお聞かせください。" : "最後にお料理やシーンを教えてください。"}</p></div>
                <div className="grid grid-cols-1 gap-5">
                  {diag.step === 0 && <><ChatOption icon={<GlassWater size={32}/>} label="グラスで気軽に" onClick={() => nextDiag('format', 'グラス')} /><ChatOption icon={<WineIcon size={32}/>} label="ボトルでゆったり" onClick={() => nextDiag('format', 'ボトル')} /></>}
                  {diag.step === 1 && <><ChatOption icon={<div className="w-8 h-8 rounded-full bg-red-800 shadow-xl"/>} label="赤ワイン" onClick={() => nextDiag('color', '赤')} /><ChatOption icon={<div className="w-8 h-8 rounded-full bg-amber-100 border-4 shadow-xl"/>} label="白ワイン" onClick={() => nextDiag('color', '白')} /><ChatOption icon={<div className="w-8 h-8 rounded-full bg-pink-300 shadow-xl"/>} label="ロゼ / 泡" onClick={() => nextDiag('color', 'ロゼ・泡')} /></>}
                  {diag.step === 2 && (
                    <>{diag.color === '赤' ? (
                        <><ChatOption icon={<Heart className="text-red-600"/>} label="果実味のリッチな凝縮感" onClick={() => nextDiag('style', '果実味豊かなリッチ系')} /><ChatOption icon={<Sparkles className="text-purple-600"/>} label="洗練されたエレガンス" onClick={() => nextDiag('style', '洗練されたエレガント系')} /></>
                      ) : (
                        <><ChatOption icon={<GlassWater className="text-blue-600"/>} label="キリッと爽快なドライ" onClick={() => nextDiag('style', 'ドライな辛口系')} /><ChatOption icon={<Heart className="text-amber-600"/>} label="芳醇でフルーティー" onClick={() => nextDiag('style', '華やかなフルーティー系')} /></>
                      )}</>
                  )}
                  {diag.step === 3 && <><ChatOption icon={<Banknote size={32} className="text-green-700"/>} label="カジュアルに (〜4,000円)" onClick={() => nextDiag('budget', 'カジュアル')} /><ChatOption icon={<Banknote size={32} className="text-amber-700"/>} label="標準的に (4,000〜10,000円)" onClick={() => nextDiag('budget', '標準')} /><ChatOption icon={<Banknote size={32} className="text-purple-700"/>} label="贅沢に (10,000円以上)" onClick={() => nextDiag('budget', 'プレミアム')} /></>}
                  {diag.step === 4 && <><ChatOption icon={<Utensils size={32}/>} label="お肉料理に合わせて" onClick={() => nextDiag('scene', 'お肉料理')} /><ChatOption icon={<Utensils size={32}/>} label="お魚や前菜を華やかに" onClick={() => nextDiag('scene', 'お魚・前菜')} /><ChatOption icon={<Sparkles size={32}/>} label="今、ソムリエのおすすめを" onClick={() => nextDiag('scene', 'ソムリエのイチオシ')} /></>}
                </div>
              </div>
            ) : (
              history.map((h, i) => (
                <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-10 rounded-[3rem] shadow-2xl ${h.role === 'user' ? 'bg-black text-white border-4 border-amber-500' : 'bg-white text-black border-4 border-slate-100'}`}>
                    {h.role === 'assistant' ? renderMessageContent(h.content) : <p className="text-xl font-black whitespace-pre-wrap">{h.content}</p>}
                  </div>
                </div>
              ))
            )}
            {isTyping && <div className="flex justify-start"><div className="bg-white p-6 rounded-full shadow-2xl border border-slate-100"><Loader2 className="animate-spin text-black" size={32} /></div></div>}
            <div ref={chatEndRef} />
          </div>

          {/* 入力時の文字を100%読みやすくしたインポートエリア */}
          <div className="p-10 bg-white border-t-4 border-black flex gap-6">
            <input type="text" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="メッセージを入力..." className="flex-1 bg-slate-100 rounded-[2rem] py-7 px-10 text-xl font-black text-black border-4 border-transparent focus:border-black outline-none placeholder:text-slate-400 shadow-inner" />
            <button onClick={() => handleChat()} className="bg-black text-white p-7 rounded-[1.5rem] shadow-2xl active:scale-90 transition-all border-4 border-amber-500"><Send size={36}/></button>
          </div>
        </div>
      )}
    </main>
  );
}

function ChatOption({ icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-8 w-full p-10 bg-white border-4 border-slate-100 rounded-[3rem] text-black font-black text-xl shadow-md hover:border-black hover:bg-slate-50 transition-all active:scale-[0.98]">
      <div className="text-black">{icon}</div><span className="flex-1 text-left uppercase tracking-widest">{label}</span><ChevronRight size={32} className="text-slate-300" />
    </button>
  );
}

function FlavorDots({ label, val, color }: { label: string, val: string, color: string }) {
  const level = parseInt(val) || 0;
  return (
    <div className="space-y-3 flex-1">
      <span className="text-[12px] font-black uppercase text-black tracking-[0.2em] block">{label}</span>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className={`h-3 flex-1 rounded-full ${step <= level ? '' : 'bg-slate-200'}`} style={{ backgroundColor: step <= level ? color : undefined }} />
        ))}
      </div>
    </div>
  );
}
