"use client";
export const runtime = 'edge';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, X, Send, Loader2, Utensils, Star, Info, ChevronRight } from 'lucide-react';

// --- Types ---
interface Wine {
  id: string;
  name_jp: string;
  name_en?: string;
  country: string;
  region?: string;
  price_bottle: number;
  price_glass?: number;
  ai_explanation: string;
  image_url: string;
  pairing?: string;
  is_priority?: boolean; // 自社輸入品フラグ
  shipper?: string;      // 仕入先
  visible?: string;
  is_visible?: number;
  tags?: string;
}

export default function StoreMenu() {
  const { slug } = useParams();
  const [wines, setWines] = useState<Wine[]>([]);
  const [config, setConfig] = useState({ store_name: '', theme_color: '#000000' });
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. データ取得
  useEffect(() => {
    if (slug) {
      // ワインリスト取得
      fetch(`/api/wines?slug=${slug}`)
        .then(res => res.json())
        .then(data => {
          // インポーター主導権ロジック：特定の仕入先をプライオリティ化
          const processed = data.map((w: any) => ({
            ...w,
            // 「ピーロート」等の自社名が含まれる場合、またはフラグがある場合に優先
            is_priority: w.shipper?.includes('ピーロート') || w.is_priority === 1
          }));
          setWines(processed);
        })
        .catch(err => console.error("Fetch error:", err));

      // 店舗設定取得
      fetch(`/api/store/config/public?slug=${slug}`)
        .then(res => res.json())
        .then(setConfig);
    }
  }, [slug]);

  // チャット自動スクロール
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isTyping]);

  const trackView = async (wineId: string) => {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wine_id: wineId, store_slug: slug })
    });
  };

  const handleChat = async () => {
    if (!message.trim()) return;
    const userMsg = message;
    setHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setMessage("");
    setIsTyping(true);

    try {
      const res = await fetch('/api/sommelier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history, wineList: wines })
      });
      const data = await res.json();
      setHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (e) {
      setHistory(prev => [...prev, { role: 'assistant', content: "申し訳ありません。少し考えがまとまりませんでした。" }]);
    } finally {
      setIsTyping(false);
    }
  };

  // 表示フィルタリング（ONのものだけ）
  const filteredWines = useMemo(() => {
    return wines.filter((w) => w.visible === 'ON' || w.is_visible === 1);
  }, [wines]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-32 text-slate-900 font-sans tracking-tight">
      {/* サービスマン視点の極上ヘッダー */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-8 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Exclusive Wine Selection</p>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">
          {config.store_name || 'THE WINE LIST'}
        </h1>
      </header>

      <div className="max-w-2xl mx-auto px-5 pt-8 space-y-10">
        {filteredWines.map((wine) => (
          <div 
            key={wine.id} 
            onClick={() => { setSelectedWine(wine); trackView(wine.id); }}
            className={`group relative bg-white rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl active:scale-[0.98] cursor-pointer border-2 ${
              wine.is_priority ? 'border-amber-400 shadow-amber-100 shadow-2xl' : 'border-transparent shadow-xl'
            }`}
          >
            {/* インポーターの「押し」バッジ */}
            {wine.is_priority && (
              <div className="absolute top-5 left-5 z-20 bg-amber-400 text-black text-[10px] font-black px-4 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                <Star size={12} fill="currentColor" /> SPECIAL SELECTION
              </div>
            )}

            <div className="relative aspect-[16/10] overflow-hidden">
              <img 
                src={wine.image_url || "/api/placeholder/400/300"} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                alt={wine.name_jp}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
              
              <div className="absolute bottom-6 left-8 right-8 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded uppercase tracking-widest text-amber-300">
                    {wine.country}
                  </span>
                  {wine.tags && <span className="text-[10px] font-medium text-slate-300">#{wine.tags.split(',')[0]}</span>}
                </div>
                <h2 className="text-2xl font-black leading-tight mb-2 group-hover:text-amber-400 transition-colors">
                  {wine.name_jp}
                </h2>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-black text-white">
                      ¥{Number(wine.price_bottle).toLocaleString()}
                    </span>
                    <span className="text-[10px] ml-2 text-slate-400 uppercase font-bold tracking-widest">Bottle</span>
                  </div>
                  {wine.price_glass && wine.price_glass > 0 && (
                    <div className="text-right">
                      <span className="text-lg font-bold text-amber-400">¥{Number(wine.price_glass).toLocaleString()}</span>
                      <span className="block text-[8px] text-slate-400 uppercase font-bold tracking-widest text-center">Glass</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Sommelier Button - アニメーションを強化 */}
      <button 
        onClick={() => setChatOpen(true)} 
        className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-12 py-6 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 border-2 border-amber-500/50 z-50 hover:bg-black hover:scale-105 active:scale-95 transition-all group"
      >
        <div className="relative">
          <Sparkles className="text-amber-400 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
        </div>
        <span className="font-black uppercase tracking-[0.2em] text-sm">AI Sommelier</span>
      </button>

      {/* 詳細モーダル */}
      {selectedWine && (
        <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-md flex items-end animate-in slide-in-from-bottom duration-500">
          <div className="bg-white w-full max-h-[95vh] rounded-t-[3.5rem] overflow-y-auto pb-16 shadow-2xl relative">
            <div className="sticky top-0 right-0 p-6 flex justify-end z-20 pointer-events-none">
              <button 
                onClick={() => setSelectedWine(null)} 
                className="p-4 bg-white/90 backdrop-blur shadow-xl rounded-full pointer-events-auto border border-slate-100 active:scale-90 transition-all"
              >
                <X size={24} className="text-slate-900"/>
              </button>
            </div>
            
            <div className="px-8 -mt-6">
              <div className="relative w-full aspect-square mb-8">
                <img 
                  src={selectedWine.image_url} 
                  className="w-full h-full object-contain mix-blend-multiply drop-shadow-2xl" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
              </div>
              
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-widest">{selectedWine.country}</span>
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-widest">{selectedWine.region}</span>
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 leading-tight mb-2">{selectedWine.name_jp}</h2>
                  <p className="text-slate-400 font-bold italic tracking-wider">{selectedWine.name_en}</p>
                </div>

                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 relative">
                   <Info className="absolute top-6 right-6 text-slate-200" size={40} />
                   <p className="text-lg text-slate-700 leading-relaxed font-medium">
                     {selectedWine.ai_explanation}
                   </p>
                </div>

                {selectedWine.pairing && (
                  <div className="bg-emerald-50 p-8 rounded-[2rem] text-emerald-900 border border-emerald-100">
                    <div className="flex items-center gap-3 mb-3">
                      <Utensils className="text-emerald-500" />
                      <span className="text-xs font-black uppercase tracking-widest">Recommended Pairing</span>
                    </div>
                    <p className="text-xl font-bold">{selectedWine.pairing}</p>
                  </div>
                )}

                <button 
                  onClick={() => { setChatOpen(true); setSelectedWine(null); }}
                  className="w-full py-6 bg-slate-100 rounded-2xl font-black text-slate-600 flex items-center justify-center gap-3 hover:bg-slate-200 transition-colors"
                >
                  <Sparkles size={20} className="text-amber-500" /> このワインについてAIに詳しく聞く
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* チャットモーダル */}
      {chatOpen && (
        <div className="fixed inset-0 bg-white z-[80] flex flex-col animate-in slide-in-from-bottom duration-500">
          <header className="px-8 py-8 border-b flex justify-between items-center bg-white sticky top-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10
