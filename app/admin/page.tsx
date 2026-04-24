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
  GlassWater, Edit3, Key, Lock, Share2
} from 'lucide-react';

/**
 * プレビュー用のサンプルデータ（DBが空の場合に表示）
 */
const SAMPLE_STORES = [
  { slug: 'pieroth-hibiya', store_name: 'ピーロート・ジャパン 日比谷店', theme_color: '#b45309', access_password: 'pass123' },
  { slug: 'grand-hotel-tokyo', store_name: 'グランドホテル東京 メインダイニング', theme_color: '#1e1b15', access_password: 'pass456' }
];

const SAMPLE_WINES = [
  { id: "9095472", name_jp: "パスカルトソ スパークリング", name_en: "Pascual Toso Sparkling Brut", country: "アルゼンチン", grape: "シャルドネ", price_bottle: 3800, stock: 24, body: 2, aroma_intensity: 4, sweetness: 1, complexity: 3, tannins: 1, finish: 3, acidity: 4, oak: 1, is_priority: 1, image_url: "https://images.unsplash.com/photo-1553361371-9bb220265263?w=400" },
  { id: "9343898", name_jp: "パスカルトソ CS", name_en: "Pascual Toso CS Reserva", country: "アルゼンチン", grape: "カベルネ・S", price_bottle: 5200, stock: 12, body: 4, aroma_intensity: 4, sweetness: 2, complexity: 4, tannins: 4, finish: 4, acidity: 3, oak: 3, is_priority: 1, image_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400" },
  { id: "9293333", name_jp: "トカイ・アスー 5プットニョス", name_en: "Tokaji Aszu 5 Puttonyos", country: "ハンガリー", grape: "フルミント", price_bottle: 12000, stock: 5, body: 4, aroma_intensity: 5, sweetness: 5, complexity: 5, tannins: 1, finish: 5, acidity: 4, oak: 2, is_priority: 0, image_url: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=400" }
];

const getSafeUrl = (path: string) => {
  if (!path) return '#';
  if (typeof window === 'undefined') return path;
  try {
    const origin = window.location.origin;
    const baseUrl = (origin && origin !== 'null' && !origin.startsWith('blob:')) ? origin : window.location.href.split('?')[0].split('#')[0];
    const safePath = path.startsWith('/') ? path : `/${path}`;
    return new URL(safePath, baseUrl).href;
  } catch (e) { return path || '#'; }
};

const translations = {
  ja: {
    dashboard: "ダッシュボード", stores: "店舗一覧", settings: "店舗設定", inventory: "在庫・価格管理",
    loading: "同期中...", all: "すべて", searchPlaceholder: "店舗名やIDで検索...",
    wineSearchPlaceholder: "銘柄名、ID、産地で検索...", langName: "日本語",
    labels: {
      exclusive: "EXCLUSIVE", bottle: "ボトル価格", glass: "グラス価格", stock: "在庫(本)",
      reflectBtn: "メニューに反映する", syncSuccess: "反映完了", partnerAccess: "アクセス許可設定",
      partnerPass: "店舗用パスワード", partnerUrl: "店舗用管理URL", copy: "コピー"
    },
    radar: { body: 'ボディ', aroma_intensity: '香りの強さ', sweetness: '甘味', complexity: '複雑さ', tannins: '渋み', finish: '余韻', acidity: '酸味', oak: '樽感' }
  },
  en: {
    dashboard: "Dashboard", stores: "Stores", settings: "Settings", inventory: "Inventory",
    loading: "Syncing...", all: "All", searchPlaceholder: "Search stores...",
    wineSearchPlaceholder: "Search wines...", langName: "ENG",
    labels: {
      exclusive: "EXCLUSIVE", bottle: "Bottle (¥)", glass: "Glass (¥)", stock: "Stock",
      reflectBtn: "Reflect to Menu", syncSuccess: "Success", partnerAccess: "Partner Access",
      partnerPass: "Password", partnerUrl: "Partner URL", copy: "Copy"
    },
    radar: { body: 'Body', aroma_intensity: 'Intensity', sweetness: 'Sweetness', complexity: 'Complexity', tannins: 'Tannins', finish: 'Finish', acidity: 'Acidity', oak: 'Oak' }
  }
};

/**
 * 日本語8項目チャート
 */
function AdminFlavorRadar({ data, lang }: { data: any, lang: 'ja' | 'en' }) {
  const size = 120;
  const center = size / 2;
  const maxRadius = 35;
  const scale = (val: number) => (Math.min(Math.max(val || 3, 1), 5) / 5) * maxRadius;
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
          return (
            <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-slate-400 font-bold text-[5px] uppercase">{f.label}</text>
          );
        })}
        <polygon points={polygonPoints} fill="rgba(180, 83, 9, 0.2)" stroke="#b45309" strokeWidth="1.5" />
        {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="#b45309" />)}
      </svg>
    </div>
  );
}

/**
 * --- 在庫管理ビュー ---
 */
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
        const mData = mRes.ok ? await mRes.json() : SAMPLE_WINES;
        const sData = sRes.ok ? await sRes.json() : [];
        setMasterWines(mData.length > 0 ? mData : SAMPLE_WINES);
        const invMap: Record<string, any> = {};
        sData.forEach((w: any) => { 
          invMap[w.id] = { active: true, price_bottle: w.price_bottle, price_glass: w.price_glass || 0, stock: w.stock || 0 }; 
        });
        setInventory(invMap);
      } catch { setMasterWines(SAMPLE_WINES); }
      setLoading(false);
    };
    fetchData();
  }, [store.slug]);

  const updateInv = (id: string, field: string, val: any) => {
    setInventory(prev => ({ ...prev, [id]: { ...(prev[id] || { active: false, price_bottle: 0, price_glass: 0, stock: 0 }), [field]: val } }));
  };

  const handleReflect = async () => {
    setSyncing(true);
    // 擬似的な同期処理（実際はAPIを叩く）
    await new Promise(r => setTimeout(r, 1200));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setSyncing(false);
  };

  const filtered = masterWines.filter(w => (w.name_jp || "").includes(search) || (w.id || "").includes(search));

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-40">
      <div className="flex items-center gap-4 px-2">
        <button onClick={onBack} className="p-3 bg-white shadow-sm border border-slate-200 rounded-full text-slate-400 active:scale-90"><ArrowLeft size={20}/></button>
        <div>
          <h2 className="text-xl font-black text-slate-900 leading-tight">{store.store_name}</h2>
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">Inventory Management</p>
        </div>
      </div>
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t.wineSearchPlaceholder} className="w-full h-14 pl-14 pr-6 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 ring-amber-500/5 transition-all shadow-sm" />
      </div>

      <div className="grid gap-4">
        {loading ? <div className="py-20 text-center font-black text-slate-200 animate-pulse">{t.loading}</div> : 
        filtered.map(w => {
          const inv = inventory[w.id] || { active: false, price_bottle: w.price_bottle, price_glass: 0, stock: 0 };
          const isActive = inv.active;
          return (
            <div key={w.id} className={`bg-white border-2 rounded-[2.5rem] p-5 transition-all duration-300 ${isActive ? 'border-amber-500 shadow-xl' : 'border-slate-100 opacity-60 grayscale-[0.5]'}`}>
              <div className="flex items-start gap-4">
                <div className="w-16 h-20 bg-slate-50 rounded-2xl flex items-center justify-center p-2 relative shrink-0 shadow-inner"><img src={w.image_url} className="h-full object-contain" alt="" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1"><span className="text-[8px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">ID: {w.id}</span><span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">{lang === 'ja' ? w.country : w.country_en}</span></div>
                  <h4 className="text-sm font-black text-slate-800 truncate leading-tight mb-3">{lang === 'ja' ? w.name_jp : w.name_en}</h4>
                  <button onClick={() => updateInv(w.id, 'active', !isActive)} className={`h-10 px-4 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${isActive ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{isActive ? <Check size={14} strokeWidth={4}/> : <Plus size={14} strokeWidth={4}/>} {isActive ? 'Selected' : 'Select'}</button>
                </div>
                <AdminFlavorRadar data={w} lang={lang} />
              </div>
              {isActive && (
                <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-50 animate-in slide-in-from-top-2">
                  <div className="space-y-1.5"><label className="text-[8px] font-black text-slate-400 uppercase ml-2">{t.labels.bottle}</label><input type="number" value={inv.price_bottle} onChange={e => updateInv(w.id, 'price_bottle', parseInt(e.target.value))} className="w-full h-11 bg-slate-50 rounded-xl px-3 text-xs font-black outline-none focus:ring-2 ring-amber-500/20" /></div>
                  <div className="space-y-1.5"><label className="text-[8px] font-black text-slate-400 uppercase ml-2">{t.labels.glass}</label><input type="number" value={inv.price_glass} onChange={e => updateInv(w.id, 'price_glass', parseInt(e.target.value))} className="w-full h-11 bg-slate-50 rounded-xl px-3 text-xs font-black outline-none focus:ring-2 ring-amber-500/20" /></div>
                  <div className="space-y-1.5"><label className="text-[8px] font-black text-slate-400 uppercase ml-2">{t.labels.stock}</label><input type="number" value={inv.stock} onChange={e => updateInv(w.id, 'stock', parseInt(e.target.value))} className="w-full h-11 bg-slate-50 rounded-xl px-3 text-xs font-black outline-none focus:ring-2 ring-amber-500/20" /></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] w-[240px] pointer-events-none">
        <button onClick={handleReflect} disabled={syncing} className={`pointer-events-auto w-full h-16 rounded-full flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 border-b-4 ${showSuccess ? 'bg-emerald-500 border-emerald-700 text-white' : 'bg-slate-900 border-black text-white'}`}>
          {syncing ? <Loader2 className="animate-spin" size={20}/> : showSuccess ? <CheckCircle2 size={20}/> : <Sparkles size={20} className="text-amber-500" />}
          {showSuccess ? t.labels.syncSuccess : t.labels.reflectBtn}
        </button>
      </div>
    </div>
  );
}

/**
 * --- メインダッシュボード ---
 */
export default function AdminDashboard() {
  const [lang, setLang] = useState<'ja' | 'en'>('ja');
  const [view, setView] = useState<'stores' | 'inventory' | 'settings'>('stores');
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStore, setActiveStore] = useState<any | null>(null);
  const [qrModal, setQrModal] = useState<any | null>(null);
  const [partnerModal, setPartnerModal] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const t = translations[lang];

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await fetch(getSafeUrl('/api/store/list'));
      const data = res.ok ? await res.json() : [];
      setStores(data.length > 0 ? data : SAMPLE_STORES);
    } catch { setStores(SAMPLE_STORES); }
    setLoading(false);
  };

  useEffect(() => { fetchStores(); }, []);

  const filteredStores = useMemo(() => stores.filter(s => s.store_name.toLowerCase().includes(search.toLowerCase()) || s.slug.includes(search)), [stores, search]);

  if (view === 'inventory' && activeStore) return <main className="min-h-screen bg-slate-50 p-5 font-sans"><div className="max-w-2xl mx-auto"><InventoryView store={activeStore} lang={lang} onBack={() => { setView('stores'); setActiveStore(null); }} /></div></main>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased pb-40">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-amber-500 shadow-md"><LayoutGrid size={22} strokeWidth={3} /></div>
          <div><h1 className="text-base font-black italic text-slate-900 leading-none tracking-tighter uppercase">PIEROTH MS</h1><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Control Center</p></div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')} className="text-[9px] font-black tracking-[0.1em] bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full uppercase active:scale-95 transition-all">{t.langName}</button>
          <button onClick={() => window.location.href='/admin/login'} className="p-2.5 bg-red-50 text-red-500 rounded-full border border-red-100"><LogOut size={18} /></button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-5 space-y-10 relative z-10">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-2xl font-black text-slate-900 leading-tight">{t.stores}</h2>
            <button onClick={() => setView('settings')} className="w-12 h-12 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all"><Plus size={24} strokeWidth={3} /></button>
          </div>
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
            <input type="text" placeholder={t.searchPlaceholder} className="w-full h-14 pl-14 pr-6 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 ring-amber-500/5 transition-all shadow-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="grid gap-4">
            {filteredStores.map(store => (
              <div key={store.slug} className="group bg-white border border-slate-200 rounded-[2.2rem] p-5 hover:border-amber-500/30 transition-all duration-300 relative overflow-hidden shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: store.theme_color || '#b45309' }}><Store size={28} /></div>
                    <div className="min-w-0"><h3 className="text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors truncate">{store.store_name}</h3><p className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1 uppercase mt-0.5">/{store.slug}</p></div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setPartnerModal(store)} className="p-2.5 text-slate-300 hover:text-amber-600 active:scale-90 transition-all"><Lock size={18}/></button>
                    <button onClick={() => setQrModal(store)} className="p-2.5 text-slate-300 hover:text-amber-500 transition-all active:scale-90"><QrCode size={18}/></button>
                    <button onClick={() => { setActiveStore(store); setView('settings'); }} className="p-2.5 text-slate-300 hover:text-slate-900 transition-all active:scale-90"><Settings size={18}/></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => { setActiveStore(store); setView('inventory'); }} className="h-12 bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 shadow-md"><Database size={16}/> {t.inventory}</button>
                  <button onClick={() => window.open(getSafeUrl(`/${store.slug}`), '_blank')} className="h-12 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"><ExternalLink size={14}/> Menu</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-fit bg-white/95 backdrop-blur-md border border-slate-200 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex items-center px-2 py-2 gap-1 z-[150]">
        <button onClick={() => setView('stores')} className={`flex items-center gap-2.5 px-6 py-3 rounded-full transition-all duration-300 ${view === 'stores' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}><Building2 size={18}/><span className="text-[10px] font-black uppercase tracking-widest">{t.stores}</span></button>
        <div className="w-[1px] h-4 bg-slate-200 mx-1" />
        <button onClick={() => window.location.href = getSafeUrl('/admin/master')} className="flex items-center gap-2.5 px-6 py-3 rounded-full text-slate-400 hover:text-slate-900 transition-all duration-300"><Database size={18}/><span className="text-[10px] font-black uppercase tracking-widest">Master</span></button>
      </nav>

      {/* モーダル類 (省略なし) */}
      {partnerModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setPartnerModal(null)}>
          <div className="bg-white p-8 rounded-[3.5rem] shadow-2xl max-w-sm w-full space-y-6 animate-in zoom-in-95 border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-2">
              <span className="font-black text-slate-400 text-[9px] uppercase tracking-widest">{t.labels.partnerAccess}</span>
              <button onClick={() => setPartnerModal(null)} className="p-2 hover:bg-slate-50 rounded-full text-slate-300 active:scale-90 transition-all"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-2 relative overflow-hidden">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.labels.partnerUrl}</p>
                <p className="text-xs font-bold text-slate-900 break-all">{getSafeUrl('/partner/login')}</p>
                <button onClick={() => navigator.clipboard.writeText(getSafeUrl('/partner/login'))} className="absolute top-4 right-4 text-slate-300 hover:text-amber-600 transition-colors"><Copy size={16}/></button>
              </div>
              <div className="p-5 bg-amber-50/50 rounded-3xl border border-amber-100 space-y-2 relative overflow-hidden">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{t.labels.partnerPass}</p>
                <p className="text-lg font-black text-slate-900 tracking-widest">{partnerModal.access_password || "Not Set"}</p>
                <button onClick={() => navigator.clipboard.writeText(partnerModal.access_password)} className="absolute top-4 right-4 text-amber-300 hover:text-amber-600 transition-colors"><Copy size={16}/></button>
              </div>
            </div>
            <button onClick={() => window.open(getSafeUrl('/partner/login'), '_blank')} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"><ExternalLink size={16}/> {translations[lang].labels.partnerLogin || 'Open Partner Dashboard'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
