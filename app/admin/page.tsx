// app/admin/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Store, Plus, Search, Database, LogOut, 
  ExternalLink, Settings, X, Loader2, ArrowLeft, 
  CheckCircle2, AlertCircle, Save, Wine, Sparkles, 
  LayoutGrid, Coins, Check, GlassWater, Building2,
  LogIn, ChevronRight, QrCode, Trash2
} from 'lucide-react';

/**
 * ユーティリティ: 環境に応じた安全なURL生成
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

// --- フォールバックデータ（API未接続時） ---
const FALLBACK_STORES = [
  { slug: 'pieroth-hibiya', store_name: 'ピーロート・ジャパン 日比谷店', theme_color: '#b45309', access_password: 'pass' }
];

const FALLBACK_MASTER = [
  { id: "P-9095472", name_jp: "パスカルトソ スパークリング", country: "アルゼンチン", price_bottle: 3800, body: 2, aroma_intensity: 4, sweetness: 1, complexity: 3, tannins: 1, finish: 3, acidity: 4, oak: 1, image_url: "https://images.unsplash.com/photo-1553361371-9bb220265263?w=400" },
  { id: "P-9343898", name_jp: "パスカルトソ CS レゼルヴァ", country: "アルゼンチン", price_bottle: 5200, body: 4, aroma_intensity: 4, sweetness: 2, complexity: 4, tannins: 4, finish: 4, acidity: 3, oak: 3, image_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400" }
];

/**
 * レーダーチャートコンポーネント
 */
function AdminRadar({ data }: { data: any }) {
  const size = 100, center = 50, maxR = 35;
  const labels = ['ボディ', '香り', '甘味', '複雑', '渋み', '余韻', '酸味', '樽感'];
  const keys = ['body', 'aroma_intensity', 'sweetness', 'complexity', 'tannins', 'finish', 'acidity', 'oak'];
  const points = keys.map((k, i) => {
    const angle = (i * 45 - 90) * (Math.PI / 180);
    const val = Number(data[k]) || 3;
    const r = (Math.min(Math.max(val, 1), 5) / 5) * maxR;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  }).join(' ');

  return (
    <div className="bg-slate-50 p-2 rounded-2xl border shrink-0">
      <svg width={size} height={size} className="overflow-visible">
        {[1,2,3,4,5].map(l => <circle key={l} cx={center} cy={center} r={(l/5)*maxR} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5" />)}
        {labels.map((l, i) => {
          const a = (i * 45 - 90) * (Math.PI / 180);
          return <text key={l} x={center + (maxR+10)*Math.cos(a)} y={center + (maxR+10)*Math.sin(a)} textAnchor="middle" dominantBaseline="middle" fontSize="4.5" className="fill-slate-400 font-bold">{l}</text>
        })}
        <polygon points={points} fill="rgba(180, 83, 9, 0.25)" stroke="#b45309" strokeWidth="1.2" />
      </svg>
    </div>
  );
}

/**
 * 店舗設定ビュー
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
      if (res.ok) onSuccess();
      else {
        const data = await res.json();
        setError(data.error || '保存に失敗しました');
      }
    } catch { setError('通信エラーが発生しました'); }
    setLoading(false);
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 px-2">
        <button onClick={onBack} className="p-3 bg-white shadow-sm border border-slate-200 rounded-full text-slate-400 active:scale-90"><ArrowLeft size={20}/></button>
        <div>
          <h2 className="text-xl font-black text-slate-900">{store ? '店舗編集' : '新規店舗登録'}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuration</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">店舗名称</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="例：ピーロート日比谷店" className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 ring-amber-500/10 focus:border-amber-500 transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">URLスラッグ (英数字のみ)</label>
            <input type="text" required disabled={!!store} value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="hibiya-pieroth" className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none disabled:opacity-50" />
            {!store && <p className="text-[9px] text-slate-400 ml-2 italic">※URLの一部になります（例: my-menu.jp/slug）</p>}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">店舗ログイン用パスワード</label>
            <input type="text" required value={password} onChange={e => setPassword(e.target.value)} placeholder="店舗側で編集する際のパスワード" className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">テーマカラー</label>
            <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none" />
              <p className="font-mono font-black text-sm text-slate-700 uppercase">{color}</p>
            </div>
          </div>
          
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-[11px] font-bold flex items-center gap-2"><AlertCircle size={14}/> {error}</div>}
          
          <button type="submit" disabled={loading} className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-base flex items-center justify-center gap-3 active:scale-95 shadow-lg transition-all disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />} 
            設定を保存する
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * 在庫管理ビュー
 */
function InventoryView({ store, onBack }: { store: any, onBack: () => void }) {
  const [master, setMaster] = useState<any[]>([]);
  const [inv, setInv] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, sRes] = await Promise.all([
        fetch(getSafeUrl('/api/master/list')),
        fetch(getSafeUrl(`/api/wines?slug=${store.slug}`))
      ]);
      const mData = await mRes.json();
      const sData = await sRes.json();
      
      setMaster(Array.isArray(mData) ? mData : FALLBACK_MASTER);
      
      const map: any = {};
      if (Array.isArray(sData)) {
        sData.forEach((w: any) => {
          map[w.id] = { 
            active: true, 
            price_bottle: w.price_bottle, 
            price_glass: w.price_glass || 0, 
            stock: w.stock || 0 
          };
        });
      }
      setInv(map);
    } catch { 
      setMaster(FALLBACK_MASTER);
    }
    setLoading(false);
  }, [store.slug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdate = async () => {
    setSyncing(true);
    try {
      const res = await fetch(getSafeUrl('/api/store/inventory/sync'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: store.slug, inventory: inv })
      });
      if (res.ok) {
        setStatus({ type: 'success', msg: 'メニューを更新しました' });
        setTimeout(() => setStatus(null), 3000);
      } else {
        throw new Error();
      }
    } catch {
      setStatus({ type: 'error', msg: '更新に失敗しました' });
    }
    setSyncing(false);
  };

  const toggleWine = (wine: any) => {
    setInv(prev => {
      const next = { ...prev };
      if (next[wine.id]) {
        delete next[wine.id];
      } else {
        next[wine.id] = { 
          active: true, 
          price_bottle: wine.price_bottle, 
          price_glass: 0, 
          stock: 99 
        };
      }
      return next;
    });
  };

  const filtered = master.filter(w => 
    w.name_jp?.includes(search) || w.id?.includes(search) || w.country?.includes(search)
  );

  return (
    <div className="space-y-6 pb-40 animate-in fade-in duration-300">
      <div className="flex items-center gap-4 px-2 pt-2">
        <button onClick={onBack} className="p-3 bg-white shadow-sm border rounded-full text-slate-400 active:scale-90"><ArrowLeft size={20}/></button>
        <div className="min-w-0">
          <h2 className="text-lg font-black text-slate-900 truncate leading-tight">{store.store_name}</h2>
          <p className="text-[9px] font-bold text-amber-600 uppercase tracking-[0.2em]">Inventory & Pricing</p>
        </div>
      </div>

      <div className="relative px-2">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
        <input 
          type="text" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="銘柄・ID・国名で検索..." 
          className="w-full h-14 pl-14 pr-6 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 ring-amber-500/5 shadow-sm" 
        />
      </div>

      <div className="grid gap-4 px-2">
        {loading ? (
          <div className="py-32 text-center">
            <Loader2 className="animate-spin mx-auto text-slate-200 mb-4" size={40} />
            <p className="font-black text-slate-300 text-[10px] uppercase tracking-widest">Synchronizing Master DB...</p>
          </div>
        ) : filtered.map(w => {
          const item = inv[w.id];
          const isActive = !!item;
          return (
            <div key={w.id} className={`bg-white border-2 rounded-[2.5rem] p-5 transition-all duration-300 ${isActive ? 'border-amber-500 shadow-xl' : 'border-slate-100 opacity-70'}`}>
              <div className="flex gap-4">
                <div className="relative shrink-0">
                  <img src={w.image_url} className="w-16 h-28 object-contain bg-slate-50 rounded-2xl p-2 border" alt="" />
                  {isActive && <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg"><Check size={14} strokeWidth={4}/></div>}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">ID: {w.id}</span>
                      <span className="text-[8px] font-black text-amber-600 uppercase">{w.country}</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-800 line-clamp-2 leading-tight mb-2">{w.name_jp}</h4>
                  </div>
                  <button 
                    onClick={() => toggleWine(w)} 
                    className={`h-10 px-4 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] transition-all ${isActive ? 'bg-amber-100 text-amber-700' : 'bg-slate-900 text-white shadow-md'}`}
                  >
                    {isActive ? <Trash2 size={14}/> : <Plus size={14}/>}
                    {isActive ? 'メニューから外す' : 'メニューに採用'}
                  </button>
                </div>
                <div className="hidden sm:block"><AdminRadar data={w} /></div>
              </div>

              {isActive && (
                <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-50 animate-in slide-in-from-top-2">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1"><Coins size={10}/> Bottle</label>
                    <input 
                      type="number" 
                      value={item.price_bottle} 
                      onChange={e => setInv({...inv, [w.id]: {...item, price_bottle: parseInt(e.target.value) || 0}})}
                      className="w-full h-11 bg-slate-50 border rounded-xl px-3 text-xs font-black outline-none focus:ring-2 ring-amber-500/20" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1"><GlassWater size={10}/> Glass</label>
                    <input 
                      type="number" 
                      value={item.price_glass} 
                      onChange={e => setInv({...inv, [w.id]: {...item, price_glass: parseInt(e.target.value) || 0}})}
                      className="w-full h-11 bg-slate-50 border rounded-xl px-3 text-xs font-black outline-none focus:ring-2 ring-amber-500/20" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1"><Database size={10}/> Stock</label>
                    <input 
                      type="number" 
                      value={item.stock} 
                      onChange={e => setInv({...inv, [w.id]: {...item, stock: parseInt(e.target.value) || 0}})}
                      className="w-full h-11 bg-slate-50 border rounded-xl px-3 text-xs font-black outline-none focus:ring-2 ring-amber-500/20" 
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] w-[280px]">
        <button 
          onClick={handleUpdate} 
          disabled={syncing || loading}
          className={`w-full h-18 rounded-full flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 border-b-4 ${status?.type === 'success' ? 'bg-emerald-500 border-emerald-700 text-white' : 'bg-slate-900 border-black text-white'}`}
        >
          {syncing ? <Loader2 className="animate-spin" size={20}/> : status?.type === 'success' ? <CheckCircle2 size={20}/> : <Sparkles size={20} className="text-amber-500" />}
          {status?.msg || 'メニューに即時反映する'}
        </button>
      </div>
    </div>
  );
}

/**
 * メインダッシュボード
 */
export default function PierothAdmin() {
  const [view, setView] = useState<'stores' | 'inventory' | 'settings'>('stores');
  const [stores, setStores] = useState<any[]>([]);
  const [activeStore, setActiveStore] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await fetch(getSafeUrl('/api/store/list'));
      if (res.ok) setStores(await res.json()); 
      else setStores(FALLBACK_STORES);
    } catch { setStores(FALLBACK_STORES); }
    setLoading(false);
  };

  useEffect(() => { fetchStores(); }, []);

  const handleLogout = () => {
    // 簡易的なログアウト処理
    window.location.href = getSafeUrl('/admin/login');
  };

  if (view === 'inventory' && activeStore) return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto p-4"><InventoryView store={activeStore} onBack={() => { setView('stores'); setActiveStore(null); }} /></div>
    </main>
  );

  if (view === 'settings') return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto p-4"><StoreSettingsView store={activeStore} onBack={() => { setView('stores'); setActiveStore(null); }} onSuccess={() => { setView('stores'); fetchStores(); }} /></div>
    </main>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-40 font-sans">
      {/* ヘッダー */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-amber-500 shadow-md rotate-2 transition-transform hover:rotate-0"><LayoutGrid size={22} strokeWidth={3} /></div>
          <div>
            <h1 className="text-base font-black italic text-slate-900 uppercase leading-none tracking-tighter">PIEROTH MS</h1>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Management SaaS</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2.5 bg-red-50 text-red-500 rounded-full border border-red-100 active:scale-90 transition-all"><LogOut size={18} /></button>
      </header>

      {/* コンテンツエリア */}
      <main className="max-w-2xl mx-auto p-5 space-y-8 relative z-10">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-2xl font-black text-slate-900">担当店舗一覧</h2>
          <button onClick={() => { setActiveStore(null); setView('settings'); }} className="w-12 h-12 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all border-b-4 border-black"><Plus size={24} strokeWidth={4} /></button>
        </div>

        <div className="grid gap-4">
          {loading ? (
            [1, 2].map(i => <div key={i} className="h-44 bg-white border rounded-[2.2rem] animate-pulse" />)
          ) : stores.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-slate-200">
              <Store className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="font-bold text-slate-400">登録されている店舗がありません</p>
            </div>
          ) : stores.map(store => (
            <div key={store.slug} className="group bg-white border border-slate-200 rounded-[2.2rem] p-6 hover:border-amber-500/30 transition-all duration-500 relative overflow-hidden shadow-sm hover:shadow-xl">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg relative" style={{ backgroundColor: store.theme_color || '#b45309' }}>
                    <Store size={32} />
                    <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-lg text-slate-900 shadow-sm border border-slate-100"><QrCode size={12}/></div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors truncate max-w-[200px]">{store.store_name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider">pieroth.jp/{store.slug}</p>
                  </div>
                </div>
                <button onClick={() => { setActiveStore(store); setView('settings'); }} className="p-3 text-slate-300 hover:text-slate-900 active:scale-90 transition-all rounded-full hover:bg-slate-50"><Settings size={20}/></button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => { setActiveStore(store); setView('inventory'); }} 
                  className="h-14 bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 shadow-md hover:bg-slate-800 transition-all"
                >
                  <Database size={16}/> 在庫・価格編集
                </button>
                <button 
                  onClick={() => window.open(getSafeUrl(`/${store.slug}`), '_blank')} 
                  className="h-14 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-95 transition-all"
                >
                  公開メニュー <ExternalLink size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* パートナー用ポータルセクション */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="text-amber-500" size={24} />
              <h3 className="text-lg font-black italic">飲食店様ログイン</h3>
            </div>
            <p className="text-xs text-slate-400 font-bold leading-relaxed">
              取引先飲食店様ご自身で在庫状況のみを<br/>更新いただける専用画面です。
            </p>
            <button 
              onClick={() => window.open(getSafeUrl('/partner/login'), '_blank')} 
              className="w-full py-4 bg-white text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
            >
              <LogIn size={18}/> パートナー画面を開く
            </button>
          </div>
        </div>
      </main>

      {/* フッターナビゲーション */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-fit bg-white/95 backdrop-blur-md border border-slate-200 rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex items-center px-2 py-2 gap-1 z-[150]">
        <button 
          onClick={() => { setView('stores'); fetchStores(); }} 
          className={`flex items-center gap-2.5 px-6 py-3 rounded-full transition-all duration-300 ${view === 'stores' || view === 'inventory' || view === 'settings' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
        >
          <Building2 size={18}/><span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
        </button>
        <div className="w-[1px] h-4 bg-slate-200 mx-1" />
        <button 
          onClick={() => window.location.href = getSafeUrl('/admin/master')} 
          className="flex items-center gap-2.5 px-6 py-3 rounded-full text-slate-400 hover:text-slate-900 transition-all duration-300"
        >
          <Database size={18}/><span className="text-[10px] font-black uppercase tracking-widest">Master DB</span>
        </button>
      </nav>
    </div>
  );
}
