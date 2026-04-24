// app/[slug]/page.tsx
"use client";

export const runtime = 'edge';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, X, Send, Wine, Languages, GlassWater, Gem,
  Flame, Zap, Utensils, Info, Star, MapPin, Calendar, 
  Award, Maximize2, Search, ChevronDown, Filter, ChevronRight,
  ArrowUpNarrowWide, ArrowDownWideNarrow, Coins, Crown
} from 'lucide-react';

/**
 * プレビュー用の至高のサンプルデータ
 */
const SAMPLE_WINES = [
  {
    id: "9095472",
    name_jp: "パスカルトソ スパークリング",
    name_en: "Pascual Toso Sparkling Brut",
    country: "アルゼンチン",
    country_en: "Argentina",
    region: "メンドーサ",
    region_en: "Mendoza",
    grape: "シャルドネ",
    grape_en: "Chardonnay",
    color: "泡",
    color_en: "Sparkling",
    type: "辛口 / 爽快",
    type_en: "Dry / Fresh",
    vintage: "NV",
    price_bottle: 3800,
    price_glass: 900,
    body: 2, aroma_intensity: 4, sweetness: 1, complexity: 3, tannins: 1, finish: 3, acidity: 4, oak: 1,
    is_priority: 1,
    image_url: "https://images.unsplash.com/photo-1553361371-9bb220265263?w=800",
    menu_short: "繊細な泡立ちと澄んだ酸味。乾杯に相応しい一杯。",
    menu_short_en: "Delicate bubbles and crisp acidity. Perfect for a toast.",
    ai_explanation: "標高の高い自社畑のシャルドネ。キリッとした柑橘の酸味と、トーストの香ばしさが調和した、非常にクリーンで爽快な一杯です。",
    ai_explanation_en: "Crafted from high-altitude Chardonnay. Features sharp citrus acidity harmonized with toasty notes, delivering a clean and refreshing experience."
  },
  {
    id: "LAFITE-2018",
    name_jp: "シャトー・ラフィット 2018",
    name_en: "Chateau Lafite Rothschild",
    country: "フランス",
    country_en: "France",
    region: "ポイヤック",
    region_en: "Pauillac",
    grape: "カベルネ・ソーヴィニヨン",
    grape_en: "Cabernet Sauvignon",
    color: "赤",
    color_en: "Red",
    type: "フルボディ / 重厚",
    type_en: "Full-bodied",
    vintage: "2018",
    price_bottle: 185000,
    price_glass: 0,
    body: 5, aroma_intensity: 5, sweetness: 1, complexity: 5, tannins: 5, finish: 5, acidity: 3, oak: 4,
    is_priority: 1,
    image_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800",
    menu_short: "五大シャトーの筆頭。伝説的なヴィンテージ。",
    menu_short_en: "The first of the five great chateaux. A legendary vintage.",
    ai_explanation: "五大シャトーの筆頭。2018年は伝説的な凝縮感。絹のようなタンニンと幾重にも重なる香りは、まさにワインの王者に相応しい品格です。",
    ai_explanation_en: "The leader of the First Growths. The 2018 vintage offers legendary concentration. Silky tannins and layered aromas define the true dignity of the King of Wines."
  },
  {
    id: "9343898",
    name_jp: "パスカルトソ CS",
    name_en: "Pascual Toso CS Reserva",
    country: "アルゼンチン",
    country_en: "Argentina",
    region: "メンドーサ",
    region_en: "Mendoza",
    grape: "カベルネ・S",
    grape_en: "CS",
    color: "赤",
    color_en: "Red",
    type: "ミディアムボディ",
    type_en: "Medium-bodied",
    vintage: "2021",
    price_bottle: 5200,
    price_glass: 1200,
    body: 4, aroma_intensity: 4, sweetness: 2, complexity: 4, tannins: 4, finish: 4, acidity: 3, oak: 3,
    is_priority: 1,
    image_url: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800",
    menu_short: "芳醇なカシスとバニラ。滑らかな余韻。",
    menu_short_en: "Rich cassis and vanilla. Smooth, elegant finish.",
    ai_explanation: "完熟したカシスの香りにオークのバニラ香が溶け込んでいます。しっかりとした骨格がありながら、余韻は驚くほど滑らかです。",
    ai_explanation_en: "Aromas of ripe cassis blended with oaky vanilla. While maintaining a solid structure, the finish is surprisingly smooth."
  }
];

const getSafeUrl = (path: string) => {
  if (!path) return '#';
  if (typeof window === 'undefined') return path;
  try {
    const origin = window.location.origin;
    const baseUrl = (!origin || origin === 'null' || origin.startsWith('blob:')) ? origin : window.location.href.split('?')[0].split('#')[0];
    const safePath = path.startsWith('/') ? path : `/${path}`;
    return new URL(safePath, baseUrl).href;
  } catch (e) { return path; }
};

const translations = {
  ja: {
    loading: "至高のコレクションを準備中...",
    chat: { title: "AI Sommelier Concierge", sub: "専任ソムリエが、あなたに最適な1本をエスコートします。", placeholder: "今の気分やお料理を教えてください..." },
    aiConsult: "AIソムリエに相談",
    all: "すべて",
    labels: { 
      exclusive: "EXCLUSIVE", bottle: "BTL", glass: "GLS", searchPlaceholder: "名前、産地、品種で検索...", 
      featured: "SOMMELIER'S TOP PICKS", zoomInfo: "チャートをタップして拡大", 
      origin: "生産地", grape: "品種", color: "色", type: "タイプ",
      sort: "並び替え", priceRange: "価格帯",
      p_under5k: "5,000円以下", p_5k_10k: "5,000〜10,000円", p_10k_30k: "10,000〜30,000円", p_over30k: "30,000円以上",
      sortPriceAsc: "価格の安い順", sortPriceDesc: "価格の高い順", sortRecommend: "おすすめ順",
      viewDetail: "詳細を見る"
    },
    radar: { body: 'ボディ', aroma_intensity: '香りの強さ', sweetness: '甘味', complexity: '複雑さ', tannins: '渋み', finish: '余韻', acidity: '酸味', oak: '樽感' }
  },
  en: {
    loading: "LOADING SELECTION...",
    chat: { title: "AI Sommelier", sub: "Let our AI guide you to the perfect match.", placeholder: "Tell me about your mood..." },
    aiConsult: "Ask AI",
    all: "All",
    labels: { 
      exclusive: "EXCLUSIVE", bottle: "BTL", glass: "GLS", searchPlaceholder: "Search wines...", 
      featured: "SOMMELIER'S TOP PICKS", zoomInfo: "Tap chart to zoom", 
      origin: "Origin", grape: "Grape", color: "Color", type: "Type",
      sort: "Sort", priceRange: "Price",
      p_under5k: "Under ¥5k", p_5k_10k: "¥5k - ¥10k", p_10k_30k: "¥10k - ¥30k", p_over30k: "Over ¥30k",
      sortPriceAsc: "Price: Low to High", sortPriceDesc: "Price: High to Low", sortRecommend: "Recommended",
      viewDetail: "View Details"
    },
    radar: { body: 'Body', aroma_intensity: 'Intensity', sweetness: 'Sweetness', complexity: 'Complexity', tannins: 'Tannins', finish: 'Finish', acidity: 'Acidity', oak: 'Oak' }
  }
};

/**
 * 8項目対応フレーバーチャート
 */
function FlavorRadar({ data, lang, isLarge = false, onToggle }: { data: any, lang: 'ja' | 'en', isLarge?: boolean, onToggle?: () => void }) {
  const size = isLarge ? 280 : 160;
  const center = size / 2;
  const maxRadius = isLarge ? 90 : 45;
  const scale = (val: number) => (Math.min(Math.max(val || 3, 1), 5) / 5) * maxRadius;
  
  const tRadar = translations[lang].radar;
  const fields = [
    { key: 'body', label: tRadar.body }, { key: 'aroma_intensity', label: tRadar.aroma_intensity },
    { key: 'sweetness', label: tRadar.sweetness }, { key: 'complexity', label: tRadar.complexity },
    { key: 'tannins', label: tRadar.tannins }, { key: 'finish', label: tRadar.finish },
    { key: 'acidity', label: tRadar.acidity }, { key: 'oak', label: tRadar.oak }
  ];

  const pointsData = fields.map((f, i) => {
    const angle = (i * 45 - 90) * (Math.PI / 180);
    const r = scale(data[f.key]);
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle), label: f.label };
  });

  const pointsString = pointsData.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
      className={`relative flex items-center justify-center transition-all duration-500 ${isLarge ? 'w-full h-full' : 'w-44 h-44 group/radar cursor-pointer active:scale-95'}`}
    >
      {!isLarge && <div className="absolute inset-0 bg-amber-500/5 rounded-full blur-2xl scale-125 opacity-0 group-hover/radar:opacity-100 transition-opacity duration-1000" />}
      <svg width={size} height={size} className="relative z-10 overflow-visible">
        {[1, 2, 3, 4, 5].map(l => (
          <circle key={l} cx={center} cy={center} r={(l / 5) * maxRadius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={isLarge ? "1" : "0.5"} />
        ))}
        {fields.map((f, i) => {
          const angle = (i * 45 - 90) * (Math.PI / 180);
          const labelR = maxRadius + (isLarge ? 35 : 18);
          const x = center + labelR * Math.cos(angle);
          const y = center + labelR * Math.sin(angle);
          return (
            <React.Fragment key={i}>
              <line x1={center} y1={center} x2={center + maxRadius * Math.cos(angle)} y2={center + maxRadius * Math.sin(angle)} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
              <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" className={`fill-amber-500/60 font-black tracking-tighter uppercase ${isLarge ? 'text-[11px]' : 'text-[7px]'}`}>{f.label}</text>
            </React.Fragment>
          );
        })}
        <polygon points={pointsString} fill="rgba(245, 158, 11, 0.4)" stroke="#f59e0b" strokeWidth={isLarge ? "3" : "1.5"} className="transition-all duration-1000 ease-out" />
        {pointsData.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={isLarge ? "4" : "2"} fill="#f59e0b" className="drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
        ))}
      </svg>
      {!isLarge && <div className="absolute bottom-2 text-[6px] font-black text-white/20 uppercase tracking-widest animate-pulse">TAP TO ZOOM</div>}
    </div>
  );
}

export default function PublicMenu({ params }: { params: any }) {
  const [lang, setLang] = useState<'ja' | 'en'>('ja');
  const [wines, setWines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterColor, setFilterColor] = useState("すべて");
  const [priceRange, setPriceRange] = useState("all");
  const [sortOrder, setSortOrder] = useState("recommend");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [focusedWineId, setFocusedWineId] = useState<string | null>(null);
  const [isChartZoomed, setIsChartZoomed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [chatMsg, setChatMsg] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const t = translations[lang];
  const isJp = lang === 'ja';

  useEffect(() => {
    const resolve = async () => {
      const p = await params;
      setSlug(p?.slug || 'demo');
    };
    resolve();
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    const fetchAll = async () => {
      try {
        const res = await fetch(getSafeUrl(`/api/wines?slug=${slug}`));
        let data = res.ok ? await res.json() : [];
        setWines(data.length > 0 ? data : SAMPLE_WINES);
      } catch { setWines(SAMPLE_WINES); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [slug]);

  // 特におすすめ（トップ3）
  const topPicks = useMemo(() => {
    return wines.filter(w => w.is_priority === 1).slice(0, 3);
  }, [wines]);

  // メインリストフィルタリング
  const filteredWines = useMemo(() => {
    let res = wines.filter(w => {
      const nameMatch = isJp ? w.name_jp : w.name_en;
      const countryMatch = isJp ? w.country : (w.country_en || w.country);
      const grapeMatch = isJp ? w.grape : (w.grape_en || w.grape);
      
      const matchesSearch = searchQuery === "" || 
        nameMatch?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        countryMatch?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        grapeMatch?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesColor = filterColor === "すべて" || w.color === filterColor;

      let matchesPrice = true;
      if (priceRange === 'under5k') matchesPrice = w.price_bottle < 5000;
      else if (priceRange === '5k_10k') matchesPrice = w.price_bottle >= 5000 && w.price_bottle < 10000;
      else if (priceRange === '10k_30k') matchesPrice = w.price_bottle >= 10000 && w.price_bottle < 30000;
      else if (priceRange === 'over30k') matchesPrice = w.price_bottle >= 30000;

      return matchesSearch && matchesColor && matchesPrice;
    });

    if (sortOrder === 'priceAsc') res.sort((a, b) => (a.price_bottle || 0) - (b.price_bottle || 0));
    else if (sortOrder === 'priceDesc') res.sort((a, b) => (b.price_bottle || 0) - (a.price_bottle || 0));
    else res.sort((a, b) => (b.is_priority || 0) - (a.is_priority || 0));

    return res;
  }, [wines, searchQuery, filterColor, priceRange, sortOrder, lang, isJp]);

  const handleSend = async () => {
    if (!chatMsg.trim() || isTyping) return;
    const msg = chatMsg; setChatMsg("");
    const newH = [...history, { role: 'user', content: msg }];
    setHistory(newH); setIsTyping(true);
    try {
      const res = await fetch(getSafeUrl('/api/sommelier'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: newH, wineList: wines, language: lang })
      });
      const d = await res.json();
      setHistory([...newH, { role: 'assistant', content: d.response }]);
    } catch {
      setHistory([...newH, { role: 'assistant', content: isJp ? "申し訳ございません。" : "Sorry, I am away." }]);
    } finally { setIsTyping(false); }
  };

  if (loading || !slug) return <div className="min-h-screen bg-[#050505] flex items-center justify-center font-black text-amber-500 uppercase tracking-widest animate-pulse">{t.loading}</div>;

  const focusedWine = wines.find(w => w.id === focusedWineId);

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-amber-900/50 font-sans pb-40 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#1e1b15_0%,#050505_75%)]" />
      </div>

      <header className="relative z-50 p-5 flex justify-between items-center bg-black/40 backdrop-blur-md border-b border-white/5 sticky top-0">
        <h1 className="text-xl font-serif italic text-amber-500 tracking-tighter">Pieroth MS</h1>
        <button onClick={() => setLang(isJp ? 'en' : 'ja')} className="text-[9px] font-black tracking-[0.2em] bg-white/5 border border-white/10 px-3 py-1.5 rounded-full uppercase">
          {isJp ? 'ENGLISH' : '日本語'}
        </button>
      </header>

      {/* 1. 特におすすめ (Top Picks) */}
      {!searchQuery && topPicks.length > 0 && (
        <section className="relative z-40 py-8 px-4 space-y-6">
          <div className="flex items-center gap-2 px-2">
            <Crown size={16} className="text-amber-500" />
            <h2 className="text-[10px] font-black tracking-[0.3em] text-white/60 uppercase">{t.labels.featured}</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x px-2">
            {topPicks.map(w => (
              <div 
                key={`top-${w.id}`} 
                onClick={() => setFocusedWineId(w.id)}
                className="min-w-[280px] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-[2.5rem] p-6 snap-center relative overflow-hidden active:scale-[0.98] transition-all"
              >
                <div className="flex gap-4 h-full">
                  <div className="w-20 aspect-[1/2] shrink-0 flex items-center justify-center">
                    <img src={w.image_url} className="h-full object-contain drop-shadow-2xl" alt="" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[8px] font-black text-amber-500 uppercase tracking-widest mb-1">
                        <Gem size={10} /> {t.labels.exclusive}
                      </div>
                      <h3 className="text-sm font-bold leading-tight line-clamp-2 mb-1">{isJp ? w.name_jp : w.name_en}</h3>
                      <p className="text-[9px] text-white/40 italic line-clamp-2 leading-relaxed">{isJp ? w.menu_short : w.menu_short_en}</p>
                    </div>
                    <div className="pt-2 border-t border-white/5 flex justify-between items-end">
                      <p className="text-lg font-light italic text-amber-100">¥{Number(w.price_bottle).toLocaleString()}</p>
                      <button className="text-[7px] font-black text-white/20 uppercase tracking-widest border border-white/10 px-2 py-1 rounded-full">{t.labels.viewDetail}</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. ツールバー (検索・フィルタ・ソート) */}
      <div className="relative z-40 p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
          <input 
            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
            placeholder={t.labels.searchPlaceholder}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm font-bold outline-none focus:border-amber-500/50 transition-all"
          />
        </div>

        <div className="flex gap-2 items-center overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 pr-2 border-r border-white/10 shrink-0">
            <Filter size={14} className="text-white/40" />
            <select 
              value={sortOrder} 
              onChange={e => setSortOrder(e.target.value)}
              className="bg-transparent text-amber-500 text-[10px] font-black outline-none appearance-none"
            >
              <option value="recommend">{t.labels.sortRecommend}</option>
              <option value="priceAsc">{t.labels.sortPriceAsc}</option>
              <option value="priceDesc">{t.labels.sortPriceDesc}</option>
            </select>
          </div>
          <div className="flex gap-2">
            {["すべて", "赤", "白", "ロゼ", "泡"].map(c => (
              <button 
                key={c} 
                onClick={() => setFilterColor(c)} 
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${filterColor === c ? "bg-amber-500 border-amber-500 text-black" : "bg-white/5 border-white/10 text-white/40"}`}
              >
                {c === "すべて" ? t.all : c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 items-center overflow-x-auto no-scrollbar">
          <Coins size={14} className="text-white/40 shrink-0" />
          {[
            { id: 'all', label: t.all },
            { id: 'under5k', label: t.labels.p_under5k },
            { id: '5k_10k', label: t.labels.p_5k_10k },
            { id: '10k_30k', label: t.labels.p_10k_30k },
            { id: 'over30k', label: t.labels.p_over30k }
          ].map(p => (
            <button 
              key={p.id} 
              onClick={() => setPriceRange(p.id)} 
              className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-[9px] font-black border transition-all ${priceRange === p.id ? "bg-white/10 border-white text-white shadow-lg" : "bg-white/5 border-white/5 text-white/30"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. メインリスト */}
      <div className="relative z-10 px-4 space-y-1 mt-2">
        {filteredWines.length === 0 ? (
          <div className="py-20 text-center text-white/20 font-serif italic">No wines match your selection...</div>
        ) : (
          filteredWines.map(w => (
            <div 
              key={w.id} 
              onClick={() => setFocusedWineId(w.id)}
              className="group flex items-center gap-4 bg-white/[0.02] active:bg-white/[0.08] border border-white/5 rounded-2xl p-4 transition-all duration-300 relative overflow-hidden"
            >
              {w.is_priority === 1 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-white/5 ${
                w.color === '赤' ? 'bg-red-950/40 text-red-500' : 
                w.color === '白' ? 'bg-yellow-950/40 text-yellow-500' : 
                w.color === '泡' ? 'bg-amber-950/40 text-amber-500' : 'bg-slate-800'
              }`}>
                <Wine size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[8px] font-black text-amber-500/60 uppercase tracking-widest">{isJp ? w.country : (w.country_en || w.country)}</span>
                  <span className="text-[8px] font-bold text-white/30 truncate">{isJp ? w.grape : (w.grape_en || w.grape)}</span>
                </div>
                <h3 className="text-[13px] font-bold truncate leading-tight group-active:text-amber-200">{isJp ? w.name_jp : (w.name_en || w.name_jp)}</h3>
                <p className="text-[9px] text-white/40 font-medium truncate mt-0.5">{isJp ? (w.menu_short || w.type) : (w.menu_short_en || w.type_en || w.type)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-light italic text-amber-100 leading-none">¥{Number(w.price_bottle).toLocaleString()}</p>
                {w.price_glass > 0 && <p className="text-[9px] text-amber-500/60 font-black mt-1 uppercase">GLS ¥{w.price_glass}</p>}
              </div>
              <ChevronRight size={16} className="text-white/10" />
            </div>
          ))
        )}
      </div>

      {/* 詳細モーダル (カード表示) */}
      {focusedWineId && focusedWine && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-2xl flex items-end animate-in fade-in slide-in-from-bottom-20 duration-500" onClick={() => setFocusedWineId(null)}>
          <div className="w-full bg-[#080808] rounded-t-[3rem] border-t border-white/10 p-8 pt-10 pb-12 relative shadow-[0_-40px_100px_rgba(0,0,0,0.8)] overflow-y-auto max-h-[90vh] no-scrollbar" onClick={e => e.stopPropagation()}>
            <button onClick={() => setFocusedWineId(null)} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full transition-all active:scale-90"><X size={20}/></button>
            <div className="flex gap-6 items-start mb-8">
              <div className="w-28 aspect-[3/5] bg-white/[0.02] border border-white/5 rounded-3xl flex items-center justify-center p-3 relative shrink-0">
                <img src={focusedWine.image_url} className="h-full object-contain drop-shadow-2xl" alt="" />
                {focusedWine.is_priority === 1 && <div className="absolute top-2 left-2 bg-amber-500 text-black text-[7px] font-black px-2 py-0.5 rounded-full uppercase shadow-lg">Exclusive</div>}
              </div>
              <div className="flex-1 min-w-0 pt-2 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-amber-500 uppercase">
                    <MapPin size={10} /> {isJp ? focusedWine.country : (focusedWine.country_en || focusedWine.country)} <span className="text-white/20">•</span> {focusedWine.vintage}
                  </div>
                  <h2 className="text-2xl font-serif text-white leading-tight">{isJp ? focusedWine.name_jp : (focusedWine.name_en || focusedWine.name_jp)}</h2>
                  <p className="text-[10px] text-white/40 italic font-serif leading-tight">{isJp ? focusedWine.menu_short : focusedWine.menu_short_en}</p>
                </div>
                <div className="flex items-end gap-6 pt-1">
                  <div><span className="text-[8px] text-white/30 font-black uppercase tracking-widest">{t.labels.bottle}</span><p className="text-3xl font-light text-amber-100 italic">¥{Number(focusedWine.price_bottle).toLocaleString()}</p></div>
                  {focusedWine.price_glass > 0 && <div><span className="text-[8px] text-white/30 font-black uppercase tracking-widest">{t.labels.glass}</span><p className="text-xl font-light text-amber-100/60 italic">¥{Number(focusedWine.price_glass).toLocaleString()}</p></div>}
                </div>
              </div>
            </div>
            <div className="space-y-8 border-t border-white/5 pt-8">
              <div className="bg-white/[0.03] border-l-2 border-amber-500/40 p-6 rounded-r-3xl">
                <p className="text-[13px] text-white/80 leading-relaxed font-serif italic tracking-wide">
                  {isJp ? focusedWine.ai_explanation : (focusedWine.ai_explanation_en || focusedWine.ai_explanation)}
                </p>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="text-[10px] font-black text-white/20 tracking-[0.3em] uppercase">{t.labels.zoomInfo}</div>
                <FlavorRadar data={focusedWine} lang={lang} onToggle={() => setIsChartZoomed(true)} />
              </div>
              <div className="flex flex-wrap gap-2 justify-center pb-10">
                <span className="px-4 py-1.5 rounded-full text-[9px] font-black border border-white/10 bg-white/5 text-white/40 tracking-widest uppercase">{isJp ? focusedWine.grape : (focusedWine.grape_en || focusedWine.grape)}</span>
                <span className="px-4 py-1.5 rounded-full text-[9px] font-black border border-white/10 bg-white/5 text-white/40 tracking-widest uppercase">{isJp ? focusedWine.color : (focusedWine.color_en || focusedWine.color)}</span>
                <span className="px-4 py-1.5 rounded-full text-[9px] font-black border border-white/10 bg-white/5 text-white/40 tracking-widest uppercase">{isJp ? focusedWine.type : (focusedWine.type_en || focusedWine.type)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* チャート拡大モード */}
      {isChartZoomed && focusedWine && (
        <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-300" onClick={() => setIsChartZoomed(false)}>
          <div className="text-center mb-10 space-y-2">
            <p className="text-[10px] font-black text-amber-500 tracking-[0.4em] uppercase">{isJp ? focusedWine.country : focusedWine.country_en}</p>
            <h3 className="text-2xl font-serif text-white">{isJp ? focusedWine.name_jp : focusedWine.name_en}</h3>
          </div>
          <div className="w-full aspect-square max-w-[320px] bg-white/[0.02] rounded-full p-4 flex items-center justify-center border border-white/5 shadow-[0_0_100px_rgba(245,158,11,0.1)]">
            <FlavorRadar data={focusedWine} lang={lang} isLarge={true} />
          </div>
          <p className="mt-12 text-[10px] text-white/40 font-bold uppercase tracking-widest animate-pulse text-center px-4">TAP ANYWHERE TO CLOSE</p>
          <button className="mt-8 p-4 bg-white/10 rounded-full text-white/60 active:scale-90 transition-all"><X size={24}/></button>
        </div>
      )}

      {/* スリム AIボタン */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[180px] pointer-events-none">
        <button 
          onClick={() => setIsChatOpen(true)}
          className="pointer-events-auto w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-700/90 to-amber-900/90 text-white rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.8)] border border-white/10 active:scale-95 transition-all group overflow-hidden"
        >
          <Sparkles size={16} className="text-amber-200 animate-pulse" />
          <span className="text-[9px] font-black tracking-[0.15em] uppercase">{t.aiConsult}</span>
        </button>
      </div>

      {/* チャットモーダル */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[500] bg-black/98 backdrop-blur-3xl flex flex-col animate-in fade-in duration-700">
          <div className="p-8 flex justify-between items-center border-b border-white/5">
            <div><div className="flex items-center gap-2 mb-1"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" /><h3 className="text-xl font-serif italic text-amber-500">{t.chat.title}</h3></div><p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-black">{t.chat.sub}</p></div>
            <button onClick={() => setIsChatOpen(false)} className="p-3 bg-white/5 rounded-full text-white/40 active:scale-90 transition-all"><X size={24}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4"><Wine size={48} className="text-amber-500" /><p className="text-xl font-serif italic">{t.chat.sub}</p></div>
            ) : (
              history.map((h, i) => (
                <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4`}>
                  <div className={`max-w-[85%] p-6 rounded-[2rem] text-[13px] shadow-xl ${h.role === 'user' ? 'bg-amber-700 text-white font-bold border border-white/10' : 'bg-white/[0.05] text-amber-50 font-serif italic border border-white/5'}`}>{h.content}</div>
                </div>
              ))
            )}
            {isTyping && <div className="bg-white/5 w-12 p-3 rounded-full animate-pulse flex gap-1 justify-center"><div className="w-1 h-1 bg-amber-500 rounded-full animate-bounce" /><div className="w-1 h-1 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]" /></div>}
          </div>
          <div className="p-8 pb-12 bg-black/40 border-t border-white/5">
            <div className="relative max-w-2xl mx-auto">
              <input type="text" value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder={t.chat.placeholder} className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-8 pr-20 outline-none focus:border-amber-500/50 font-bold text-sm shadow-inner" />
              <button onClick={handleSend} disabled={!chatMsg.trim() || isTyping} className="absolute right-3 top-1/2 -translate-y-1/2 bg-amber-500 text-black p-3 rounded-full active:scale-90 disabled:opacity-30 shadow-lg"><Send size={18}/></button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
