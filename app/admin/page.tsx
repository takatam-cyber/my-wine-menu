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
  Briefcase, Edit3, GlassWater, Sparkles
} from 'lucide-react';

/**
 * プレビュー環境でのパス解決ヘルパー
 */
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
  const [syncing, setSyncing] = useState(false);

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
          invMap[w.id] = { 
            active: true, 
            price_bottle: w.price_bottle, 
            price_glass: w.price_glass || 0,
            stock: w.stock 
          }; 
        });
      }
      setInventory(invMap);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [slug]);

  // 掲載切り替え（チェックボタンのバグ修正版）
  const toggleVisibility = async (wineId: string) => {
    if (updatingId) return;
    setUpdatingId(wineId);
    try {
      const res = await fetch(getSafeUrl('/api/store/inventory/toggle'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, wineId })
      });
      
      if (res.ok) {
        // APIのレスポンスを待たずに、現在の状態に基づいてローカルステートをトグル
        setInventory(prev => {
          const next = { ...prev };
          if (next[wineId]) {
            delete next[wineId];
          } else {
            const m = master.find(x => x.id === wineId);
            next[wineId] = { 
              active: true, 
              price_bottle: m?.price_bottle || 0, 
              price_glass: m?.price_glass || 0,
              stock: m?.stock || 0 
            };
          }
          return next;
        });
      }
    } catch (e) { console.error("Toggle error:", e); }
    setUpdatingId(null);
  };

  // 価格・在庫の個別保存
  const updateField = async (wineId: string, field: string, value: number) => {
    try {
      await fetch(getSafeUrl('/api/store/inventory/update'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, wineId, [field]: value })
      });
      // 入力中の値をステートに反映
      setInventory(prev => ({
        ...prev,
        [wineId]: { ...prev[wineId], [field]: value }
      }));
    } catch (e) { console.error("Update error:", e); }
  };

  const handleReflectToMenu = async () => {
    setSyncing(true);
    await refresh(); // 最新情報を再取得して同期を確認
    setTimeout(() => setSyncing(false), 800);
  };

  const filtered = useMemo(() => 
    master.filter(w => 
      (w.name_jp || "").toLowerCase().includes(search.toLowerCase()) || 
      (w.id || "").toLowerCase().includes(search.toLowerCase())
    ).slice(0, 60),
    [master, search]
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-32">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100 active:bg-slate-50 transition-all">
            <ArrowLeft size={20}/>
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800 leading-none">{slug}</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Direct Edit Mode</p>
          </div>
        </div>
        
        {/* メニューに反映させるボタン */}
        <button 
          onClick={handleReflectToMenu}
          disabled={syncing}
          className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white rounded-2xl font-black text-xs shadow-[0_10px_20px_rgba(245,158,11,0.3)] active:scale-95 transition-all disabled:opacity-50"
        >
          {syncing ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>}
          メニューに反映
        </button>
      </div>

      <div className="sticky top-0 z-20 py-2 bg-slate-50/80 backdrop-blur-md">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input 
            type="text" placeholder="商品名・IDで検索..." 
            className="w-full h-14 pl-12 pr-4 bg-white rounded-2xl border border-slate-100 shadow-sm font-bold text-sm outline-none focus:border-amber-500 transition-all"
            value={search} onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-amber-500" size={32} />
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Loading Store Menu...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(w => {
            const inv = inventory[w.id];
            const isActive = !!inv;
            return (
              <div 
                key={w.id} 
                className={`bg-white p-5 rounded-[2.2rem] border-2 flex flex-col gap-4 transition-all ${
                  isActive ? 'border-amber-500 shadow-xl' : 'border-transparent opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-20 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                    <img src={w.image_url} className="max-h-full object-contain" alt="" onError={(e:any)=>e.target.src='https://placehold.co/100x150?text=WINE'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase">ID: {w.id}</span>
                      <span className="text-[8px] font-black text-slate-300 truncate">{w.country}</span>
                    </div>
                    <h4 className="font-black text-slate-900 text-[13px] leading-tight line-clamp-2">{w.name_jp}</h4>
                  </div>
                  
                  {/* チェックボタン（掲載トグル） */}
                  <button 
                    onClick={() => toggleVisibility(w.id)}
                    disabled={updatingId === w.id}
                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all shadow-md active:scale-90 ${
                      isActive ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-200'
                    }`}
                  >
                    {updatingId === w.id ? <Loader2 className="animate-spin" size={20}/> : <Check size={26} strokeWidth={4}/>}
                  </button>
                </div>

                {isActive && (
                  <div className="space-y-3 pt-3 border-t border-slate-50">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase ml-2">
                          <Edit3 size={10}/> ボトル価格 (¥)
                        </div>
                        <input 
                          type="number" 
                          className="w-full h-11 px-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-amber-500 transition-all"
                          defaultValue={inv.price_bottle}
                          onBlur={(e) => updateField(w.id, 'price_bottle', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase ml-2">
                          <GlassWater size={10}/> グラス価格 (¥)
                        </div>
                        <input 
                          type="number" 
                          placeholder="0"
                          className="w-full h-11 px-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-amber-500 transition-all"
                          defaultValue={inv.price_glass}
                          onBlur={(e) => updateField(w.id, 'price_glass', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase ml-2">
                        <Database size={10}/> 在庫数 (本)
                      </div>
                      <input 
                        type="number" 
                        className="w-full h-11 px-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-amber-500 transition-all"
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

// --- 2. 店舗設定 (Store Settings) ---
function StoreSettingsView({ editSlug, onBack }: { editSlug: string | null, onBack: () => void }) {
  const [formData, setFormData] = useState({ name: '', slug: '', color: '#b45309' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);

  useEffect(() => {
    if (editSlug) {
      setLoading(true);
      fetch(getSafeUrl(`/api/store/config/public?slug=${editSlug}`))
        .then(res => res.json())
        .then(data => setFormData({ 
          name: data.store_name, 
          slug: editSlug, 
          color: data.theme_color || '#b45309' 
        }))
        .finally(() => setLoading(false));
    }
  }, [editSlug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(getSafeUrl('/api/store/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, is_edit: !!editSlug }),
      });
      if (res.ok) {
        setStatus({ type: 'success', msg: '保存完了' });
        setTimeout(onBack, 1000);
      } else {
        setStatus({ type: 'error', msg: 'エラーが発生しました' });
      }
    } catch (e) { setStatus({ type: 'error', msg: '通信失敗' }); }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4">
      <div className="flex items-center gap-3 px-2">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black">{editSlug ? '店舗編集' : '新規開設'}</h2>
      </div>
      <form onSubmit={handleSave} className="bg-white p-6 rounded-[2rem] shadow-xl space-y-6 border border-slate-100">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">店舗名称</label>
          <input type="text" required className="w-full h-14 px-5 bg-slate-50 rounded-2xl border border-slate-100 font-bold outline-none focus:border-amber-500 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">URLスラッグ</label>
          <input type="text" required disabled={!!editSlug} className="w-full h-14 px-5 bg-slate-50 rounded-2xl border border-slate-100 font-bold disabled:opacity-50" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} />
        </div>
        <button type="submit" disabled={loading} className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2">
          {loading ? <Loader2 className="animate-spin" /> : <Save size={20}/>} 保存する
        </button>
        {status && <div className={`text-center font-bold text-sm ${status.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>{status.msg}</div>}
      </form>
    </div>
  );
}

// --- 3. マスター管理 (Master Data Manager) ---
function MasterDataManagerView({ onBack }: { onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSync = async () => {
    if (!file) return;
    setLoading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await fetch(getSafeUrl('/api/master/bulk'), { method: 'POST', body: fd });
      if (res.ok) { setStatus("同期成功！"); setFile(null); }
      else { setStatus("エラーが発生しました"); }
    } catch (e) { setStatus("失敗"); }
    setLoading(false);
    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-32">
      <div className="flex items-center gap-3 px-2">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black text-slate-800">マスター一括管理</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => window.open(getSafeUrl('/api/master/export'), '_blank')} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-3 active:bg-slate-50 transition-all">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><FileDown size={28}/></div>
          <span className="text-[11px] font-black text-slate-600 uppercase">全マスター出力</span>
        </button>
        <button onClick={() => window.open(getSafeUrl('/api/master/template'), '_blank')} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-3 active:bg-slate-50 transition-all">
          <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl"><FileText size={28}/></div>
          <span className="text-[11px] font-black text-slate-600 uppercase">テンプレート</span>
        </button>
      </div>

      <div className="bg-white p-8 rounded-[3rem] border shadow-xl text-center space-y-8">
        <div className="p-5 bg-amber-500/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto border border-amber-500/20">
          <Database size={40} className="text-amber-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black">カタログ全同期</h3>
          <p className="text-[11px] text-slate-400 font-bold px-4">
            インポーター本部の全34項目を上書き更新します。
          </p>
        </div>

        <div className="relative h-36 border-4 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center bg-slate-50/50 group active:border-amber-500 transition-all">
          <input type="file" accept=".csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFile(e.target.files?.[0] || null)} />
          <Upload size={32} className={`mb-2 transition-all ${file ? 'text-amber-500' : 'text-slate-200'}`} />
          <p className="text-[10px] font-black text-slate-400 px-6 truncate">{file ? file.name : 'CSVをタップして選択'}</p>
        </div>

        <button disabled={!file || loading} onClick={handleSync} className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-lg active:scale-95 disabled:opacity-30 transition-all">
          {loading ? <RefreshCw className="animate-spin mx-auto" size={24}/> : 'マスターを同期する'}
        </button>
        {status && <div className="text-sm font-black text-amber-600 animate-bounce">{status}</div>}
      </div>
    </div>
  );
}

/**
 * =====================================================================
 * MAIN APP
 * =====================================================================
 */
export default function App() {
  const [view, setView] = useState<'dashboard' | 'settings' | 'inventory' | 'master'>('dashboard');
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState<{slug: string, name: string} | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(getSafeUrl('/api/store/list'));
      if (res.ok) setStores(await res.json());
    } catch (e) { console.warn("API connect error"); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleLogout = async () => {
    await fetch(getSafeUrl('/api/auth/logout'), { method: 'POST' });
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans selection:bg-amber-100 antialiased overflow-x-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setView('dashboard'); setActiveSlug(null); }}>
          <div className="p-2 bg-slate-900 text-amber-500 rounded-xl group-active:scale-90 transition-all shadow-lg">
            <LayoutDashboard size={20} />
          </div>
          <h1 className="text-xl font-black italic tracking-tighter">PIEROTH <span className="font-light text-slate-300 text-sm not-italic ml-1">MS</span></h1>
        </div>
        <button onClick={handleLogout} className="p-2.5 text-slate-400 bg-slate-50 rounded-full active:bg-red-50 active:text-red-500 transition-colors"><LogOut size={20} /></button>
      </header>

      <main className="max-w-xl mx-auto p-5">
        {view === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">担当店舗</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Store Assets</p>
              </div>
              <button onClick={() => { setEditSlug(null); setView('settings'); }} className="w-14 h-14 bg-amber-500 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all">
                <Plus size={28}/>
              </button>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center gap-4 opacity-20"><Wine size={48} className="animate-bounce" /><p className="text-xs font-black uppercase tracking-widest">Syncing...</p></div>
            ) : (
              <div className="grid gap-5">
                {stores.length === 0 ? (
                  <div className="bg-white p-12 rounded-[2.5rem] border-4 border-dashed border-slate-100 text-center"><p className="font-bold text-slate-300 text-sm italic">管理店舗がありません</p></div>
                ) : stores.map(store => (
                  <div key={store.slug} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 flex flex-col gap-5 hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl rotate-1" style={{ backgroundColor: store.theme_color || '#b45309' }}><Store size={32}/></div>
                        <div>
                          <h3 className="font-black text-xl text-slate-800 leading-tight">{store.store_name}</h3>
                          <p className="text-[10px] text-slate-300 font-black tracking-widest mt-1">/{store.slug}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setQrModal({slug: store.slug, name: store.store_name})} className="p-3 text-slate-300 hover:text-amber-500 transition-colors"><QrCode size={22}/></button>
                        <button onClick={() => { setEditSlug(store.slug); setView('settings'); }} className="p-3 text-slate-300 hover:text-slate-900 transition-colors"><Settings size={22}/></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => { setActiveSlug(store.slug); setView('inventory'); }} className="h-16 bg-slate-900 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                        在庫・価格管理 <ChevronRight size={14}/>
                      </button>
                      <button onClick={() => window.open(`/${store.slug}`, '_blank')} className="h-16 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-xs flex items-center justify-center gap-2 active:bg-slate-50 transition-all shadow-sm">
                        メニュー表示 <ExternalLink size={14}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'settings' && <StoreSettingsView editSlug={editSlug} onBack={() => { setView('dashboard'); loadData(); }} />}
        {view === 'inventory' && activeSlug && <InventoryManagerView slug={activeSlug} onBack={() => setView('dashboard')} />}
        {view === 'master' && <MasterDataManagerView onBack={() => setView('dashboard')} />}
      </main>

      {/* Footer Nav */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-sm h-18 bg-white/95 backdrop-blur-xl border border-slate-200 px-2 rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.15)] flex justify-around items-center z-[150] transition-all">
        <button onClick={() => { setView('dashboard'); setActiveSlug(null); }} className={`flex flex-col items-center flex-1 transition-all ${view === 'dashboard' ? 'text-amber-500 scale-110' : 'text-slate-300'}`}>
          <LayoutDashboard size={26}/><span className="text-[8px] font-black uppercase tracking-widest">Dashboard</span>
        </button>
        <button onClick={() => setView('master')} className={`flex flex-col items-center flex-1 transition-all ${view === 'master' ? 'text-amber-500 scale-110' : 'text-slate-300'}`}>
          <Database size={26}/><span className="text-[8px] font-black uppercase tracking-widest">Master</span>
        </button>
      </nav>

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setQrModal(null)}>
          <div className="bg-white p-8 rounded-[3.5rem] shadow-2xl max-w-xs w-full text-center space-y-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Menu Access QR</h3>
            <div className="aspect-square bg-slate-50 rounded-[3rem] border-8 border-slate-50 overflow-hidden shadow-inner flex items-center justify-center p-6 relative">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(getSafeUrl('/' + qrModal.slug))}`} alt="QR" className="w-full h-full mix-blend-multiply" />
            </div>
            <p className="font-black text-xl text-slate-900 leading-tight">{qrModal.name}</p>
            <button onClick={() => setQrModal(null)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm active:scale-95 shadow-xl">閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}
