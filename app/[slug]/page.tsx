// app/[slug]/page.tsx
"use client";

export const runtime = 'edge';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, X, Send, Wine, Languages, GlassWater, Gem,
  Flame, Zap, Utensils, Star, MapPin, Calendar, 
  Award, Maximize2, Search, ChevronDown, Filter, ChevronRight,
  Crown, Coins
} from 'lucide-react';

const getSafeUrl = (path: string) => {
  if (!path) return '#';
  if (typeof window === 'undefined') return path;
  try {
    const origin = window.location.origin;
    const baseUrl = (!origin || origin === 'null' || origin.startsWith('blob:')) ? window.location.href.split('?')[0].split('#')[0] : origin;
    const safePath = path.startsWith('/') ? path : `/${path}`;
    return new URL(safePath, baseUrl).href;
  } catch (e) { return path; }
};

const SAMPLE_WINES = [
  { id: "S1", name_jp: "パスカルトソ スパークリング", name_en: "Pascual Toso Sparkling", country: "アルゼンチン", grape: "シャルドネ", color: "泡", type: "辛口 / 爽快", price_bottle: 3800, is_priority: 1, body: 2, aroma_intensity: 4, sweetness: 1, complexity: 3, tannins: 1, finish: 3, acidity: 4, oak: 1, image_url: "https://images.unsplash.com/photo-1553361371-9bb220265263?w=800", ai_explanation: "標高の高い自社畑のシャルドネ。キリッとした柑橘の酸味と、トーストの香ばしさが調和した、非常にクリーンで爽快な一杯です。", menu_short: "繊細な泡立ちと澄んだ酸味。" },
  { id: "S2", name_jp: "シャトー・ラフィット 2018", name_en: "Chateau Lafite 2018", country: "フランス", grape: "カベルネ・S", color: "赤", type: "フルボディ", price_bottle: 185000, is_priority: 1, body: 5, aroma_intensity: 5, sweetness: 1, complexity: 5, tannins: 5, finish: 5, acidity: 3, oak: 4, image_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800", ai_explanation: "五大シャトーの筆頭。絹のようなタンニンと幾重にも重なる香りは、まさにワインの王者に相応しい品格です。", menu_short: "伝説的なヴィンテージ。" }
];

const translations = {
  ja: { loading: "至高のセレクションを準備中...", aiConsult: "AIソムリエに相談", featured: "RECOMMENDED", labels: { bottle: "BTL", glass: "GLS", exclusive: "EXCLUSIVE", zoom: "タップで拡大" }, radar: { body: 'ボディ', aroma_intensity: '香り', sweetness: '甘味', complexity: '複雑さ', tannins: '渋み', finish: '余韻', acidity: '酸味', oak: '樽感' } },
  en: { loading: "Preparing collection...", aiConsult: "Ask AI Sommelier", featured: "RECOMMENDED", labels: { bottle: "BTL", glass: "GLS", exclusive: "EXCLUSIVE", zoom: "Tap to zoom" }, radar: { body: 'Body', aroma_intensity: 'Aroma', sweetness: 'Sweet', complexity: 'Complex', tannins: 'Tannin', finish: 'Finish', acidity: 'Acid', oak: 'Oak' } }
};

function FlavorRadar({ data, lang, isLarge = false, onToggle }: { data: any, lang: 'ja' | 'en', isLarge?: boolean, onToggle?: () => void }) {
  const size = isLarge ? 280 : 160;
  const center = size / 2;
  const maxRadius = isLarge ? 90 : 45;
  const scale = (val: number) => (Math.min(Math.max(Number(val) || 3, 1), 5) / 5) * maxRadius;
  const tRadar = translations[lang].radar;
  const fields = [{ key: 'body', label: tRadar.body }, { key: 'aroma_intensity', label: tRadar.aroma_intensity }, { key: 'sweetness', label: tRadar.sweetness }, { key: 'complexity', label: tRadar.complexity }, { key: 'tannins', label: tRadar.tannins }, { key: 'finish', label: tRadar.finish }, { key: 'acidity', label: tRadar.acidity }, { key: 'oak', label: tRadar.oak }];
  const points = fields.map((f, i) => { const angle = (i * 45 - 90) * (Math.PI / 180); const r = scale(data[f.key]); return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) }; });
  return (
    <div onClick={(e) => { e.stopPropagation(); onToggle?.(); }} className={`relative flex items-center justify-center transition-all ${isLarge ? 'w-full h-full' : 'w-44 h-44 group/radar cursor-pointer active:scale-95'}`}>
      <svg width={size} height={size} className="relative z-10 overflow-visible">
        {[1, 2, 3, 4, 5].map(l => (<circle key={l} cx={center} cy={center} r={(l / 5) * maxRadius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />))}
        {fields.map((f, i) => { const angle = (i * 45 - 90) * (Math.PI / 180); const x = center + (maxRadius + (isLarge ? 35 : 18)) * Math.cos(angle); const y = center + (maxRadius + (isLarge ? 35 : 18)) * Math.sin(angle); return (<React.Fragment key={i}><line x1={center} y1={center} x2={center + maxRadius * Math.cos(angle)} y2={center + maxRadius * Math.sin(angle)} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" /><text x={x} y={y} textAnchor="middle" dominantBaseline="middle" className={`fill-amber-500/60 font-black tracking-tighter uppercase ${isLarge ? 'text-[11px]' : 'text-[7px]'}`}>{f.label}</text></React.Fragment>); })}
        <polygon points={points.map(p => `${p.x},${p.y}`).join(' ')} fill="rgba(245, 158, 11, 0.4)" stroke="#f59e0b" strokeWidth="2" />
        {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2" fill="#f59e0b" />)}
      </svg>
      {!isLarge && <div className="absolute bottom-2 text-[6px] font-black text-white/20 uppercase tracking-widest animate-pulse">TAP TO ZOOM</div>}
    </div>
  );
}

export default function PublicMenu({ params }: { params: any }) {
  const [lang, setLang] = useState<'ja' | 'en'>('ja');
  const [wines, setWines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusedWineId, setFocusedWineId] = useState<string | null>(null);
  const [isChartZoomed, setIsChartZoomed] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const t = translations[lang];

  useEffect(() => { const resolve = async () => { const p = await params; setSlug(p?.slug || 'demo'); }; resolve(); }, [params]);
  useEffect(() => {
    if (!slug) return;
    fetch(getSafeUrl(`/api/wines?slug=${slug}`)).then(res => res.json()).then(data => setWines(data.length > 0 ? data : SAMPLE_WINES)).catch(() => setWines(SAMPLE_WINES)).finally(() => setLoading(false));
  }, [slug]);

  const focusedWine = wines.find(w => w.id === focusedWineId);
  const isJp = lang === 'ja';

  if (loading || !slug) return <div className="min-h-screen bg-[#050505] flex items-center justify-center font-black text-amber-500 uppercase tracking-widest animate-pulse">{t.loading}</div>;

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans pb-40 overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e1b15_0%,#050505_75%)] pointer-events-none" />
      <header className="relative z-50 p-5 flex justify-between items-center bg-black/40 backdrop-blur-md border-b border-white/5 sticky top-0"><h1 className="text-xl font-serif italic text-amber-500 tracking-tighter">Pieroth MS</h1><button onClick={() => setLang(isJp ? 'en' : 'ja')} className="text-[9px] font-black tracking-[0.2em] bg-white/5 border border-white/10 px-3 py-1.5 rounded-full uppercase">{isJp ? 'ENGLISH' : '日本語'}</button></header>

      {/* 特におすすめ */}
      {!focusedWineId && (
        <section className="relative z-40 p-4 space-y-6">
          <div className="flex items-center gap-2 px-2 text-amber-500/60 font-black text-[10px] tracking-[0.3em]"><Crown size={16}/> {t.featured}</div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x px-2">
            {wines.filter(w => w.is_priority === 1).slice(0, 3).map(w => (
              <div key={`top-${w.id}`} onClick={() => setFocusedWineId(w.id)} className="min-w-[280px] bg-white/[0.05] border border-white/10 rounded-[2.5rem] p-6 snap-center flex gap-4 active:scale-95 transition-all">
                <img src={w.image_url} className="w-20 aspect-[1/2] object-contain drop-shadow-2xl" alt="" />
                <div className="flex flex-col justify-between"><h3 className="text-sm font-bold leading-tight line-clamp-2">{isJp ? w.name_jp : w.name_en}</h3><p className="text-lg font-light italic text-amber-100 mt-2">¥{Number(w.price_bottle).toLocaleString()}</p></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* リスト表示 */}
      <div className="relative z-10 px-4 space-y-1 mt-6">
        {wines.map(w => (
          <div key={w.id} onClick={() => setFocusedWineId(w.id)} className="flex items-center gap-4 bg-white/[0.02] active:bg-white/[0.08] border border-white/5 rounded-2xl p-4 transition-all">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-white/5 ${w.color === '赤' ? 'bg-red-950/40 text-red-500' : 'bg-amber-950/40 text-amber-500'}`}><Wine size={18} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[8px] font-black text-amber-500/60 uppercase tracking-widest">{isJp ? w.country : w.country_en}</div>
              <h3 className="text-[13px] font-bold truncate leading-tight">{isJp ? w.name_jp : w.name_en}</h3>
            </div>
            <div className="text-right text-sm font-light italic text-amber-100">¥{Number(w.price_bottle).toLocaleString()}</div>
            <ChevronRight size={16} className="text-white/10" />
          </div>
        ))}
      </div>

      {/* 詳細モーダル */}
      {focusedWineId && focusedWine && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-2xl flex items-end animate-in slide-in-from-bottom-20 duration-500" onClick={() => setFocusedWineId(null)}>
          <div className="w-full bg-[#080808] rounded-t-[3rem] border-t border-white/10 p-8 pt-10 pb-12 overflow-y-auto max-h-[90vh] no-scrollbar" onClick={e => e.stopPropagation()}>
            <button onClick={() => setFocusedWineId(null)} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full"><X size={20}/></button>
            <div className="flex gap-6 items-start mb-8">
              <img src={focusedWine.image_url} className="w-28 aspect-[3/5] object-contain drop-shadow-2xl" alt="" />
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-amber-500 uppercase"><MapPin size={10} /> {isJp ? focusedWine.country : focusedWine.country_en} <span className="text-white/20">•</span> {focusedWine.vintage}</div>
                <h2 className="text-2xl font-serif text-white leading-tight">{isJp ? focusedWine.name_jp : focusedWine.name_en}</h2>
                <p className="text-3xl font-light text-amber-100 italic">¥{Number(focusedWine.price_bottle).toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-8 border-t border-white/5 pt-8">
              <div className="bg-white/[0.03] border-l-2 border-amber-500/40 p-6 rounded-r-3xl text-[13px] text-white/80 leading-relaxed italic">{focusedWine.ai_explanation}</div>
              <div className="flex flex-col items-center gap-4"><FlavorRadar data={focusedWine} lang={lang} onToggle={() => setIsChartZoomed(true)} /></div>
              <div className="flex flex-wrap gap-2 justify-center"><span className="px-4 py-1.5 rounded-full text-[9px] font-black border border-white/10 bg-white/5 text-white/40 tracking-widest uppercase">{focusedWine.grape}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* チャート拡大 */}
      {isChartZoomed && focusedWine && (
        <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-300" onClick={() => setIsChartZoomed(false)}>
          <h3 className="text-2xl font-serif text-white mb-10">{isJp ? focusedWine.name_jp : focusedWine.name_en}</h3>
          <div className="w-full aspect-square max-w-[320px] bg-white/[0.02] rounded-full p-4 flex items-center justify-center border border-white/5"><FlavorRadar data={focusedWine} lang={lang} isLarge={true} /></div>
          <p className="mt-12 text-[10px] text-white/40 font-bold uppercase tracking-widest animate-pulse">TAP ANYWHERE TO CLOSE</p>
        </div>
      )}

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[180px] pointer-events-auto flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-700 to-amber-900 text-white rounded-full shadow-2xl border border-white/10 active:scale-95 transition-all">
        <Sparkles size={16} className="text-amber-200 animate-pulse" /><span className="text-[9px] font-black tracking-widest uppercase">{t.aiConsult}</span>
      </div>
    </main>
  );
}
