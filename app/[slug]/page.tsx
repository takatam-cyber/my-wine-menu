"use client";
export const runtime = 'edge';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, X, Send, Loader2, ChevronRight, Utensils, GlassWater, Wine as WineIcon, Banknote, Heart } from 'lucide-react';

export default function StoreMenu() {
  const params = useParams();
  const slug = params?.slug as string; // URLの [slug] 部分を取得
  
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
      // 1. スラッグに基づいてその店舗のワインリストを取得
      fetch(`/api/wines?slug=${slug}`)
        .then(res => res.json())
        .then(data => setWines(Array.isArray(data) ? data : []));
      
      // 2. スラッグに基づいて店舗名を取得
      fetch(`/api/store/config/public?slug=${slug}`)
        .then(res => res.json())
        .then(data => setConfig(data));
    }
  }, [slug]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [history, isTyping]);

  const filteredWines = useMemo(() => {
    return wines.filter((w: any) => {
      const matchColor = filterColor === 'ALL' || w.color === filterColor;
      // 表示設定がON（1）のものだけを表示
      const isVisible = w.is_visible === 1 || w.visible === 'ON';
      return matchColor && isVisible && w.name_jp;
    });
  }, [wines, filterColor]);

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
      setHistory(prev => [...prev, { role: 'assistant', content: "ソムリエは席を外しております。" }]);
    } finally { setIsTyping(false); }
  };

  const nextDiag = (key: string, val: string) => {
    const next = { ...diag, [key]: val, step: diag.step + 1 };
    setDiag(next);
    if (next.step === 5) {
      handleChat(`【診断結果】飲み方:${next.format}, 予算:${next.budget}, 色:${next.color}, 味わい:${next.style}, シーン:${next.scene}。これに合う最適な提案をプロとしてお願いします。必ず最後にIDを添えて。`);
    }
  };

  const renderMessageContent = (content: string) => {
    const idMatches = Array.from(content.matchAll(/(?:ID:|id:|【ID:|ID：)(\d+)/gi));
    const textWithoutIds = content.replace(/(?:【ID:|ID:|id:|ID：)(\d+)\s*】?/gi, '').trim();
    const suggestedWines = idMatches.map(match => wines.find((w: any) => w.id === match[1])).filter(w => w);

    return (
      <div className="space-y-4 text-left">
        <p className="text-[15px] font-bold leading-relaxed text-slate-900 whitespace-pre-wrap">{textWithoutIds}</p>
        {suggestedWines.map((wine: any) => (
          <button key={wine.id} onClick={() => { setChatOpen(false); setSelectedWine(wine); }} className="w-full bg-white rounded-2xl border-2 border-amber-400 shadow-lg p-3 flex gap-4 active:scale-95 transition-all">
            <img src={wine.image_url || wine.image} className="w-16 h-20 object-cover rounded-lg flex-shrink-0" alt="" />
            <div className="flex-1">
              <p className="text-[10px] font-bold text-[#2f5d3a] uppercase">{wine.color} / {wine.type}</p>
              <p className="text-sm font-bold text-black leading-tight mb-1">{wine.name_jp}</p>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm font-bold text-amber-700">¥{Number(wine.price_bottle).toLocaleString()}</p>
                <span className="text-[10px] font-bold bg-black text-white px-3 py-1 rounded-full">詳しく見る</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-32">
      {/* 視認性の高いヘッダー */}
      <header className="py-12 px-8 text-center bg-white border-b-2 border-slate-100">
        <h1 className="text-3xl font-bold tracking-tighter uppercase text-slate-900 italic">
          {config.store_name || 'SELECT SELECTION'}
        </h1>
        <div className="h-1 w-10 bg-black mx-auto mt-3 rounded-full"></div>
      </header>

      {/* スムーズなフィルタ */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-6 py-5 border-b-2 border-slate-100 flex gap-3 overflow-x-auto no-scrollbar shadow-sm">
        {['ALL', '赤', '白', 'ロゼ', '泡'].map(c => (
          <button key={c} onClick={() => setFilterColor(c)} className={`px-7 py-3 rounded-2xl text-[11px] font-bold transition-all ${filterColor === c ? 'bg-black text-white shadow-xl scale-105' : 'bg-white text-slate-900 border-2 border-slate-100'}`}>{c}</button>
        ))}
      </div>

      {/* 洗練されたワインリスト */}
      <div className="max-w-xl mx-auto px-6 space-y-12 mt-10 text-left">
        {filteredWines.length > 0 ? filteredWines.map((wine: any) => (
          <div key={wine.id} onClick={() => setSelectedWine(wine)} className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 active:scale-[0.98] transition-all cursor-pointer">
            <div className="relative aspect-[4/3]">
              {(wine.image_url || wine.image) && <img src={wine.image_url || wine.image} className="w-full h-full object-cover" alt="" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-8 right-8 text-white text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">{wine.country} / {wine.vintage}</p>
                <div className="flex justify-between items-end">
                  <h2 className="text-2xl font-bold leading-tight flex-1 pr-4">{wine.name_jp}</h2>
                  <p className="text-xl font-bold text-amber-400">¥{Number(wine.price_bottle).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-4">
              <p className="text-sm text-slate-900 font-bold italic leading-relaxed">「{wine.menu_short}」</p>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <div className="flex gap-2">
                   <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{wine.type}</span>
                   <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{wine.grape}</span>
                </div>
                <span className="text-[10px] font-bold text-[#2f5d3a] flex items-center gap-1 uppercase tracking-widest">Detail <ChevronRight size={12}/></span>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-20">
            <WineIcon size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold">ワインリストを準備中です</p>
          </div>
        )}
      </div>

      {/* フローティングAIボタン */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none">
        <button onClick={() => setChatOpen(true)} className="pointer-events-auto bg-black text-white px-10 py-6 rounded-full shadow-2xl flex items-center gap-4 animate-bounce border-2 border-amber-500">
          <Sparkles size={24} className="text-amber-400" /><span className="text-sm font-bold uppercase tracking-widest">Consult AI Sommelier</span>
        </button>
      </div>

      {/* 詳細モーダル (タップ時に表示) */}
      {selectedWine && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end animate-in fade-in duration-300">
          <div className="bg-white w-full max-h-[90vh] rounded-t-[3rem] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-500 pb-12">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md p-6 flex justify-between items-center border-b z-10">
              <h3 className="text-lg font-bold text-slate-900 tracking-tighter italic">Wine Detail</h3>
              <button onClick={() => setSelectedWine(null)} className="bg-slate-100 p-2 rounded-full text-slate-400"><X size={24}/></button>
            </div>
            <div className="p-8 space-y-8 text-left">
              <img src={selectedWine.image_url || selectedWine.image} className="w-full aspect-square object-contain bg-slate-50 rounded-[2rem] shadow-inner" alt="" />
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase mb-1 tracking-widest">{selectedWine.country} / {selectedWine.region}</p>
                <h2 className="text-2xl font-bold text-slate-900 leading-tight mb-2">{selectedWine.name_jp}</h2>
                <p className="text-sm text-slate-400 font-medium italic">{selectedWine.name_en}</p>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-50 p-6 rounded-[2rem] border-l-8 border-black">
                   <p className="text-sm font-bold text-slate-900 leading-relaxed italic">「{selectedWine.menu_short}」</p>
                </div>
                <p className="text-[13px] font-medium text-slate-600 leading-loose whitespace-pre-wrap">{selectedWine.ai_explanation}</p>
                {selectedWine.pairing && (
                  <div className="bg-[#2f5d3a]/5 p-5 rounded-2xl flex items-start gap-3">
                    <Utensils size={20} className="text-[#2f5d3a] flex-shrink-0 mt-0.5"/>
                    <p className="text-[13px] font-bold text-[#2f5d3a]">最高の相性: {selectedWine.pairing}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* チャットモーダル */}
      {chatOpen && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="flex justify-between items-center p-6 border-b-2 border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-amber-400">
                <Sparkles size={20} />
              </div>
              <h2 className="text-xl font-bold text-black uppercase">Sommelier</h2>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-slate-400 p-2"><X size={32}/></button>
          </header>
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50">
            {history.length === 0 ? (
              <div className="space-y-8 max-w-lg mx-auto">
                <div className="bg-black text-white p-10 rounded-[3rem] border-4 border-amber-500 shadow-2xl text-left">
                  <p className="text-2xl font-bold mb-4 italic text-amber-400 tracking-tighter">Wine Concierge</p>
                  <p className="text-slate-100 text-lg font-bold leading-relaxed">
                    {diag.step === 0 ? "今夜はどのように楽しまれますか？" : 
                     diag.step === 1 ? "ご希望の色を教えてください。" : 
                     diag.step === 2 ? "味わいの方向性はいかがでしょう？" : 
                     diag.step === 3 ? "ご予算の目安を教えてください。" : "最後にお料理やシーンは？"}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {diag.step === 0 && (
                    <>
                      <button onClick={() => nextDiag('format', 'グラス')} className="flex items-center gap-6 w-full p-7 bg-white border-2 border-slate-100 rounded-[2rem] text-black font-bold text-base shadow-sm active:scale-[0.97] transition-all hover:border-black text-left">
                        <GlassWater/><span className="flex-1 uppercase tracking-tighter">グラスで気軽に</span><ChevronRight size={20} className="text-slate-300" />
                      </button>
                      <button onClick={() => nextDiag('format', 'ボトル')} className="flex items-center gap-6 w-full p-7 bg-white border-2 border-slate-100 rounded-[2rem] text-black font-bold text-base shadow-sm active:scale-[0.97] transition-all hover:border-black text-left">
                        <WineIcon/><span className="flex-1 uppercase tracking-tighter">ボトルでゆったり</span><ChevronRight size={20} className="text-slate-300" />
                      </button>
                    </>
                  )}
                  {diag.step === 1 && (
                    <>
                      <button onClick={() => nextDiag('color', '赤')} className="flex items-center gap-6 w-full p-7 bg-white border-2 border-slate-100 rounded-[2rem] text-black font-bold text-base shadow-sm active:scale-[0.97] transition-all hover:border-black text-left">
                        <div className="w-6 h-6 rounded-full bg-red-700"/><span className="flex-1 uppercase tracking-tighter">赤ワイン</span><ChevronRight size={20} className="text-slate-300" />
                      </button>
                      <button onClick={() => nextDiag('color', '白')} className="flex items-center gap-6 w-full p-7 bg-white border-2 border-slate-100 rounded-[2rem] text-black font-bold text-base shadow-sm active:scale-[0.97] transition-all hover:border-black text-left">
                        <div className="w-6 h-6 rounded-full bg-amber-100 border-2"/><span className="flex-1 uppercase tracking-tighter">白ワイン</span><ChevronRight size={20} className="text-slate-300" />
                      </button>
                    </>
                  )}
                  {/* ... 同様に step 2, 3, 4 も作成 ... */}
                </div>
              </div>
            ) : (
              history.map((h, i) => (
                <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-8 rounded-[2.5rem] shadow-xl ${h.role === 'user' ? 'bg-black text-white border-2 border-amber-500' : 'bg-white text-black border-2 border-slate-100'}`}>
                    {h.role === 'assistant' ? renderMessageContent(h.content) : <p className="text-[15px] font-bold whitespace-pre-wrap">{h.content}</p>}
                  </div>
                </div>
              ))
            )}
            {isTyping && <div className="flex justify-start"><div className="bg-white p-5 rounded-full shadow-lg border border-slate-100"><Loader2 className="animate-spin text-black" size={28} /></div></div>}
            <div ref={chatEndRef} />
          </div>
          <div className="p-8 bg-white border-t-2 border-slate-100 flex gap-4">
            <input type="text" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="ご要望を入力..." className="flex-1 bg-slate-100 rounded-2xl py-5 px-8 text-lg font-bold text-black outline-none border-2 border-transparent focus:border-black placeholder:text-slate-400" />
            <button onClick={() => handleChat()} className="bg-black text-white p-6 rounded-2xl shadow-xl active:scale-90 border-2 border-amber-500"><Send size={28}/></button>
          </div>
        </div>
      )}
    </main>
  );
}
"use client";
export const runtime = 'edge';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, X, Send, Loader2, ChevronRight, Utensils, GlassWater, Wine as WineIcon } from 'lucide-react';

export default function StoreMenu() {
  const params = useParams();
  const slug = params?.slug as string;
  
  const [wines, setWines] = useState([]);
  const [config, setConfig] = useState({ store_name: '' });
  const [selectedWine, setSelectedWine] = useState<any>(null);

  useEffect(() => {
    if (slug) {
      fetch(`/api/wines?slug=${slug}`).then(res => res.json()).then(setWines);
      fetch(`/api/store/config/public?slug=${slug}`).then(res => res.json()).then(setConfig);
    }
  }, [slug]);

  // ★ 閲覧ログを送信する関数
  const trackView = async (wineId: string) => {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wine_id: wineId, store_slug: slug })
    });
  };

  const filteredWines = useMemo(() => {
    return wines.filter((w: any) => (w.is_visible === 1 || w.visible === 'ON') && w.name_jp);
  }, [wines]);

  return (
    <main className="min-h-screen bg-slate-50 pb-32 text-black">
      <header className="py-12 px-8 text-center bg-white border-b-2 border-slate-100">
        <h1 className="text-3xl font-bold tracking-tighter uppercase italic">{config.store_name || 'WINE MENU'}</h1>
      </header>

      <div className="max-w-xl mx-auto px-6 space-y-12 mt-10">
        {filteredWines.map((wine: any) => (
          <div 
            key={wine.id} 
            onClick={() => {
              setSelectedWine(wine);
              trackView(wine.id); // ★ クリック時に統計を送信
            }} 
            className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 cursor-pointer active:scale-95 transition-all"
          >
            <div className="relative aspect-[4/3]">
              <img src={wine.image_url || wine.image} className="w-full h-full object-cover" />
              <div className="absolute bottom-6 left-8 right-8 text-white text-left">
                <p className="text-[10px] font-bold uppercase text-amber-400 mb-1">{wine.country} / {wine.vintage}</p>
                <h2 className="text-2xl font-bold">{wine.name_jp}</h2>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 詳細モーダル等は以前のまま */}
    </main>
  );
}
