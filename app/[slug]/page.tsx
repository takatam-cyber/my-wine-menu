// app/[slug]/page.tsx
"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Wine, Star, MessageSquare, ChevronRight, X, Send, Lock, Loader2, 
  Info, Utensils, GlassWater, Search, Check, Droplets, Wind
} from 'lucide-react';

/**
 * APIエンドポイントのパース用ユーティリティ
 * プレビュー環境(blob URL)と実環境の両方で動作を保証します
 */
const getApiUrl = (path: string) => {
  if (typeof window === 'undefined') return path;
  try {
    const baseUrl = window.location.href.startsWith('blob:') 
      ? window.location.href.replace(/^blob:/, '') 
      : window.location.href;
    const url = new URL(path, baseUrl);
    return `${url.protocol}//${url.host}${url.pathname}${url.search}`;
  } catch (e) {
    const origin = window.location.origin && window.location.origin !== 'null' ? window.location.origin : '';
    return `${origin}${path}`;
  }
};

/**
 * 8項目の風味指標を表示するためのレーダーチャート・コンポーネント
 */
const WineRadarChart = ({ profile }: { profile: any }) => {
  const fields = [
    { key: 'sweetness', label: '甘味' },
    { key: 'body', label: 'ボディ' },
    { key: 'acidity', label: '酸味' },
    { key: 'tannins', label: 'タンニン' },
    { key: 'aroma_intensity', label: '香りの強さ' },
    { key: 'complexity', label: '複雑さ' },
    { key: 'finish', label: '余韻' },
    { key: 'oak', label: 'オーク' }
  ];

  const size = 220;
  const center = size / 2;
  const radius = center - 45;
  const levels = 5;

  const getCoordinates = (index: number, value: number) => {
    const angle = (Math.PI * 2) / fields.length * index - Math.PI / 2;
    const r = (radius / levels) * Math.min(value, levels);
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  const gridLines = [];
  for (let i = 1; i <= levels; i++) {
    const points = fields.map((_, idx) => {
      const coords = getCoordinates(idx, i);
      return `${coords.x},${coords.y}`;
    }).join(' ');
    gridLines.push(<polygon key={i} points={points} className="fill-none stroke-white/10" strokeWidth="0.5" />);
  }

  const dataPoints = fields.map((f, idx) => {
    const val = Number(profile[f.key]) || 0;
    const coords = getCoordinates(idx, val);
    return `${coords.x},${coords.y}`;
  }).join(' ');

  return (
    <div className="flex justify-center items-center w-full aspect-square relative my-4">
      <svg width={size} height={size} className="overflow-visible">
        {gridLines}
        {fields.map((_, idx) => {
          const coords = getCoordinates(idx, levels);
          return <line key={idx} x1={center} y1={center} x2={coords.x} y2={coords.y} className="stroke-white/10" strokeWidth="0.5" />;
        })}
        <polygon points={dataPoints} className="fill-amber-500/30 stroke-amber-500 stroke-2 transition-all duration-1000" />
        {fields.map((f, idx) => {
          const coords = getCoordinates(idx, levels + 1.4);
          return (
            <text 
              key={idx} 
              x={coords.x} 
              y={coords.y} 
              textAnchor="middle" 
              dominantBaseline="middle"
              className="fill-stone-400 text-[10px] font-bold tracking-tighter"
            >
              {f.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

const SAMPLE_WINES = [
  {
    id: "S001",
    name_jp: "ピーロート・ブルー カビネット",
    name_en: "Pieroth Blue Kabinett",
    country: "ドイツ",
    region: "ナーエ",
    color: "白",
    store_price_glass: 1200,
    store_price_bottle: 6800,
    sweetness: 4, body: 2, acidity: 4, tannins: 1, aroma_intensity: 4, complexity: 3, finish: 4, oak: 1,
    is_priority: 1,
    image_url: "https://images.unsplash.com/photo-1553122158-94736f8f74a0?w=800&q=80",
    ai_explanation: "伝説的な青いボトルに収められた、ピーロートを象徴する逸品。完熟した果実の甘みとキレのある酸が調和した、真のクラシックです。",
    pairing: "フレッシュフルーツ、天ぷら、スパイシーな広東料理"
  },
  {
    id: "S002",
    name_jp: "シャトー・ピエレ 2018",
    name_en: "Chateau Pierlet 2018",
    country: "フランス",
    region: "ボルドー",
    color: "赤",
    store_price_glass: 1800,
    store_price_bottle: 9800,
    sweetness: 1, body: 4, acidity: 3, tannins: 4, aroma_intensity: 4, complexity: 5, finish: 5, oak: 4,
    is_priority: 1,
    image_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80",
    ai_explanation: "深いガーネット色の影に、熟した黒実果のアロマが潜む。ボルドーの伝統的な気品と、モダンな力強さが共鳴するフルボディです。",
    pairing: "牛フィレ肉のロティ、黒トリュフ、熟成したコンテチーズ"
  },
  {
    id: "S003",
    name_jp: "アルマ・デ・チリ シャルドネ",
    name_en: "Alma de Chile Chardonnay",
    country: "チリ",
    region: "セントラル・ヴァレー",
    color: "白",
    store_price_glass: 950,
    store_price_bottle: 4800,
    sweetness: 1, body: 3, acidity: 3, tannins: 1, aroma_intensity: 3, complexity: 3, finish: 3, oak: 3,
    is_priority: 0,
    image_url: "https://images.unsplash.com/photo-1551218372-a20256dd3f82?w=800&q=80",
    ai_explanation: "太陽の恵みを凝縮した黄金色のシャルドネ。クリーミーな質感と、トロピカルフルーツの鮮やかな香りが広がります。",
    pairing: "帆立貝のムニエル、白身魚のクリームソース"
  }
];

const CATEGORIES = [
  { label: 'ALL', value: 'すべて' },
  { label: 'RED', value: '赤' },
  { label: 'WHITE', value: '白' },
  { label: 'SPARKLING', value: '泡' },
  { label: 'ROSE', value: 'ロゼ' },
];

export default function App() {
  const [slug, setSlug] = useState('');
  const [wines, setWines] = useState<any[]>([]);
  const [storeConfig, setStoreConfig] = useState<any>(null);
  const [selectedWine, setSelectedWine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [passInput, setPassInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeCategory, setActiveCategory] = useState('すべて');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pathParts = typeof window !== 'undefined' ? window.location.pathname.split('/') : [];
    const currentSlug = pathParts[pathParts.length - 1] || 'default-store';
    setSlug(currentSlug);

    const init = async () => {
      try {
        const configRes = await fetch(getApiUrl(`/api/store/config/public?slug=${currentSlug}`));
        if (configRes.ok) {
          const config = await configRes.json();
          setStoreConfig(config);
          if (!config.access_password) setIsUnlocked(true);
        } else {
          setStoreConfig({ store_name: "PIEROTH HIBIYA", access_password: "wine" });
        }

        const wineRes = await fetch(getApiUrl(`/api/wines?slug=${currentSlug}`));
        if (wineRes.ok) {
          const wineData = await wineRes.json();
          setWines(wineData && wineData.length > 0 ? wineData : SAMPLE_WINES);
        } else {
          setWines(SAMPLE_WINES);
        }
      } catch (e) {
        setWines(SAMPLE_WINES);
        setStoreConfig({ store_name: "PIEROTH HIBIYA", access_password: "wine" });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredWines = useMemo(() => {
    return wines.filter(wine => {
      const matchesCategory = activeCategory === 'すべて' || wine.color === activeCategory;
      const matchesSearch = 
        String(wine.name_jp).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(wine.name_en).toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).sort((a, b) => (b.is_priority || 0) - (a.is_priority || 0));
  }, [wines, activeCategory, searchQuery]);

  const handleUnlock = () => {
    if (passInput === storeConfig?.access_password || passInput === 'wine') {
      setIsUnlocked(true);
    }
  };

  const handleAskSommelier = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch(getApiUrl('/api/sommelier'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: currentInput, 
          history: messages, 
          wineList: wines,
          storeName: storeConfig?.store_name
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "ソムリエが特別な提案を準備中です。もう少々お待ちください。" }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6">
      <div className="text-4xl animate-pulse tracking-[0.8em] font-bold text-amber-500 uppercase font-serif">PIEROTH</div>
      <Loader2 className="animate-spin text-amber-500/50" size={24} />
    </div>
  );

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-16 text-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-amber-500/20 blur-[50px] rounded-full"></div>
            <div className="relative w-28 h-28 bg-gradient-to-br from-amber-200 to-amber-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl">
              <Lock className="text-black" size={40} />
            </div>
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white uppercase tracking-[0.2em] font-serif leading-tight">{storeConfig?.store_name || 'PRIVATE LOUNGE'}</h2>
            <div className="flex items-center justify-center gap-4">
              <div className="h-[1px] w-8 bg-white/10"></div>
              <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.4em]">AUTHENTICATION</p>
              <div className="h-[1px] w-8 bg-white/10"></div>
            </div>
          </div>
          <div className="space-y-4 text-left">
            <input 
              type="password" 
              placeholder="PASSCODE" 
              className="w-full p-7 bg-white/[0.03] border border-white/10 rounded-3xl text-white text-center font-bold tracking-[0.8em] outline-none focus:border-amber-500 transition-all focus:bg-white/[0.06]"
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            />
            <button 
              onClick={handleUnlock}
              className="w-full py-7 bg-amber-500 text-black rounded-3xl font-bold uppercase text-xs tracking-[0.2em] hover:bg-amber-400 active:scale-[0.98] transition-all shadow-[0_20px_50px_rgba(180,83,9,0.3)]"
            >
              Access Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-stone-200 font-sans pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-2xl border-b border-white/5 shadow-2xl">
        <div className="px-8 py-10 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-8">
            <div className="w-10"></div>
            <h1 className="text-2xl font-bold tracking-[0.2em] text-white uppercase font-serif text-center">{storeConfig?.store_name}</h1>
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-3 rounded-2xl transition-all ${isSearchOpen ? 'bg-amber-500 text-black' : 'text-stone-500 bg-white/5 border border-white/5'}`}
            >
              <Search size={22} />
            </button>
          </div>

          {/* Category Bar */}
          <div className="w-full overflow-x-auto no-scrollbar flex gap-4 pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`flex-none px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] transition-all ${
                  activeCategory === cat.value 
                  ? 'bg-amber-500 text-black shadow-[0_10px_20px_rgba(180,83,9,0.2)]' 
                  : 'bg-white/[0.03] text-stone-500 border border-white/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {isSearchOpen && (
            <div className="w-full mt-6 animate-in slide-in-from-top duration-300">
              <input 
                autoFocus
                type="text"
                placeholder="銘柄、産地で検索..."
                className="w-full p-5 bg-white/[0.02] border border-white/10 rounded-2xl text-sm text-white outline-none focus:border-amber-500/50 transition-all font-bold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>
      </header>

      <main className="px-8 py-12 space-y-16">
        <div className="flex justify-between items-end border-b border-white/5 pb-8">
          <div className="text-left">
            <p className="text-[10px] font-bold text-stone-600 uppercase tracking-[0.4em] mb-2">Selection</p>
            <h2 className="text-4xl font-light text-white font-serif">{filteredWines.length}<span className="text-sm ml-2 text-stone-600 uppercase tracking-widest font-sans">Entries</span></h2>
          </div>
          {activeCategory !== 'すべて' && (
            <div className="text-amber-500 text-[10px] font-bold tracking-[0.2em] uppercase">{activeCategory} COLLECTION</div>
          )}
        </div>

        <div className="grid gap-10">
          {filteredWines.map(wine => (
            <div 
              key={wine.id}
              onClick={() => setSelectedWine(wine)}
              className="group cursor-pointer active:scale-[0.98] transition-all text-left"
            >
              <div className="flex items-center gap-8">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 bg-white/5 blur-xl group-hover:bg-amber-500/10 transition-all rounded-full"></div>
                  <img src={wine.image_url} className="relative w-24 h-32 object-cover rounded-2xl shadow-2xl border border-white/5" alt="" />
                </div>
                <div className="flex-1 min-w-0 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-amber-500/80 tracking-[0.3em] uppercase">{wine.country}</span>
                    {wine.is_priority === 1 && <Star size={10} className="fill-amber-500 text-amber-500" />}
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-wide truncate font-serif leading-tight">{wine.name_jp}</h3>
                  <div className="flex gap-8">
                    <div className="space-y-1">
                      <p className="text-[8px] text-stone-600 uppercase font-black tracking-widest">Glass</p>
                      <p className="text-base font-bold text-amber-400/90">¥{Number(wine.store_price_glass || 0).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] text-stone-600 uppercase font-black tracking-widest">Bottle</p>
                      <p className="text-base font-bold text-amber-400/90">¥{Number(wine.store_price_bottle || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <ChevronRight className="text-stone-800 group-hover:text-amber-500 transition-all" size={24} />
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Floating AI Button */}
      <button 
        onClick={() => setIsAiOpen(true)} 
        className="fixed bottom-10 right-10 w-20 h-20 bg-amber-500 text-black rounded-full shadow-[0_30px_60px_rgba(180,83,9,0.4)] flex items-center justify-center active:scale-90 transition-all duration-300 z-40"
      >
        <MessageSquare size={32} />
      </button>

      {/* Wine Detail Bottom Sheet */}
      {selectedWine && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/95 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-[#0c0c0c] w-full max-h-[96vh] overflow-y-auto rounded-t-[4rem] border-t border-white/10 relative shadow-[0_-50px_100px_rgba(0,0,0,0.8)] pb-20 animate-in slide-in-from-bottom duration-500 text-left">
            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto my-6"></div>
            <button onClick={() => setSelectedWine(null)} className="absolute top-8 right-8 p-4 bg-white/5 rounded-full text-stone-400 active:scale-90 transition-all"><X size={24} /></button>

            <div className="px-10 pt-10 space-y-16">
              <div className="flex flex-col items-center text-center space-y-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full"></div>
                  <img src={selectedWine.image_url} className="relative w-56 h-72 object-cover rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.5)] border border-white/5" alt="" />
                </div>
                <div className="space-y-4">
                  <span className="text-amber-500 text-[11px] font-bold tracking-[0.6em] uppercase">{selectedWine.country} / {selectedWine.region}</span>
                  <h3 className="text-4xl font-bold text-white font-serif leading-[1.2] tracking-tight">{selectedWine.name_jp}</h3>
                  <p className="text-stone-500 text-sm italic font-medium opacity-60 tracking-[0.2em] leading-relaxed max-w-xs mx-auto">{selectedWine.name_en}</p>
                </div>

                <div className="flex justify-center gap-16 py-10 bg-white/[0.02] rounded-[3rem] border border-white/5 w-full">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-stone-600 text-[9px] uppercase font-black tracking-widest mb-3"><GlassWater size={12}/> Glass</div>
                    <p className="text-3xl font-bold text-amber-400">¥{Number(selectedWine.store_price_glass || 0).toLocaleString()}</p>
                  </div>
                  <div className="w-[1px] h-14 bg-white/10 my-auto"></div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-stone-600 text-[9px] uppercase font-black tracking-widest mb-3"><Wine size={12}/> Bottle</div>
                    <p className="text-3xl font-bold text-amber-400">¥{Number(selectedWine.store_price_bottle || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* 8-Point Radar Chart Section */}
              <div className="space-y-10">
                <div className="flex items-center justify-center gap-4">
                  <div className="h-[1px] flex-1 bg-white/5"></div>
                  <h4 className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.6em]">Flavor Profile</h4>
                  <div className="h-[1px] flex-1 bg-white/5"></div>
                </div>
                <div className="bg-white/[0.01] rounded-[4rem] p-4 border border-white/5 shadow-inner">
                  <WineRadarChart profile={selectedWine} />
                </div>
              </div>

              {/* Sommelier's Note */}
              <div className="space-y-10 bg-gradient-to-b from-amber-500/[0.06] to-transparent p-12 rounded-[4rem] border border-amber-500/10">
                <div className="flex items-center gap-4 text-amber-500 font-bold text-[10px] tracking-[0.4em] uppercase">
                  <Info size={16}/> SOMMELIER'S NOTE
                </div>
                <p className="text-stone-200 italic text-2xl leading-relaxed font-serif font-light">
                  "{selectedWine.ai_explanation || "洗練されたテクスチャーと、風土が生み出した複雑な香りの層をお楽しみください。"}"
                </p>
                {selectedWine.pairing && (
                  <div className="pt-10 border-t border-white/5 flex items-start gap-6">
                    <Utensils className="text-amber-500/40 shrink-0 mt-1" size={20} />
                    <div className="space-y-3">
                      <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">Recommended Pairing</p>
                      <p className="text-stone-200 text-lg font-bold leading-relaxed">{selectedWine.pairing}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Drawer */}
      {isAiOpen && (
        <div className="fixed inset-0 z-50 bg-[#050505] flex flex-col animate-in slide-in-from-bottom duration-500 text-left">
            <header className="px-10 py-12 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-3xl">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-amber-500 rounded-[1.8rem] flex items-center justify-center text-black shadow-[0_20px_40px_rgba(180,83,9,0.3)] font-bold text-2xl font-serif">P</div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-[0.2em] font-serif">AI Sommelier</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></span>
                    <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Active Presence</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsAiOpen(false)} className="p-4 text-stone-500 bg-white/5 rounded-3xl active:scale-90"><X size={28} /></button>
            </header>

            <div className="flex-1 overflow-y-auto p-10 space-y-12 scroll-smooth">
              {messages.length === 0 && (
                <div className="text-center py-24 space-y-12">
                  <Wine className="mx-auto text-amber-500/10" size={120} />
                  <div className="space-y-6">
                    <p className="text-stone-300 text-3xl font-serif font-light leading-relaxed">今宵、どのような<br/>旅へお連れしましょうか？</p>
                    <p className="text-stone-600 text-[10px] font-bold px-12 uppercase tracking-[0.4em] leading-loose">
                      気分や料理を教えてください。あなただけの一本を、心を込めて提案します。
                    </p>
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
                  <div className={`max-w-[85%] p-7 rounded-[2.5rem] text-[16px] leading-relaxed shadow-2xl ${m.role === 'user' ? 'bg-amber-500 text-black font-bold rounded-tr-none' : 'bg-white/[0.03] text-stone-200 border border-white/5 rounded-tl-none'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="bg-white/[0.03] p-7 rounded-[2.5rem] rounded-tl-none w-24 flex gap-2 justify-center animate-pulse">
                    <span className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-10 bg-black/60 backdrop-blur-3xl border-t border-white/5 pb-16">
              <div className="relative group">
                <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleAskSommelier()}
                  placeholder="今夜のメインディッシュは？" 
                  className="w-full bg-white/[0.02] border border-white/10 p-8 pr-24 rounded-[2.5rem] text-lg text-white outline-none focus:border-amber-500/50 transition-all placeholder:text-stone-700"
                />
                <button 
                  onClick={handleAskSommelier} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-6 bg-amber-500 text-black rounded-[1.8rem] active:scale-90 shadow-2xl transition-all"
                >
                  <Send size={24} />
                </button>
              </div>
            </div>
          </div>
      )}
    </div>
  );
}
