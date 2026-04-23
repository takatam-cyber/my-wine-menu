// app/admin/page.tsx
"use client";

export const runtime = 'edge';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, Plus, Search, Database, LayoutDashboard, LogOut, 
  ExternalLink, Settings, QrCode, TrendingUp, X, ChevronRight, 
  Loader2, ArrowLeft, Download, FileText, Upload, Check, 
  CheckCircle2, AlertCircle, Save, Palette, Globe, FileSpreadsheet,
  RefreshCw, Menu, FileDown, History, Wine, MapPin, Calendar,
  Briefcase, Edit3
} from 'lucide-react';

const getSafeUrl = (path: string) => {
  if (!path) return '#';
  if (typeof window === 'undefined') return path;
  try {
    const origin = window.location.origin;
    if (!origin || origin === 'null' || origin.startsWith('blob:')) {
      return path.startsWith('/') ? path : `/${path}`;
    }
    return new URL(path, origin).href;
  } catch (e) {
    return path;
  }
};

/**
 * =====================================================================
 * SUB-COMPONENTS
 * =====================================================================
 */

// --- 1. 在庫管理 (Inventory Manager) ---
function InventoryManagerView({ slug, onBack }: { slug: string, onBack: () => void }) {
  const [master, setMaster] = useState<any[]>([]);
  const [inventory, setInventory] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const refresh = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const [mRes, sRes] = await Promise.all([
        fetch(getSafeUrl('/api/master/list')),
        fetch(getSafeUrl(`/api/wines?slug=${slug}`))
      ]);
      const mData = await mRes.json();
      const sData = await sRes.json();
      setMaster(Array.isArray(mData) ? mData : []);
      const invMap: any = {};
      if (Array.isArray(sData)) {
        sData.forEach((w: any) => { 
          invMap[w.id] = { active: true, price_bottle: w.price_bottle, stock: w.stock }; 
        });
      }
      setInventory(invMap);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [slug]);

  // 掲載切り替え（チェックマーククリック）
  const toggleVisibility = async (wineId: string) => {
    setUpdatingId(wineId);
    try {
      const res = await fetch(getSafeUrl('/api/store/inventory/toggle'), {
        method: 'POST',
        body: JSON.stringify({ slug, wineId })
      });
      if (res.ok) await refresh();
    } catch (e) { console.error(e); }
    setUpdatingId(null);
  };

  // 価格・在庫の個別保存
  const updateField = async (wineId: string, field: string, value: number) => {
    try {
      await fetch(getSafeUrl('/api/store/inventory/update'), {
        method: 'POST',
        body: JSON.stringify({ slug, wineId, [field]: value })
      });
      // 内部ステートのみ更新してレスポンス向上
      setInventory(prev => ({
        ...prev,
        [wineId]: { ...prev[wineId], [field]: value }
      }));
    } catch (e) { console.error(e); }
  };

  const filtered = useMemo(() => 
    master.filter(w => 
      (w.name_jp || "").toLowerCase().includes(search.toLowerCase()) || 
      (w.id || "").toLowerCase().includes(search.toLowerCase())
    ).slice(0, 50),
    [master, search]
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-32">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100 active:bg-slate-50"><ArrowLeft size={20}/></button>
          <div>
            <h2 className="text-xl font-black text-slate-800 leading-none">{slug}</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Direct Edit Mode</p>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-20 py-2 bg-slate-50/80 backdrop-blur-md">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input 
            type="text" placeholder="商品名で検索..." 
            className="w-full h-14 pl-12 pr-4 bg-white rounded-2xl border border-slate-100 shadow-sm font-bold text-sm outline-none focus:border-amber-500 transition-all"
            value={search} onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-amber-500" size={32} />
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(w => {
            const inv = inventory[w.id];
            return (
              <div 
                key={w.id} 
                className={`bg-white p-5 rounded-[2rem] border-2 flex flex-col gap-4 transition-all ${
                  inv?.active ? 'border-amber-500 shadow-lg' : 'border-transparent opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-20 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                    <img src={w.image_url} className="max-h-full object-contain" alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase">ID: {w.id}</span>
                      <span className="text-[8px] font-black text-slate-300">{w.country}</span>
                    </div>
                    <h4 className="font-black text-slate-900 text-sm leading-snug line-clamp-2">{w.name_jp}</h4>
                  </div>
                  <button 
                    onClick={() => toggleVisibility(w.id)}
                    disabled={updatingId === w.id}
                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all shadow-md active:scale-90 ${
                      inv?.active ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-300'
                    }`}
                  >
                    {updatingId === w.id ? <Loader2 className="animate-spin" size={20}/> : <Check size={24} strokeWidth={4}/>}
                  </button>
                </div>

                {inv?.active && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Bottle Price (¥)</label>
                      <input 
                        type="number" 
                        className="w-full h-12 px-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-amber-500"
                        defaultValue={inv.price_bottle}
                        onBlur={(e) => updateField(w.id, 'price_bottle', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Stock (Qty)</label>
                      <input 
                        type="number" 
                        className="w-full h-12 px-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-amber-500"
                        defaultValue={inv.stock}
                        onBlur={(e) => updateField(w.id, 'stock', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- 2. 店舗設定 & 3. マスター管理 (省略 - 必要に応じて保持) ---
// （以下、前のコードの他ViewとAppコンポーネントを InventoryManagerView を使って統合）

export default function App() {
  const [view, setView] = useState<'dashboard' | 'settings' | 'inventory' | 'master'>('dashboard');
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(getSafeUrl('/api/store/list'));
      if (res.ok) setStores(await res.json());
    } catch (e) { console.warn("D1 Sync Error"); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans selection:bg-amber-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-[100]">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setView('dashboard'); setActiveSlug(null); }}>
          <div className="p-2 bg-slate-900 text-amber-500 rounded-xl shadow-lg"><LayoutDashboard size={20} /></div>
          <h1 className="text-xl font-black italic tracking-tighter">PIEROTH MS</h1>
        </div>
        <button onClick={() => window.location.href='/admin/login'} className="p-2.5 text-slate-400 bg-slate-50 rounded-full"><LogOut size={20} /></button>
      </header>

      <main className="max-w-xl mx-auto p-5">
        {view === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">担当店舗</h2>
              <button onClick={() => setView('settings')} className="w-12 h-12 bg-amber-500 text-white rounded-2xl shadow-lg flex items-center justify-center active:scale-90"><Plus size={24}/></button>
            </div>
            <div className="grid gap-4">
              {stores.map(store => (
                <div key={store.slug} className="bg-white p-6 rounded-[2.2rem] shadow-sm border border-slate-50 flex flex-col gap-5 group">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl" style={{ backgroundColor: store.theme_color || '#b45309' }}><Store size={28}/></div>
                      <div>
                        <h3 className="font-black text-lg text-slate-800">{store.store_name}</h3>
                        <p className="text-[10px] text-slate-400 tracking-wider">/{store.slug}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => { setActiveSlug(store.slug); setView('inventory'); }} className="h-14 bg-slate-900 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95">
                      在庫・価格管理 <ChevronRight size={14}/>
                    </button>
                    <button onClick={() => window.open(`/${store.slug}`, '_blank')} className="h-14 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs flex items-center justify-center gap-2 active:bg-slate-50">
                      メニュー表示 <ExternalLink size={14}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'inventory' && activeSlug && <InventoryManagerView slug={activeSlug} onBack={() => setView('dashboard')} />}
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-sm h-18 bg-white/90 backdrop-blur-xl border border-slate-200 px-2 rounded-[2.5rem] shadow-2xl flex justify-around items-center z-[150]">
        <button onClick={() => { setView('dashboard'); setActiveSlug(null); }} className={`flex flex-col items-center flex-1 ${view === 'dashboard' ? 'text-amber-500' : 'text-slate-300'}`}><LayoutDashboard size={24}/><span className="text-[8px] font-black uppercase">Dashboard</span></button>
        <button onClick={() => setView('master')} className={`flex flex-col items-center flex-1 ${view === 'master' ? 'text-amber-500' : 'text-slate-300'}`}><Database size={24}/><span className="text-[8px] font-black uppercase">Master</span></button>
      </nav>
    </div>
  );
}
