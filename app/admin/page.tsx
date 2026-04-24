// app/admin/page.tsx
"use client";

export const runtime = 'edge';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, Plus, Search, Database, LayoutDashboard, LogOut, 
  ExternalLink, Settings, QrCode, X, Loader2, ArrowLeft, 
  CheckCircle2, AlertCircle, Save, Wine, Palette, 
  Eye, EyeOff, Sparkles, Trash2, ChevronRight, RefreshCw,
  Building2, Globe, ArrowRight, LayoutGrid, Copy, Coins, 
  Filter, Crown, Award, Calendar, MapPin, Star, Check,
  GlassWater, Edit3, Lock, Share2
} from 'lucide-react';

/**
 * プレビュー環境（Cloudflare Sandbox）でのURL解析エラーを回避するための堅牢なヘルパー
 */
const getSafeUrl = (path: string) => {
  if (!path || path.startsWith('http')) return path;
  if (typeof window === 'undefined') return path;
  try {
    const origin = window.location.origin;
    const baseUrl = (!origin || origin === 'null' || origin.startsWith('blob:')) 
      ? window.location.href.split('?')[0].split('#')[0]
      : origin;
    const safePath = path.startsWith('/') ? path : `/${path}`;
    return new URL(safePath, baseUrl).href;
  } catch (e) { return path; }
};

/**
 * データベースが空の場合のプレビュー用データ
 */
const FALLBACK_MASTER = [
  { id: "P-9095472", name_jp: "パスカルトソ スパークリング", name_en: "Pascual Toso Sparkling", country: "アルゼンチン", grape: "シャルドネ", price_bottle: 3800, body: 2, aroma_intensity: 4, sweetness: 1, complexity: 3, tannins: 1, finish: 3, acidity: 4, oak: 1, image_url: "https://images.unsplash.com/photo-1553361371-9bb220265263?w=400" },
  { id: "P-9343898", name_jp: "パスカルトソ CS レゼルヴァ", name_en: "Pascual Toso CS Reserva", country: "アルゼンチン", grape: "カベルネ・S", price_bottle: 5200, body: 4, aroma_intensity: 4, sweetness: 2, complexity: 4, tannins: 4, finish: 4, acidity: 3, oak: 3, image_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400" }
];

const translations = {
  ja: {
    dashboard: "ダッシュボード", stores: "店舗一覧", master: "カタログ", inventory: "在庫・価格管理",
    loading: "同期中...", all: "すべて", searchPlaceholder: "店舗名で検索...",
    wineSearchPlaceholder: "銘柄名、ID、産地で検索...", langName: "日本語",
    labels: {
      exclusive: "EXCLUSIVE", bottle: "ボトル(¥)", glass: "グラス(¥)", stock: "在庫(本)",
      reflectBtn: "メニューに反映する", syncSuccess: "反映が完了しました", partnerAccess: "店舗ログイン設定",
      partnerPass: "アクセスパスワード", partnerUrl: "店舗用管理URL", copy: "コピー",
      select: "採用する", selected: "採用中"
    },
    radar: { body: 'ボディ', aroma_intensity: '香りの強さ', sweetness: '甘味', complexity: '複雑さ', tannins: '渋み', finish: '余韻', acidity: '酸味', oak: '樽感' }
  },
  en: {
    dashboard: "Dashboard", stores: "Stores", master: "Catalog", inventory: "Inventory",
    loading: "Syncing...", all: "All", searchPlaceholder: "Search...",
    wineSearchPlaceholder: "Search wines...", langName: "ENG",
    labels: {
      exclusive: "EXCLUSIVE", bottle: "Bottle(¥)", glass: "Glass(¥)", stock: "Stock",
      reflectBtn: "Reflect to Menu", syncSuccess: "Success", partnerAccess: "Partner Setup",
      partnerPass: "Password", partnerUrl: "Portal URL", copy: "Copy",
      select: "Select", selected: "Selected"
    },
    radar: { body: 'Body', aroma_intensity: 'Intensity', sweetness: 'Sweetness', complexity: 'Complexity', tannins: 'Tannins', finish: 'Finish', acidity: 'Acidity', oak: 'Oak' }
  }
};

function AdminFlavorRadar({ data, lang }: { data: any, lang: 'ja' | 'en' }) {
  const size = 120;
  const center = size / 2;
  const maxRadius = 35;
  const scale = (val: number) => (Math.min(Math.max(Number(val) || 3, 1), 5) / 5) * maxRadius;
  const tRadar = translations[lang].radar;
  const fields = [
    { key: 'body', label: tRadar.body }, { key: 'aroma_intensity', label: tRadar.aroma_intensity },
    { key: 'sweetness', label: tRadar.sweetness }, { key: 'complexity', label: tRadar.complexity },
    { key: 'tannins', label: tRadar.tannins }, { key: 'finish', label: tRadar.finish },
    { key: 'acidity', label: tRadar.acidity }, { key: 'oak', label: tRadar.oak }
  ];
  const points = fields.map((f, i) => {
    const angle = (i * 45 - 90) * (Math.PI / 180);
    const r = scale(data[f.key]);
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  });
  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-2xl border border-slate-100 shrink-0">
      <svg width={size} height={size} className="overflow-visible">
        {[1, 2, 3, 4, 5].map(l => (
          <circle key={l} cx={center} cy={center} r={(l / 5) * maxRadius} fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="0.5" />
        ))}
        {fields.map((f, i) => {
          const angle = (i * 45 - 90) * (Math.PI / 180);
          const x = center + (maxRadius + 12) * Math.cos(angle);
          const y = center + (maxRadius + 12) * Math.sin(angle);
          return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-slate-400 font-bold text-[5px] uppercase">{f.label}</text>;
        })}
        <polygon points={polygonPoints} fill="rgba(180, 83, 9, 0.2)" stroke="#b45309" strokeWidth="1.5" />
        {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="#b45309" />)}
      </svg>
    </div>
  );
}

function InventoryView({ store, lang, onBack }: { store: any, lang: 'ja' | 'en', onBack: () => void }) {
  const [masterWines, setMasterWines] = useState<any[]>([]);
  const [inventory, setInventory] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [mRes, sRes] = await Promise.all([
          fetch(getSafeUrl('/api/master/list')),
          fetch(getSafeUrl(`/api/wines?slug=${store.slug}`))
        ]);
        const mData = mRes.ok ? await mRes.json() : [];
        const sData = sRes.ok ? await sRes.json() : [];
        setMasterWines(mData.length > 0 ? mData : FALLBACK_MASTER);
        const invMap: Record<string, any> = {};
        sData.forEach((w: any) => { 
          invMap[w.id] = { active: true, price_bottle: w.price_bottle, price_glass: w.price_glass || 0, stock: w.stock || 0 }; 
        });
        setInventory(invMap);
      } catch { setMasterWines(FALLBACK_MASTER); }
      setLoading(false);
    };
    fetchData();
  }, [store.slug]);

  const handleToggle = async (wineId: string) => {
    try {
      const res = await fetch(getSafeUrl('/api/store/inventory/toggle'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: store.slug, wineId })
      });
      if (res.ok) {
        setInventory(prev => {
          const next = { ...prev };
          if (next[wineId]) delete next[wineId];
          else {
            const m = masterWines.find(x => x.id === wineId);
            next[wineId] = { active: true, price_bottle: m?.price_bottle || 0, price_glass: 0, stock: 0 };
          }
          return next;
        });
      }
    } catch (e) { console.error(e); }
  };

  const handleReflect = async () => {
    setSyncing(true);
    const updates = Object.entries(inventory).map(([id, data]) => {
      return fetch(getSafeUrl('/api/store/inventory/update'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: store.slug, wineId: id, ...data })
      });
    });
    await Promise.all(updates);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setSyncing(false);
  };

  const filtered = masterWines.filter(w => (w.name_jp || "").includes(search) || (w.id || "").includes(search));

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-40">
      <div className="flex items-center gap-4 px-2 pt-4">
        <button onClick={onBack} className="p-3 bg-white shadow-sm border border-slate-200 rounded-full text-slate-400 active:scale-90"><ArrowLeft size={20}/></button>
        <div><h2 className="text-xl font-black text-slate-900 truncate max-w-[200px]">{store.store_name}</h2><p className="text-[10px] font-bold text-amber-600 uppercase mt-1">{t.inventory}</p></div>
      </div>
      <div className="relative group mx-2">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t.wineSearchPlaceholder} className="w-full h-14 pl-14 pr-6 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 ring-amber-500/5 transition-all shadow-sm shadow-slate-100" />
      </div>

      <div className="grid gap-4 px-2">
        {loading ? <div className="py-24 text-center font-black text-slate-200 animate-pulse">{t.loading}</div> : 
        filtered.map(w => {
          const inv = inventory[w.id];
          const isActive = !!inv;
          return (
            <div key={w.id} className={`bg-white border-2 rounded-[2.5rem] p-5 transition-all duration-300 ${isActive ? 'border-amber-500 shadow-xl shadow-amber-900/5' : 'border-slate-100 opacity-60 grayscale-[0.5]'}`}>
              <div className="flex items-start gap-4">
                <div className="w-16 h-24 bg-slate-50 rounded-2xl flex items-center justify-center p-2 relative shrink-0 shadow-inner overflow-hidden border border-slate-100"><img src={w.image_url} className="h-full object-contain" alt="" onError={(e:any)=>e.target.src='https://placehold.co/100x150?text=WINE'} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1"><span className="text-[8px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">ID: {w.id}</span><span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">{lang === 'ja' ? w.country : w.country_en}</span></div>
                  <h4 className="text-sm font-black text-slate-800 truncate leading-tight mb-3">{lang === 'ja' ? w.name_jp : w.name_en}</h4>
                  <button onClick={() => handleToggle(w.id)} className={`h-10 px-4 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${isActive ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{isActive ? <Check size={14} strokeWidth={4}/> : <Plus size={14} strokeWidth={4}/>} {isActive ? t.labels.selected : t.labels.select}</button>
                </div>
                <AdminFlavorRadar data={w} lang={lang} />
              </div>
              {isActive && (
                <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1.5"><label className="text-[8px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><Coins size={10}/> {t.labels.bottle}</label><input type="number" value={inv.price_bottle || 0} onChange={e => setInventory({...inventory, [w.id]: {...inv, price_bottle: parseInt(e.target.value)}})} className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-3 text-xs font-black outline-none focus:ring-2 ring-amber-500/20" /></div>
                  <div className="space-y-1.5"><label className="text-[8px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><GlassWater size={10}/> {t.labels.glass}</label><input type="number" value={inv.price_glass || 0} onChange={e => setInventory({...inventory, [w.id]: {...inv, price_glass: parseInt(e.target.value)}})} className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-3 text-xs font-black outline-none focus:ring-2 ring-amber-500/20" /></div>
                  <div className="space-y-1.5"><label className="text-[8px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><Database size={10}/> {t.labels.stock}</label><input type="number" value={inv.stock || 0} onChange={e => setInventory({...inventory, [w.id]: {...inv, stock: parseInt(e.target.value)}})} className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-3 text-xs font-black outline-none focus:ring-2 ring-amber-500/20" /></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] w-[260px] pointer-events-none">
        <button onClick={handleReflect} disabled={syncing} className={`pointer-events-auto w-full h-18 rounded-full flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 border-b-4 ${showSuccess ? 'bg-emerald-500 border-emerald-700 text-white' : 'bg-slate-900 border-black text-white'}`}>
          {syncing ? <Loader2 className="animate-spin" size={20}/> : showSuccess ? <CheckCircle2 size={20}/> : <Sparkles size={20} className="text-amber-500" />}
          {showSuccess ? t.labels.syncSuccess : t.labels.reflectBtn}
        </button>
      </div>
    </div>
  );
}

export default function AdminApp() {
  const [lang, setLang] = useState<'ja' | 'en'>('ja');
  const [view, setView] = useState<'stores' | 'inventory' | 'settings'>('stores');
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStore, setActiveStore] = useState<any | null>(null);
  const t = translations[lang];

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await fetch(getSafeUrl('/api/store/list'));
      if (res.ok) setStores(await res.json());
      else throw new Error();
    } catch { setStores([{ slug: 'pieroth-hibiya', store_name: '日比谷サンプル店', theme_color: '#b45309', access_password: 'pass' }]); }
    setLoading(false);
  };

  useEffect(() => { fetchStores(); }, []);

  if (view === 'inventory' && activeStore) return <main className="min-h-screen bg-slate-50 font-sans"><div className="max-w-2xl mx-auto"><InventoryView store={activeStore} lang={lang} onBack={() => { setView('stores'); setActiveStore(null); fetchStores(); }} /></div></main>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased overflow-x-hidden pb-40 selection:bg-amber-100">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-[100] shadow-sm">
        <h1 className="text-base font-black italic text-slate-900 uppercase tracking-tighter">PIEROTH <span className="font-light text-slate-400">MS</span></h1>
        <div className="flex gap-2">
          <button onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')} className="text-[9px] font-black tracking-[0.1em] bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full uppercase active:scale-95 shadow-sm">{t.langName}</button>
          <button onClick={() => window.location.href='/admin/login'} className="p-2.5 bg-red-50 text-red-500 rounded-full active:scale-90 border border-red-100"><LogOut size={18} /></button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-5 space-y-10 relative z-10">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-2xl font-black text-slate-900 leading-tight">{t.stores}</h2>
          <button onClick={() => window.location.href=getSafeUrl('/admin/settings')} className="w-12 h-12 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90"><Plus size={24} strokeWidth={3} /></button>
        </div>

        <div className="grid gap-4">
          {stores.map(store => (
            <div key={store.slug} className="group bg-white border border-slate-200 rounded-[2.2rem] p-5 hover:border-amber-500/30 transition-all shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-900/5" style={{ backgroundColor: store.theme_color || '#b45309' }}><Store size={28} /></div>
                  <div className="min-w-0 flex-1"><h3 className="text-lg font-black text-slate-900 group-hover:text-amber-600 truncate">{store.store_name}</h3><p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">/{store.slug}</p></div>
                </div>
                <div className="flex gap-1"><button onClick={() => { setActiveStore(store); setView('inventory'); }} className="p-2.5 text-slate-300 hover:text-amber-600 transition-all"><Edit3 size={18}/></button></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setActiveStore(store); setView('inventory'); }} className="h-12 bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase flex items-center justify-center gap-2 active:scale-95 shadow-md"><Database size={16}/> {t.inventory}</button>
                <button onClick={() => window.open(getSafeUrl(`/${store.slug}`), '_blank')} className="h-12 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-[11px] uppercase flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-95 transition-all shadow-sm">Menu <ExternalLink size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-fit bg-white/95 backdrop-blur-md border border-slate-200 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex items-center px-2 py-2 gap-1 z-[150]">
        <button onClick={() => setView('stores')} className={`flex items-center gap-2.5 px-6 py-3 rounded-full transition-all duration-300 ${view === 'stores' || view === 'inventory' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}><Building2 size={18}/><span className="text-[10px] font-black uppercase tracking-widest">{t.stores}</span></button>
        <div className="w-[1px] h-4 bg-slate-200 mx-1" />
        <button onClick={() => window.location.href = getSafeUrl('/admin/master')} className="flex items-center gap-2.5 px-6 py-3 rounded-full text-slate-400 hover:text-slate-900 transition-all duration-300"><Database size={18}/><span className="text-[10px] font-black uppercase tracking-widest">Master</span></button>
      </nav>
    </div>
  );
}
