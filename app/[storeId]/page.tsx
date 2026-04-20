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

  // 5ステップ診断ステート (format -> color -> style -> budget -> scene)
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
      const stockNum = parseInt(String(w.stock || '1').trim());
      const inStock = isNaN(stockNum) || stockNum > 0;
      return matchColor && isVisible && inStock;
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
      const prompt = `飲み方は「${next.format}」で、予算は「${next.budget}」を希望。
      種類は「${next.color}」で、味わいは「${next.style}」が好みです。
      「${next.scene}」というシチュエーションに最適な、心に響く一本をリストから選んで提案してください。
      提案するすべてのワインに対し、最後に必ず 【ID:ワインのID】 を付記してください。複数あればすべてお願いします。`;
      handleChat(prompt);
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
      setHistory(prev => [...prev, { role: 'assistant', content: "大変申し訳ございません。ただいまソムリエが席を外しております。" }]);
    } finally { setIsTyping(false); }
  };

  const renderMessageContent = (content: string) => {
    const idMatches = Array.from(content.matchAll(/【ID:(\d+)】/g));
    const textWithoutIds = content.replace(/【ID:\d+】/g, '').trim();
    const suggestedWines = idMatches.map(match => wines.find((w: any) => w.id === match[1])).filter(w => w);

    return (
      <div className="space-y-4">
        <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap text-slate-800">{textWithoutIds}</p>
        {suggestedWines.length > 0 && (
          <div className="grid grid-cols-1 gap-3 mt-2">
            {suggestedWines.map((wine: any) => (
              <button 
                key={wine.id}
                onClick={() => {
                  const el = document.getElementById(`wine-${wine.id}`);
                  if (el) { 
                    minimizeChat();
                    setTimeout(() => {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el.classList.add('ring-4', 'ring-amber-400');
                      setTimeout(() => el.classList.remove('ring-4', 'ring-amber-400'), 2500);
                    }, 300);
                  }
                }}
                className="w-full text-left bg-white rounded-2xl border-2 border-amber-100 shadow-md hover:border-amber-400 transition-all p-3 flex gap-4 animate-in zoom-in-95 duration-300"
              >
                <img src={wine.image} className="w-16 h-20 object-cover rounded-lg flex-shrink-0" alt="" />
                <div className="flex-1 relative">
                  <p className="text-[8px] font-black text-[#2f5d3a] uppercase">{wine.color} / {wine.type}</p>
                  <p className="text-xs font-black text-slate-800 leading-tight mb-1">{wine.name_jp}</p>
                  <p className="text-xs font-black text-amber-600">¥{Number(wine.price_bottle).toLocaleString()}</p>
                  <div className="absolute bottom-0 right-0 text-[#2f5d3a] font-black text-[9px] flex items-center gap-1">移動する <ChevronRight size={10}/></div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans pb-32">
      <header className="py-12 px-8 text-center bg-white border-b shadow-sm">
        <h1 className="text-2xl font-bold tracking-[0.2em] uppercase mb-2">{config.menu_name || 'WINE SELECTION'}</h1>
        <div className="h-[2px] w-8 bg-[#2f5d3a] mx-auto"></div>
      </header>

      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md px-6 py-4 border-b shadow-sm overflow-x-auto no-scrollbar flex gap-2">
        {['ALL', '赤', '白', 'ロゼ', '泡'].map(c => (
          <button key={c} onClick={() => setFilterColor(c)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filterColor === c ? 'bg-[#2f5d3a] text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{c}</button>
        ))}
      </div>

      <div className="max-w-xl mx-auto px-6 space-y-10 mt-8">
        {filteredWines.map((wine: any) => (
          <div key={wine.id} id={`wine-${wine.id}`} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 transition-all duration-700">
            <div className="relative aspect-[16/10] bg-slate-50">
              {wine.image && <img src={wine.image} className="w-full h-full object-cover" alt="" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-5 left-6 right-6 text-white">
                <p className="text-[10px] font-black uppercase opacity-80 mb-1">{wine.country} {wine.vintage && `/ ${wine.vintage}`}</p>
                <div className="flex justify-between items-end"><h2 className="text-xl font-bold leading-tight">{wine.name_jp}</h2><p className="text-lg font-black tracking-tighter">¥{Number(wine.price_bottle).toLocaleString()}</p></div>
              </div>
            </div>
            <div className="p-6 space-y-4 text-center md:text-left">
              <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-50">
                <FlavorDots label="Body" val={wine.body} color="#2f5d3a" />
                <FlavorDots label="Acidity" val={wine.acidity} color="#2f5d3a" />
                <FlavorDots label="Sweetness" val={wine.sweetness} color="#2f5d3a" />
                <FlavorDots label={wine.color === '赤' ? 'Tannin' : 'Aroma'} val={wine.color === '赤' ? wine.tannin : wine.aroma_intensity} color={wine.color === '赤' ? '#8b0000' : '#2f5d3a'} />
              </div>
              <p className="text-sm text-slate-800 font-bold italic leading-relaxed">「{wine.menu_short}」</p>
              {wine.pairing && <div className="inline-flex items-center gap-2 text-[#2f5d3a] bg-[#2f5d3a]/5 px-4 py-2 rounded-2xl text-[11px] font-bold"><Utensils size={14}/> 相性: {wine.pairing}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
        <button onClick={() => setChatOpen(true)} className="pointer-events-auto bg-[#2f5d3a] text-white px-8 py-5 rounded-full shadow-2xl flex items-center gap-3 animate-bounce shadow-[#2f5d3a]/40"><Sparkles size={20} className="text-amber-400" /><span className="text-sm font-black tracking-widest uppercase">Consult AI Sommelier</span></button>
      </div>

      {chatOpen && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="flex justify-between items-center p-6 border-b">
            <div className="flex items-center gap-2"><div className="w-8 h-8 bg-[#2f5d3a] rounded-full flex items-center justify-center text-amber-400 shadow-inner"><Sparkles size={16} /></div><h2 className="text-lg font-bold tracking-widest uppercase text-[#2f5d3a]">AI Sommelier</h2></div>
            <div className="flex items-center gap-4">
              {history.length > 0 && <button onClick={resetChat} className="text-[10px] font-black text-slate-300 hover:text-slate-600 flex items-center gap-1 uppercase transition-colors"><RotateCcw size={12}/> 最初からやり直す</button>}
              <button onClick={minimizeChat} className="text-slate-400 p-2 hover:bg-slate-50 rounded-full transition-all"><X size={28}/></button>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8f9f8]">
            {history.length === 0 ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                  <p className="text-[#2f5d3a] font-black text-xl mb-2">
                    {diag.step === 0 && "いらっしゃいませ。まずは今夜の飲み方を教えてください。"}
                    {diag.step === 1 && "ご希望の色はございますか？"}
                    {diag.step === 2 && "どのような味わいがお好みでしょう？"}
                    {diag.step === 3 && "ご予算の目安はいかがでしょうか？"}
                    {diag.step === 4 && "最後にお料理やシーンを教えてください。"}
                  </p>
                  <div className="flex gap-1 mt-4">
                    {[0,1,2,3,4].map(i => <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= diag.step ? 'bg-[#2f5d3a]' : 'bg-slate-100'}`} />)}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {diag.step === 0 && <><ChatOption icon={<GlassWater/>} label="グラスで気軽に楽しみたい" onClick={() => nextDiag('format', 'グラス')} /><ChatOption icon={<WineIcon/>} label="ボトルでゆっくり堪能したい" onClick={() => nextDiag('format', 'ボトル')} /></>}
                  {diag.step === 1 && <><ChatOption icon={<div className="w-4 h-4 rounded-full bg-red-700 shadow-sm"/>} label="赤ワイン" onClick={() => nextDiag('color', '赤')} /><ChatOption icon={<div className="w-4 h-4 rounded-full bg-amber-100 border shadow-sm"/>} label="白ワイン" onClick={() => nextDiag('color', '白')} /><ChatOption icon={<div className="w-4 h-4 rounded-full bg-pink-300 shadow-sm"/>} label="ロゼ / 泡" onClick={() => nextDiag('color', 'ロゼ・泡')} /></>}
                  {diag.step === 2 && (
                    <>
                      {diag.color === '赤' ? (
                        <>
                          <ChatOption icon={<Heart className="text-red-500"/>} label="果実味の凝縮感（リッチ・力強い）" onClick={() => nextDiag('style', '果実味が豊かで凝縮感のあるスタイル')} />
                          <ChatOption icon={<Sparkles className="text-purple-400"/>} label="洗練されたエレガンス（綺麗・洗練）" onClick={() => nextDiag('style', 'エレガントで洗練された綺麗めなスタイル')} />
                        </>
                      ) : diag.color === '白' ? (
                        <>
                          <ChatOption icon={<GlassWater className="text-blue-400"/>} label="キリッと爽快な辛口（ドライ・清涼感）" onClick={() => nextDiag('style', 'キリッと爽快なドライで辛口なスタイル')} />
                          <ChatOption icon={<Heart className="text-amber-500"/>} label="芳醇でフルーティー（リッチ・華やか）" onClick={() => nextDiag('style', '芳醇でリッチ、華やかなフルーティーさ')} />
                        </>
                      ) : (
                        <>
                          <ChatOption icon={<Sparkles className="text-pink-400"/>} label="フレッシュ＆ドライ（スッキリ）" onClick={() => nextDiag('style', 'スッキリしたフレッシュな辛口')} />
                          <ChatOption icon={<Heart className="text-pink-600"/>} label="華やかでチャーミング（フルーティー）" onClick={() => nextDiag('style', '華やかで果実味溢れるスタイル')} />
                        </>
                      )}
                    </>
                  )}
                  {diag.step === 3 && <><ChatOption icon={<Banknote className="text-green-600"/>} label="カジュアルに (〜4,000円)" onClick={() => nextDiag('budget', 'カジュアルな価格帯')} /><ChatOption icon={<Banknote className="text-amber-600"/>} label="標準的に (4,000〜10,000円)" onClick={() => nextDiag('budget', '標準的な価格帯')} /><ChatOption icon={<Banknote className="text-purple-600"/>} label="贅沢に (10,000円以上)" onClick={() => nextDiag('budget', '最高級・プレミアムな価格帯')} /></>}
                  {diag.step === 4 && <><ChatOption icon={<Utensils/>} label="お肉料理に完璧に合わせたい" onClick={() => nextDiag('scene', 'お肉料理')} /><ChatOption icon={<Utensils/>} label="魚介や前菜を華やかに" onClick={() => nextDiag('scene', 'お魚料理や前菜')} /><ChatOption icon={<Sparkles/>} label="今、お店で一番旬なイチオシを" onClick={() => nextDiag('scene', 'ソムリエのイチオシ')} /></>}
                </div>
              </div>
            ) : (
              history.map((h, i) => (
                <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-5 rounded-3xl ${h.role === 'user' ? 'bg-[#2f5d3a] text-white shadow-lg' : 'bg-white text-slate-800 border shadow-sm'}`}>
                    {h.role === 'assistant' ? renderMessageContent(h.content) : <p className="text-sm font-bold whitespace-pre-wrap">{h.content}</p>}
                  </div>
                </div>
              ))
            )}
            {isTyping && <div className="flex justify-start"><div className="bg-white p-4 rounded-full border shadow-sm"><Loader2 className="animate-spin text-[#2f5d3a]" size={20} /></div></div>}
            <div ref={chatEndRef} />
          </div>
          <div className="p-6 bg-white border-t flex gap-2">
            <input type="text" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="他にご要望はありますか？" className="flex-1 bg-slate-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 ring-amber-200 transition-all" />
            <button onClick={() => handleChat()} className="bg-[#2f5d3a] text-white p-4 rounded-2xl shadow-lg active:scale-90 transition-all"><Send size={20}/></button>
          </div>
        </div>
      )}
    </main>
  );
}

function ChatOption({ icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-4 w-full p-6 bg-white border border-slate-100 rounded-[1.5rem] text-slate-700 font-bold text-sm shadow-sm hover:border-amber-200 hover:bg-amber-50/30 transition-all active:scale-[0.98]">
      <div className="text-[#2f5d3a]">{icon}</div><span className="flex-1 text-left">{label}</span><ChevronRight size={16} className="opacity-20" />
    </button>
  );
}

function FlavorDots({ label, val, color }: { label: string, val: string, color: string }) {
  const level = parseInt(val) || 0;
  return (
    <div className="space-y-1 flex-1">
      <span className="text-[8px] font-black uppercase opacity-30 block">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((step) => <div key={step} className={`h-1 flex-1 rounded-full ${step <= level ? '' : 'bg-slate-100'}`} style={{ backgroundColor: step <= level ? color : undefined }} />)}
      </div>
    </div>
  );
}
