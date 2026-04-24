// app/admin/page.tsx
"use client";

export const runtime = 'edge';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, Plus, Search, Database, LogOut, 
  ExternalLink, Settings, QrCode, X, Loader2, ArrowLeft, 
  CheckCircle2, AlertCircle, Save, Wine, Sparkles, 
  LayoutGrid, Copy, Coins, Check, GlassWater, Lock, MapPin, 
  Star, Upload, FileText, RefreshCw, Download, Edit3, Building2,
  Palette, Globe, LogIn
} from 'lucide-react';

/**
 * プレビュー環境でのURL解析エラーを回避するための堅牢なヘルパー
 */
const getSafeUrl = (path: string) => {
  if (typeof window === 'undefined' || path.startsWith('http')) return path;
  try {
    const origin = window.location.origin;
    const baseUrl = (origin && origin !== 'null' && !origin.startsWith('blob:')) 
      ? origin 
      : window.location.href.split('?')[0].split('#')[0].replace(/\/admin.*$/, '');
    
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return baseUrl.replace(/\/+$/, '') + cleanPath;
  } catch (e) {
    return path;
  }
};

// --- フォールバックデータ ---
const FALLBACK_STORES = [{ slug: 'pieroth-hibiya', store_name: 'ピーロート・ジャパン 日比谷店', theme_color: '#b45309', access_password: 'pass' }];
const FALLBACK_MASTER = [
  { id: "P-9095472", name_jp: "パスカルトソ スパークリング", country: "アルゼンチン", price_bottle: 3800, body: 2, aroma_intensity: 4, sweetness: 1, complexity: 3, tannins: 1, finish: 3, acidity: 4, oak: 1, image_url: "https://images.unsplash.com/photo-1553361371-9bb220265263?w=400" },
  { id: "P-9343898", name_jp: "パスカルトソ CS レゼルヴァ", country: "アルゼンチン", price_bottle: 5200, body: 4, aroma_intensity: 4, sweetness: 2, complexity: 4, tannins: 4, finish: 4, acidity: 3, oak: 3, image_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400" }
];

/**
 * 8項目レーダーチャート
 */
function AdminRadar({ data }: { data: any }) {
  const size = 110, center = 55, maxR = 30;
  const labels = ['ボディ', '香り', '甘味', '複雑', '渋み', '余韻', '酸味', '樽感'];
  const keys = ['body', 'aroma_intensity', 'sweetness', 'complexity', 'tannins', 'finish', 'acidity', 'oak'];
  const points = keys.map((k, i) => {
    const angle = (i * 45 - 90) * (Math.PI / 180);
    const r = (Math.min(Math.max(Number(data[k]) || 3, 1), 5) / 5) * maxR;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  }).join(' ');

  return (
    <div className="bg-slate-50 p-2 rounded-2xl border shrink-0">
      <svg width={size} height={size} className="overflow-visible">
        {[1,2,3,4,5].map(l => <circle key={l} cx={center} cy={center} r={(l/5)*maxR} fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="0.5" />)}
        {labels.map((l, i) => {
          const a = (i * 45 - 90) * (Math.PI / 180);
          return <text key={l} x={center + (maxR+12)*Math.cos(a)} y={center + (maxR+12)*Math.sin(a)} textAnchor="middle" dominantBaseline="middle" fontSize="5" className="fill-slate-400 font-black">{l}</text>
        })}
        <polygon points={points} fill="rgba(180, 83, 9, 0.2)" stroke="#b45309" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

/**
 * --- 店舗設定ビュー ---
 */
function StoreSettingsView({ store, onBack, onSuccess }: { store: any | null, onBack: () => void, onSuccess: () => void }) {
  const [name, setName] = useState(store?.store_name || '');
  const [slug, setSlug] = useState(store?.slug || '');
  const [color, setColor] = useState(store?.theme_color || '#b45309');
  const [password, setPassword] = useState(store?.access_password || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getSafeUrl('/api/store/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_name: name, slug: slug.trim().toLowerCase(), theme_color: color, access_password: password, is_edit: !!store }),
      });
      const data = await res.json();
      if (res.ok) onSuccess();
      else setError(data.error || '保存に失敗しました');
    } catch { setError('通信エラーが発生しました'); }
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20 p-4 pt-8">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-3 bg-white shadow-sm border border-slate-200 rounded-full text-slate-400 active:scale-90"><ArrowLeft size={20}/></button>
        <div>
          <h2 className="text-2xl font-black text-slate-900">{store ? '店舗情報を編集' : '新規店舗を登録'}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Store Configuration</p>
        </div>
      </div>
      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-xl">
        <form onSubmit={handleSave} className="space-y-8">
          <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 ml-4 uppercase tracking-widest">店舗名称</label><input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="例：ピーロート日比谷店" className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 ring-amber-500/10 focus:border-amber-500 transition-all" /></div>
          <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 ml-4 uppercase tracking-widest">URLスラッグ</label><input type="text" required disabled={!!store} value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="hibiya-pieroth" className="w-full h-16 pl-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none disabled:opacity-50" /></div>
          <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 ml-4 uppercase tracking-widest">店舗用ログインパスワード</label><input type="text" required value={password} onChange={e => setPassword(e.target.value)} placeholder="パスワードを設定" className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" /></div>
          <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 ml-4 uppercase tracking-widest">テーマカラー</label><div className="flex items-center gap-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl"><input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-14 h-14 rounded-xl cursor-pointer bg-transparent border-none outline-none" /><p className="font-mono font-black text-lg text-slate-700 uppercase tracking-widest">{color}</p></div></div>
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold">{error}</div>}
          <button type="submit" disabled={loading} className="w-full h-18 bg-slate-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 active:scale-95 shadow-lg transition-all">{loading ? <Loader2 className="animate-spin" /> : <Save size={22} />} 保存する</button>
        </form>
      </div>
    </div>
  );
}

/**
 * --- 在庫管理ビュー ---
 */
function InventoryView({ store, onBack }: { store: any, onBack: () => void }) {
  const [master, setMaster] = useState<any[]>([]);
  const [inv, setInv] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [mRes, sRes] = await Promise.all([
        fetch(getSafeUrl('/api/master/list')),
        fetch(getSafeUrl(`/api/wines?slug=${store.slug}`))
      ]);
      const mData = await mRes.json(); setMaster(mData.length ? mData : FALLBACK_MASTER);
      const sData = await sRes.json();
      const map: any = {};
      if (Array.isArray(sData)) sData.forEach((w: any) => { map[w.id] = { active: true, price_bottle: w.price_bottle, price_glass: w.price_glass || 0, stock: w.stock || 0 }; });
      setInv(map);
    } catch { setMaster(FALLBACK_MASTER); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [store.slug]);

  const handleReflect = async () => {
    setSyncing(true);
    try {
      const updates = Object.entries(inv).map(([id, data]) => 
        fetch(getSafeUrl('/api/store/inventory/update'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: store.slug, wineId: id, ...data })
        })
      );
      await Promise.all(updates);
      setStatus({ type: 'success', msg: '反映完了' });
      setTimeout(() => setStatus(null), 3000);
    } catch { setStatus({ type: 'error', msg: '反映失敗' }); }
    setSyncing(false);
  };

  const handleToggle = async (wineId: string) => {
    try {
      const res = await fetch(getSafeUrl('/api/store/inventory/toggle'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: store.slug, wineId })
      });
      if (res.ok) {
        setInv(prev => {
          const next = { ...prev };
          if (next[wineId]) delete next[wineId];
          else {
            const m = master.find(x => x.id === wineId);
            next[wineId] = { active: true, price_bottle: m?.price_bottle || 0, price_glass: 0, stock: 0 };
          }
          return next;
        });
      }
    } catch (e) { console.error(e); }
  };

  const filtered = master.filter(w => (w.name_jp || "").includes(search) || (w.id || "").includes(search));

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-40">
      <div className="flex items-center gap-4 px-2 pt-4">
        <button onClick={onBack} className="p-3 bg-white shadow-sm border rounded-full text-slate-400 active:scale-90"><ArrowLeft size={20}/></button>
        <div><h2 className="text-xl font-black text-slate-900 leading-tight truncate max-w-[200px]">{store.store_name}</h2><p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Inventory Management</p></div>
      </div>
      <div className="relative group px-2"><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18}/><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="商品検索..." className="w-full h-14 pl-14 pr-6 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 ring-amber-500/5 transition-all shadow-sm" /></div>
      <div className="grid gap-4 px-2">
        {loading ? <div className="py-24 text-center font-black text-slate-200 animate-pulse">DATABASE SYNC...</div> : 
        filtered.map(w => {
          const item = inv[w.id]; const active = !!item;
          return (
            <div key={w.id} className={`bg-white border-2 rounded-[2.5rem] p-5 transition-all duration-300 ${active ? 'border-amber-500 shadow-xl' : 'border-slate-100 opacity-60'}`}>
              <div className="flex items-start gap-4">
                <img src={w.image_url} className="w-16 h-24 object-contain bg-slate-50 rounded-2xl p-2 border" alt="" onError={(e:any)=>e.target.src='https://placehold.co/100x150?text=WINE'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1"><span className="text-[8px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase">ID: {w.id}</span><span className="text-[8px] font-black text-amber-600 uppercase">{w.country}</span></div>
                  <h4 className="text-sm font-black text-slate-800 truncate leading-tight mb-3">{w.name_jp}</h4>
                  <button onClick={() => handleToggle(w.id)} className={`h-10 px-4 rounded-xl flex items-center gap-2 font-black text-[10px] transition-all ${active ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                    {active ? <Check size={14} strokeWidth={4}/> : <Plus size={14} strokeWidth={4}/>} {active ? '採用中' : '採用する'}
                  </button>
                </div>
                <AdminRadar data={w} />
              </div>
              {active && (
                <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-50 animate-in slide-in-from-top-2">
                  <div className="space-y-1.5"><label className="text-[8px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><Coins size={10}/> ボトル</label><input type="number" value={item.price_bottle || 0} onChange={e => setInv({...inv, [w.id]: {...item, price_bottle: parseInt(e.target.value)}})} className="w-full h-11 bg-slate-50 border rounded-xl px-3 text-xs font-black outline-none focus:ring-2 ring-amber-500/20" /></div>
                  <div className="space-y-1.5"><label className="text-[8px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><GlassWater size={10}/> グラス</label><input type="number" value={item.price_glass || 0} onChange={e => setInv({...inv, [w.id]: {...item, price_glass: parseInt(e.target.value)}})} className="w-full h-11 bg-slate-50 border rounded-xl px-3 text-xs font-black outline-none focus:ring-2 ring-amber-500/20" /></div>
                  <div className="space-y-1.5"><label className="text-[8px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><Database size={10}/> 在庫</label><input type="number" value={item.stock || 0} onChange={e => setInv({...inv, [w.id]: {...item, stock: parseInt(e.target.value)}})} className="w-full h-11 bg-slate-50 border rounded-xl px-3 text-xs font-black outline-none focus:ring-2 ring-amber-500/20" /></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] w-[260px] pointer-events-none">
        <button onClick={handleReflect} disabled={syncing} className={`pointer-events-auto w-full h-18 rounded-full flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 border-b-4 ${status?.type === 'success' ? 'bg-emerald-500 border-emerald-700 text-white' : 'bg-slate-900 border-black text-white'}`}>
          {syncing ? <Loader2 className="animate-spin" size={20}/> : status?.type === 'success' ? <CheckCircle2 size={20}/> : <Sparkles size={20} className="text-amber-500" />}
          {status?.msg || 'メニューに反映する'}
        </button>
      </div>
    </div>
  );
}

/**
 * メインアプリケーションコンポーネント
 */
export default function App() {
  const [view, setView] = useState<'stores' | 'inventory' | 'settings' | 'master'>('stores');
  const [stores, setStores] = useState<any[]>([]);
  const [activeStore, setActiveStore] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await fetch(getSafeUrl('/api/store/list'));
      if (res.ok) setStores(await res.json()); else setStores(FALLBACK_STORES);
    } catch { setStores(FALLBACK_STORES); }
    setLoading(false);
  };

  useEffect(() => { fetchStores(); }, []);

  if (view === 'inventory' && activeStore) return <main className="min-h-screen bg-slate-50"><div className="max-w-2xl mx-auto"><InventoryView store={activeStore} onBack={() => { setView('stores'); setActiveStore(null); fetchStores(); }} /></div></main>;
  if (view === 'settings') return <main className="min-h-screen bg-slate-50"><div className="max-w-2xl mx-auto"><StoreSettingsView store={activeStore} onBack={() => { setView('stores'); setActiveStore(null); }} onSuccess={() => { setView('stores'); setActiveStore(null); fetchStores(); }} /></div></main>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased overflow-x-hidden pb-40">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-amber-500 shadow-md rotate-2"><LayoutGrid size={22} strokeWidth={3} /></div>
          <div><h1 className="text-base font-black italic text-slate-900 uppercase leading-none">PIEROTH MS</h1><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Control Center</p></div>
        </div>
        <div className="flex items-center gap-3">
          {/* 取引先飲食店のログイン画面リンク */}
          <button onClick={() => window.open(getSafeUrl('/partner/login'), '_blank')} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase hover:bg-slate-200 transition-all border border-slate-200">
            <LogIn size={14}/> Partner Portal
          </button>
          <button onClick={() => window.location.href='/admin/login'} className="p-2.5 bg-red-50 text-red-500 rounded-full border border-red-100 active:scale-90 transition-colors"><LogOut size={18} /></button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-5 space-y-10 relative z-10">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-2xl font-black text-slate-900 leading-tight">店舗一覧</h2>
            <button onClick={() => { setActiveStore(null); setView('settings'); }} className="w-12 h-12 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all"><Plus size={24} strokeWidth={3} /></button>
          </div>

          <div className="grid gap-4">
            {stores.map(store => (
              <div key={store.slug} className="group bg-white border border-slate-200 rounded-[2.2rem] p-5 hover:border-amber-500/30 transition-all duration-300 relative overflow-hidden shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: store.theme_color || '#b45309' }}><Store size={28} /></div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors truncate max-w-[180px]">{store.store_name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 tracking-wider">/{store.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {/* 店舗固有のパートナー画面へのリンクボタン */}
                    <button onClick={() => window.open(getSafeUrl(`/partner/login?slug=${store.slug}`), '_blank')} title="飲食店ポータルを表示" className="p-2.5 text-slate-300 hover:text-emerald-600 transition-all active:scale-90"><LogIn size={18}/></button>
                    <button onClick={() => { setActiveStore(store); setView('settings'); }} className="p-2.5 text-slate-300 hover:text-slate-900 active:scale-90 transition-all"><Settings size={18}/></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => { setActiveStore(store); setView('inventory'); }} className="h-12 bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 shadow-md hover:bg-slate-800 transition-all"><Database size={16}/> 在庫・価格管理</button>
                  <button onClick={() => window.open(getSafeUrl(`/${store.slug}`), '_blank')} className="h-12 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-95 transition-all shadow-sm">公開メニュー表示 <ExternalLink size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* パートナー用ポータルへの大きなリンクセクション */}
        <div className="bg-slate-100 rounded-[2rem] p-8 border border-slate-200 text-center space-y-4 mx-1 mt-10">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-slate-400">
            <Building2 size={24} />
          </div>
          <div>
            <h3 className="font-black text-slate-800">飲食店様専用ポータル</h3>
            <p className="text-xs text-slate-400 font-bold mt-1 leading-relaxed">
              取引先飲食店が自ら在庫や価格を編集するための<br/>ログイン画面へアクセスできます。
            </p>
          </div>
          <button onClick={() => window.open(getSafeUrl('/partner/login'), '_blank')} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-sm flex items-center justify-center gap-2 mx-auto">
            <LogIn size={16}/> 飲食店ログイン画面を開く
          </button>
        </div>
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-fit bg-white/95 backdrop-blur-md border border-slate-200 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex items-center px-2 py-2 gap-1 z-[150]">
        <button onClick={() => { setView('stores'); fetchStores(); }} className={`flex items-center gap-2.5 px-6 py-3 rounded-full transition-all duration-300 ${view === 'stores' || view === 'inventory' || view === 'settings' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}><Building2 size={18}/><span className="text-[10px] font-black uppercase tracking-widest">Stores</span></button>
        <div className="w-[1px] h-4 bg-slate-200 mx-1" />
        <button onClick={() => { window.location.href = getSafeUrl('/admin/master'); }} className="flex items-center gap-2.5 px-6 py-3 rounded-full text-slate-400 hover:text-slate-900 transition-all duration-300"><Database size={18}/><span className="text-[10px] font-black uppercase tracking-widest">Master</span></button>
      </nav>
    </div>
  );
}
