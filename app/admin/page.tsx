"use client";

export const runtime = 'edge';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Store, Plus, Search, Database, LogOut, 
  ExternalLink, Settings, X, Loader2, ArrowLeft, 
  CheckCircle2, AlertCircle, Save, Wine, Sparkles, 
  LayoutGrid, Coins, Check, GlassWater, Building2,
  LogIn, ChevronRight, QrCode, Trash2, BarChart3, Mail,
  TrendingUp, Users, Calendar, Filter, Eye, EyeOff
} from 'lucide-react';

/**
 * ユーティリティ: 環境に応じた安全なURL生成
 */
const getSafeUrl = (path: string) => {
  if (typeof window === 'undefined') return path;
  if (!path) return '/';
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  try {
    const origin = window.location.origin;
    if (origin && origin !== 'null' && !origin.startsWith('blob:')) {
      return origin.replace(/\/+$/, '') + cleanPath;
    }
    const base = window.location.href.split('?')[0].split('#')[0]
      .replace(/\/(admin|master|partner|\[slug\]).*/, '');
    return base.replace(/\/+$/, '') + cleanPath;
  } catch (e) {
    return cleanPath;
  }
};

/**
 * 在庫管理ビュー (InventoryView)
 */
function InventoryView({ store, onBack }: { store: any, onBack: () => void }) {
  const [masterWines, setMasterWines] = useState<any[]>([]);
  const [storeInventory, setStoreInventory] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [masterRes, storeRes] = await Promise.all([
          fetch(getSafeUrl('/api/master/list')),
          fetch(getSafeUrl(`/api/wines?slug=${store.slug}`))
        ]);
        
        const masters = await masterRes.json();
        const currentInven = await storeRes.json();
        
        setMasterWines(Array.isArray(masters) ? masters : []);
        
        const invenMap: Record<string, any> = {};
        if (Array.isArray(currentInven)) {
          currentInven.forEach(w => {
            invenMap[w.id] = {
              active: true,
              price_bottle: w.price_bottle,
              price_glass: w.price_glass,
              stock: w.stock ?? 12
            };
          });
        }
        setStoreInventory(invenMap);
      } catch (e) {
        console.error("Failed to load inventory data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [store.slug]);

  const filteredWines = useMemo(() => {
    return masterWines.filter(w => 
      w.name_jp?.includes(search) || w.name_en?.toLowerCase().includes(search.toLowerCase())
    );
  }, [masterWines, search]);

  const handleSync = async () => {
    setSaving(true);
    try {
      const res = await fetch(getSafeUrl('/api/store/inventory/sync'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: store.slug,
          inventory: storeInventory
        })
      });
      if (res.ok) {
        setStatus({ type: 'success', msg: 'メニューを反映しました' });
        setTimeout(() => setStatus(null), 3000);
      }
    } catch (e) {
      setStatus({ type: 'error', msg: '反映に失敗しました' });
    }
    setSaving(false);
  };

  const toggleWine = (id: string, master: any) => {
    setStoreInventory(prev => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = {
          active: true,
          price_bottle: master.price_bottle,
          price_glass: master.price_glass || Math.floor(master.price_bottle / 5),
          stock: 12
        };
      }
      return next;
    });
  };

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-500">
      <div className="sticky top-16 z-40 bg-slate-50/80 backdrop-blur-md py-4 flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-3 bg-white shadow-sm border rounded-full text-slate-400 active:scale-90 transition-transform"><ArrowLeft size={20}/></button>
          <div>
            <h2 className="text-lg font-black text-slate-900 leading-none truncate max-w-[150px]">{store.store_name}</h2>
            <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mt-1">Inventory Management</p>
          </div>
        </div>
        <button 
          onClick={handleSync}
          disabled={saving}
          className="bg-slate-900 text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl active:scale-95 disabled:opacity-50 transition-all"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Menu Reflect
        </button>
      </div>

      <div className="relative group px-2">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
        <input 
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="マスターDBからワインを検索..." 
          className="w-full h-14 pl-14 pr-6 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all" 
        />
      </div>

      <div className="space-y-3 px-2">
        {loading ? (
          <div className="py-20 text-center text-slate-300 font-black animate-pulse uppercase tracking-widest">Accessing Master DB...</div>
        ) : filteredWines.map(w => {
          const isActive = !!storeInventory[w.id];
          return (
            <div key={w.id} className={`bg-white border transition-all duration-300 rounded-[2rem] p-4 flex gap-4 ${isActive ? 'border-indigo-500 ring-4 ring-indigo-500/5' : 'border-slate-100 opacity-70'}`}>
              <div className="w-14 h-24 bg-slate-50 rounded-2xl p-2 shrink-0 flex items-center justify-center relative">
                <img src={w.image_url} className="w-full h-full object-contain" alt="" />
                <button 
                  onClick={() => toggleWine(w.id, w)}
                  className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all ${isActive ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-200 text-slate-400'}`}
                >
                  {isActive ? <Check size={16} strokeWidth={4} /> : <Plus size={16} strokeWidth={4} />}
                </button>
              </div>
              
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{w.country} • {w.vintage}</p>
                  <h3 className="text-xs font-black text-slate-900 leading-snug line-clamp-2">{w.name_jp}</h3>
                </div>

                {isActive && (
                  <div className="grid grid-cols-2 gap-2 animate-in zoom-in-95 duration-300">
                    <div className="space-y-1">
                      <span className="text-[7px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1"><Coins size={8}/> Btl (¥)</span>
                      <input 
                        type="number"
                        value={storeInventory[w.id].price_bottle}
                        onChange={e => setStoreInventory(prev => ({...prev, [w.id]: {...prev[w.id], price_bottle: parseInt(e.target.value)}}))}
                        className="w-full h-10 bg-slate-50 border border-slate-100 rounded-xl px-3 text-[10px] font-black outline-none focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[7px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1"><GlassWater size={8}/> Gls (¥)</span>
                      <input 
                        type="number"
                        value={storeInventory[w.id].price_glass}
                        onChange={e => setStoreInventory(prev => ({...prev, [w.id]: {...prev[w.id], price_glass: parseInt(e.target.value)}}))}
                        className="w-full h-10 bg-slate-50 border border-slate-100 rounded-xl px-3 text-[10px] font-black outline-none focus:bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {status && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-4 ${status.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {status.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
          <span className="text-xs font-black uppercase tracking-widest">{status.msg}</span>
        </div>
      )}
    </div>
  );
}

/**
 * 分析ビューコンポーネント
 */
function AnalyticsView({ store, onBack }: { store: any, onBack: () => void }) {
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const url = getSafeUrl(`/api/analytics/report?slug=${store.slug}`);
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setReport(Array.isArray(data) ? data : []);
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchReport();
  }, [store.slug]);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 px-2">
        <button onClick={onBack} className="p-3 bg-white shadow-sm border rounded-full text-slate-400 active:scale-90"><ArrowLeft size={20}/></button>
        <div>
          <h2 className="text-xl font-black text-slate-900 leading-none truncate max-w-[200px]">{store.store_name}</h2>
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1 flex items-center gap-1">
            <TrendingUp size={12}/> Popularity Insight
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-8 bg-indigo-600 text-white">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Total Interactions</p>
          <h3 className="text-4xl font-black">{report.reduce((acc, curr) => acc + (curr.view_count || 0), 0)} <span className="text-sm font-bold opacity-60 uppercase">Views</span></h3>
        </div>
        
        <div className="p-6 space-y-4">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Wine Ranking</h4>
          {loading ? (
            <div className="py-12 text-center text-slate-300 font-bold animate-pulse">ANALYZING DATA...</div>
          ) : report.length === 0 ? (
            <div className="py-12 text-center text-slate-300 font-bold">NO DATA YET</div>
          ) : (
            <div className="space-y-3">
              {report.map((item, i) => (
                <div key={item.wine_id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800 truncate">{item.name_jp}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">ID: {item.wine_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-indigo-600 leading-none">{item.view_count}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Hits</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 店舗設定ビュー
 */
function StoreSettingsView({ store, onBack, onSuccess }: { store: any | null, onBack: () => void, onSuccess: () => void }) {
  const [name, setName] = useState(store?.store_name || '');
  const [slug, setSlug] = useState(store?.slug || '');
  const [email, setEmail] = useState(store?.staff_email || '');
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
        body: JSON.stringify({ 
          store_name: name, slug: slug.trim().toLowerCase(), 
          theme_color: color, access_password: password, 
          staff_email: email, is_edit: !!store 
        }),
      });
      if (res.ok) onSuccess();
      else setError('保存に失敗しました。');
    } catch { setError('通信エラーが発生しました'); }
    setLoading(false);
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-4 px-2">
        <button onClick={onBack} className="p-3 bg-white shadow-sm border rounded-full text-slate-400 active:scale-90"><ArrowLeft size={20}/></button>
        <div>
          <h2 className="text-xl font-black text-slate-900">{store ? '店舗編集' : '新規店舗登録'}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Store Config</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">担当営業 Email</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="yourname@pieroth.jp" className="w-full h-14 pl-14 pr-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 ring-amber-500/10 focus:border-amber-500 transition-all" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">店舗名称</label>
            <div className="relative">
              <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="例：ピーロート日比谷店" className="w-full h-14 pl-14 pr-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 ring-amber-500/10 focus:border-amber-500 transition-all" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">URLスラッグ</label>
            <input type="text" required disabled={!!store} value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="hibiya-pieroth" className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">店舗ログインPW</label>
            <input type="text" required value={password} onChange={e => setPassword(e.target.value)} placeholder="店舗側で編集する際のパスワード" className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" />
          </div>
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-[11px] font-bold flex items-center gap-2"><AlertCircle size={14}/> {error}</div>}
          <button type="submit" disabled={loading} className="w-full h-18 bg-slate-900 text-white rounded-[1.5rem] font-black text-base flex items-center justify-center gap-3 active:scale-95 shadow-lg transition-all">
            {loading ? <Loader2 className="animate-spin" /> : <Save size={22} />} 設定を保存する
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * メインダッシュボード
 */
export default function PierothAdmin() {
  const [view, setView] = useState<'stores' | 'inventory' | 'settings' | 'analytics'>('stores');
  const [stores, setStores] = useState<any[]>([]);
  const [activeStore, setActiveStore] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(getSafeUrl('/api/store/list'));
      if (res.ok) {
        const data = await res.json();
        setStores(Array.isArray(data) ? data : []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  const navigateTo = (path: string) => {
    const url = getSafeUrl(path);
    if (url) window.location.href = url;
  };

  // ビューの絞り込み判定
  if (view === 'inventory' && activeStore) return <main className="min-h-screen bg-slate-50 p-4"><div className="max-w-2xl mx-auto"><InventoryView store={activeStore} onBack={() => { setView('stores'); setActiveStore(null); }} /></div></main>;
  if (view === 'analytics' && activeStore) return <main className="min-h-screen bg-slate-50 p-4"><div className="max-w-2xl mx-auto"><AnalyticsView store={activeStore} onBack={() => { setView('stores'); setActiveStore(null); }} /></div></main>;
  if (view === 'settings') return <main className="min-h-screen bg-slate-50 p-4"><div className="max-w-2xl mx-auto"><StoreSettingsView store={activeStore} onBack={() => { setView('stores'); setActiveStore(null); }} onSuccess={() => { setView('stores'); fetchStores(); }} /></div></main>;

  // ここに到達した時点で view は 'stores', 'inventory'(storeなし), 'analytics'(storeなし) のいずれか
  // ビューの比較における型エラーを回避するためのキャストを適用
  const currentView = view as string;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-40 font-sans">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-amber-500 shadow-md rotate-2 transition-transform hover:rotate-0"><LayoutGrid size={22} strokeWidth={3} /></div>
          <div>
            <h1 className="text-base font-black italic text-slate-900 uppercase leading-none tracking-tighter">PIEROTH MS</h1>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Management Dashboard</p>
          </div>
        </div>
        <button onClick={() => navigateTo('/admin/login')} className="p-2.5 bg-red-50 text-red-500 rounded-full border border-red-100 active:scale-90 transition-all"><LogOut size={18} /></button>
      </header>

      <main className="max-w-2xl mx-auto p-5 space-y-8 relative z-10">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-2xl font-black text-slate-900">担当店舗一覧</h2>
          <button onClick={() => { setActiveStore(null); setView('settings'); }} className="w-12 h-12 bg-slate-900 text-white rounded-[1.5rem] shadow-xl flex items-center justify-center active:scale-90 transition-all"><Plus size={24} strokeWidth={3} /></button>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="py-24 text-center font-black text-slate-200 animate-pulse uppercase tracking-[0.3em]">Loading Stores...</div>
          ) : stores.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-12 text-center border border-dashed border-slate-200">
              <Store className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="font-bold text-slate-400">登録されている店舗がありません</p>
            </div>
          ) : stores.map(store => (
            <div key={store.slug} className="group bg-white border border-slate-200 rounded-[2.5rem] p-6 hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden shadow-sm hover:shadow-xl">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: store.theme_color || '#b45309' }}>
                    <Store size={28} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate max-w-[200px]">{store.store_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[9px] font-bold text-slate-400 tracking-wider">/{store.slug}</p>
                      <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                      <p className="text-[9px] font-bold text-slate-400 truncate max-w-[120px]">{store.staff_email}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setActiveStore(store); setView('analytics'); }} className="p-3 text-slate-300 hover:text-indigo-600 active:scale-90 transition-all rounded-full hover:bg-indigo-50"><BarChart3 size={20}/></button>
                  <button onClick={() => { setActiveStore(store); setView('settings'); }} className="p-3 text-slate-300 hover:text-slate-900 active:scale-90 transition-all rounded-full hover:bg-slate-50"><Settings size={20}/></button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setActiveStore(store); setView('inventory'); }} className="h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 shadow-md hover:bg-slate-800 transition-all"><Database size={16}/> 在庫・価格管理</button>
                <button onClick={() => window.open(getSafeUrl(`/${store.slug}`), '_blank')} className="h-14 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-95 transition-all">公開メニュー <ExternalLink size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-fit bg-white/95 backdrop-blur-md border border-slate-200 rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex items-center px-2 py-2 gap-1 z-[150]">
        <button 
          onClick={() => setView('stores')} 
          className={`flex items-center gap-2.5 px-6 py-3 rounded-full transition-all duration-300 ${currentView === 'stores' || currentView === 'analytics' || currentView === 'settings' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
        >
          <Building2 size={18}/>
          <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
        </button>
        <div className="w-[1px] h-4 bg-slate-200 mx-1" />
        <button 
          onClick={() => navigateTo('/admin/master')} 
          className="flex items-center gap-2.5 px-6 py-3 rounded-full text-slate-400 hover:text-slate-900 transition-all duration-300"
        >
          <Database size={18}/>
          <span className="text-[10px] font-black uppercase tracking-widest">Master DB</span>
        </button>
      </nav>
    </div>
  );
}
