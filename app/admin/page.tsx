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
  Briefcase
} from 'lucide-react';

/**
 * =====================================================================
 * PREVIEW-SAFE HELPERS (Robust URL Handling)
 * =====================================================================
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

const safeNavigate = (path: string) => {
  if (!path || typeof window === 'undefined') return;
  const target = getSafeUrl(path);
  if (target && target !== '#' && target !== '') {
    window.location.href = target;
  }
};

/**
 * =====================================================================
 * SUB-COMPONENTS
 * =====================================================================
 */

// --- 1. 店舗設定 (Store Settings) ---
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
        .finally(() => setLoading(false))
        .catch(() => setLoading(false));
    }
  }, [editSlug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.slug.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(getSafeUrl('/api/store/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          store_name: formData.name, 
          slug: formData.slug.toLowerCase().trim(), 
          theme_color: formData.color, 
          is_edit: !!editSlug 
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', msg: '保存しました。' });
        setTimeout(onBack, 1000);
      } else { 
        setStatus({ type: 'error', msg: result.error || '保存に失敗しました' }); 
      }
    } catch (e) { 
      setStatus({ type: 'error', msg: '通信エラーが発生しました' }); 
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-20">
      <div className="flex items-center gap-3 px-2">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100 transition-colors active:bg-slate-100">
          <ArrowLeft size={20}/>
        </button>
        <h2 className="text-xl font-black text-slate-800">{editSlug ? '店舗プロフィール編集' : '新規店舗を開設'}</h2>
      </div>
      
      <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-xl border border-slate-50 space-y-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">店舗名称</p>
            <input 
              type="text" 
              required 
              className="w-full h-14 px-5 bg-slate-50 rounded-2xl border border-slate-100 focus:border-amber-500 font-bold outline-none transition-all" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="例：レストラン・ピーロート" 
            />
          </div>
          
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">URLスラッグ（英数字のみ）</p>
            <input 
              type="text" 
              required 
              disabled={!!editSlug} 
              className="w-full h-14 px-5 bg-slate-50 rounded-2xl border border-slate-100 font-bold disabled:opacity-50" 
              value={formData.slug} 
              onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} 
              placeholder="store-id-01" 
            />
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">メニュー・テーマカラー</p>
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <input 
                type="color" 
                className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none" 
                value={formData.color} 
                onChange={e => setFormData({...formData, color: e.target.value})} 
              />
              <span className="font-mono font-bold text-slate-600">{formData.color.toUpperCase()}</span>
              <div className="ml-auto w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: formData.color }} />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-amber-500 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={20}/> 変更を保存</>}
          </button>

          {status && (
            <div className={`p-4 rounded-xl font-bold flex items-center justify-center gap-2 text-sm ${
              status.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}>
              {status.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
              {status.msg}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// --- 2. 在庫管理 (Inventory Manager Internal) ---
function InventoryManagerView({ slug, onBack }: { slug: string, onBack: () => void }) {
  const [master, setMaster] = useState<any[]>([]);
  const [inventory, setInventory] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

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
    } catch (e) {
      console.error("Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [slug]);

  const handleCsv = async () => {
    if (!file || !slug) return;
    setSyncStatus("同期中...");
    const fd = new FormData(); fd.append('file', file); fd.append('slug', slug);
    try {
      const res = await fetch(getSafeUrl('/api/wines/bulk'), { method: 'POST', body: fd });
      if (res.ok) {
        setSyncStatus("完了！");
        setFile(null);
        refresh();
      } else {
        setSyncStatus("失敗");
      }
    } catch (e) {
      setSyncStatus("エラー");
    }
    setTimeout(() => setSyncStatus(null), 2000);
  };

  const filtered = useMemo(() => 
    master.filter(w => 
      (w.name_jp || "").toLowerCase().includes(search.toLowerCase()) || 
      (w.id || "").toLowerCase().includes(search.toLowerCase())
    ).slice(0, 30),
    [master, search]
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-32">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100 active:bg-slate-50 transition-all">
            <ArrowLeft size={20}/>
          </button>
          <div className="min-w-0">
            <h2 className="text-xl font-black text-slate-800 truncate leading-none">{slug}</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Inventory Control</p>
          </div>
        </div>
        <button 
          onClick={() => window.open(getSafeUrl(`/api/store/export/${slug}`))}
          className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg active:bg-amber-500 transition-all"
        >
          <Download size={20}/>
        </button>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CSV一括更新</span>
          {syncStatus && <span className="text-xs text-amber-600 font-black animate-pulse">{syncStatus}</span>}
        </div>
        <div className="relative h-24 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50/50 group transition-all active:border-amber-500">
          <input 
            type="file" accept=".csv" 
            onChange={e => setFile(e.target.files?.[0] || null)} 
            className="absolute inset-0 opacity-0 cursor-pointer" 
          />
          <Upload className={`mb-1 ${file ? 'text-amber-500' : 'text-slate-300'}`} size={24}/>
          <p className="text-[11px] font-bold text-slate-500 px-4 truncate max-w-full">
            {file ? file.name : '店舗CSVをアップロード'}
          </p>
        </div>
        <button 
          disabled={!file} 
          onClick={handleCsv}
          className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-sm active:scale-95 disabled:opacity-20 transition-all shadow-md"
        >
          メニューに反映
        </button>
      </div>

      <div className="sticky top-0 z-20 py-2 bg-slate-50/80 backdrop-blur-md">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input 
            type="text" placeholder="商品名、IDで絞り込む..." 
            className="w-full h-14 pl-12 pr-4 bg-white rounded-2xl border border-slate-100 shadow-sm font-bold text-sm outline-none focus:border-amber-500 transition-all"
            value={search} onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-amber-500" size={32} />
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Syncing D1 Database...</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.length === 0 ? (
            <p className="text-center text-slate-400 text-xs py-10 font-bold">該当する銘柄がありません</p>
          ) : (
            filtered.map(w => (
              <div 
                key={w.id} 
                className={`bg-white p-4 rounded-[1.8rem] border-2 flex items-center gap-4 transition-all ${
                  inventory[w.id]?.active ? 'border-amber-500 shadow-md' : 'border-transparent opacity-60'
                }`}
              >
                <div className="w-12 h-16 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  <img 
                    src={w.image_url} 
                    className="max-h-full object-contain" 
                    alt="" 
                    onError={(e:any)=>e.target.style.display='none'} 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">ID: {w.id}</span>
                    <span className="text-[8px] font-black text-slate-300 truncate">{w.country}</span>
                  </div>
                  <h4 className="font-black text-slate-900 text-sm truncate leading-tight">{w.name_jp}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] font-black text-amber-600">¥{(inventory[w.id]?.price_bottle || 0).toLocaleString()}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      Number(inventory[w.id]?.stock) > 0 ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-500'
                    }`}>
                      在庫: {inventory[w.id]?.stock || 0}
                    </span>
                  </div>
                </div>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  inventory[w.id]?.active ? 'bg-amber-500 text-white scale-110 shadow-lg' : 'bg-slate-100 text-slate-200'
                }`}>
                  <Check size={20} strokeWidth={4}/>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// --- 3. マスター管理 (Master Data Manager) ---
function MasterDataManagerView({ onBack }: { onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await fetch(getSafeUrl('/api/master/bulk'), { method: 'POST', body: fd });
      if (res.ok) { setStatus("マスターを更新しました！"); setFile(null); }
      else { setStatus("エラーが発生しました"); }
    } catch (e) { setStatus("接続エラー"); }
    setLoading(false);
    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-24 px-2">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100 active:bg-slate-100 transition-all">
          <ArrowLeft size={20}/>
        </button>
        <h2 className="text-xl font-black text-slate-800">マスターデータ統括</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => window.open(getSafeUrl('/api/master/export'), '_blank')}
          className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center gap-3 active:bg-slate-50 transition-all"
        >
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl shadow-sm"><FileDown size={28}/></div>
          <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">全銘柄出力</span>
        </button>
        <button 
          onClick={() => window.open(getSafeUrl('/api/master/template'), '_blank')}
          className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center gap-3 active:bg-slate-50 transition-all"
        >
          <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl shadow-sm"><FileText size={28}/></div>
          <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">テンプレート</span>
        </button>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-xl text-center space-y-8">
        <div className="p-6 bg-slate-900 rounded-[2rem] w-20 h-20 flex items-center justify-center mx-auto shadow-2xl rotate-3">
          <Database size={36} className="text-amber-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-900">カタログ一括同期</h3>
          <p className="text-[11px] text-slate-400 font-bold leading-relaxed px-4">
            インポーター本部の全銘柄データを<br/>CSV形式で最新状態に更新します。
          </p>
        </div>

        <div className="relative h-44 border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center bg-slate-50/50 group active:border-amber-500 active:bg-amber-50 transition-all">
          <input 
            type="file" accept=".csv" 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={e => setFile(e.target.files?.[0] || null)} 
          />
          <Upload size={40} className={`mb-3 transition-all ${file ? 'text-amber-500 scale-110' : 'text-slate-200'}`} />
          <p className="text-[11px] font-black text-slate-400 uppercase px-6 truncate max-w-full">
            {file ? file.name : 'カタログCSVを選択'}
          </p>
        </div>

        <button 
          disabled={!file || loading} 
          onClick={handleImport}
          className="w-full h-18 bg-slate-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-30 transition-all py-5"
        >
          {loading ? <RefreshCw className="animate-spin" size={24}/> : <CheckCircle2 size={24}/>} 
          {status || 'マスターを全更新'}
        </button>
      </div>

      <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white space-y-3 shadow-2xl border border-white/5">
        <div className="flex items-center gap-2 text-amber-500 font-black text-[10px] uppercase tracking-[0.3em]">
          <History size={14}/> Operation Caution
        </div>
        <p className="text-[11px] font-bold text-white/50 leading-relaxed italic">
          マスター更新は、既に各店舗メニューに紐づいている商品データにも影響を及ぼします。IDの整合性を確認した上で実行してください。
        </p>
      </div>
    </div>
  );
}

/**
 * =====================================================================
 * MAIN APP COMPONENT
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
      if (res.ok) {
        const data = await res.json();
        setStores(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn("D1 Fetching failed in this environment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleLogout = async () => {
    try {
      await fetch(getSafeUrl('/api/auth/logout'), { method: 'POST' });
    } catch(e) {}
    safeNavigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-900 selection:bg-amber-100 antialiased overflow-x-hidden">
      {/* Premium Navigation Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-5 flex justify-between items-center sticky top-0 z-[100] shadow-sm">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => { setView('dashboard'); setActiveSlug(null); setEditSlug(null); }}
        >
          <div className="p-2 bg-slate-900 text-amber-500 rounded-xl group-active:scale-90 transition-all shadow-lg">
            <LayoutDashboard size={20} />
          </div>
          <h1 className="text-xl font-black italic tracking-tighter flex items-center gap-1">
            PIEROTH <span className="font-light text-slate-300 text-sm not-italic ml-1">MS</span>
          </h1>
        </div>
        <button 
          onClick={handleLogout} 
          className="p-2.5 text-slate-400 hover:text-red-500 active:scale-90 transition-all bg-slate-50 rounded-full"
        >
          <LogOut size={22} />
        </button>
      </header>

      <main className="max-w-xl mx-auto p-5 md:p-8">
        {view === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between px-1 pt-2">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">担当店舗</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1">Menu Asset Management</p>
              </div>
              <button 
                onClick={() => { setEditSlug(null); setView('settings'); }} 
                className="w-14 h-14 bg-amber-500 text-white rounded-2xl shadow-[0_10px_30px_rgba(245,158,11,0.4)] flex items-center justify-center active:scale-90 transition-all border-b-4 border-amber-700"
              >
                <Plus size={28}/>
              </button>
            </div>

            {loading ? (
              <div className="py-32 flex flex-col items-center justify-center gap-6 opacity-20">
                <Wine size={64} className="animate-bounce text-slate-300" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Store Assets...</p>
              </div>
            ) : (
              <div className="grid gap-5">
                {stores.length === 0 ? (
                  <div className="bg-white p-16 rounded-[3rem] border-4 border-dashed border-slate-100 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                      <Briefcase className="text-slate-200" size={32}/>
                    </div>
                    <p className="font-black text-slate-300 text-sm italic">管理中の店舗が見つかりません</p>
                    <button 
                      onClick={() => setView('settings')}
                      className="text-amber-500 font-black text-[10px] uppercase tracking-widest hover:underline"
                    >
                      最初の店舗を登録する
                    </button>
                  </div>
                ) : (
                  stores.map(store => (
                    <div 
                      key={store.slug} 
                      className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 flex flex-col gap-6 hover:shadow-xl transition-all active:scale-[0.99] group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4 min-w-0">
                          <div 
                            className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl rotate-2 group-hover:rotate-0 transition-transform" 
                            style={{ backgroundColor: store.theme_color || '#b45309' }}
                          >
                            <Store size={32}/>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-black text-xl text-slate-800 leading-tight truncate">{store.store_name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-black text-slate-300 tracking-wider">/{store.slug}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => setQrModal({slug: store.slug, name: store.store_name})} 
                            className="p-3 text-slate-300 hover:text-amber-500 transition-colors bg-slate-50 rounded-xl"
                          >
                            <QrCode size={20}/>
                          </button>
                          <button 
                            onClick={() => { setEditSlug(store.slug); setView('settings'); }} 
                            className="p-3 text-slate-300 hover:text-slate-900 transition-colors bg-slate-50 rounded-xl"
                          >
                            <Settings size={20}/>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => { setActiveSlug(store.slug); setView('inventory'); }} 
                          className="h-16 bg-slate-900 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all border-b-4 border-black"
                        >
                          在庫・価格管理 <ChevronRight size={14}/>
                        </button>
                        <button 
                          onClick={() => {
                            const url = getSafeUrl(`/${store.slug}`);
                            if (url !== '#') window.open(url, '_blank');
                          }} 
                          className="h-16 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-sm active:bg-slate-50 transition-all"
                        >
                          メニューを表示 <ExternalLink size={14}/>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {view === 'settings' && <StoreSettingsView editSlug={editSlug} onBack={() => { setView('dashboard'); loadData(); }} />}
        {view === 'inventory' && activeSlug && <InventoryManagerView slug={activeSlug} onBack={() => setView('dashboard')} />}
        {view === 'master' && <MasterDataManagerView onBack={() => setView('dashboard')} />}
      </main>

      {/* QR Modal (Premium Mobile UI) */}
      {qrModal && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setQrModal(null)}
        >
          <div 
            className="bg-white p-8 md:p-10 rounded-[3.5rem] shadow-2xl max-w-xs w-full text-center space-y-8 animate-in zoom-in-95 duration-300 relative border border-white/20" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-2">
              <span className="font-black text-slate-400 text-[10px] uppercase tracking-[0.3em]">Menu QR Access</span>
              <button onClick={() => setQrModal(null)} className="p-2 transition-colors active:text-red-500 bg-slate-50 rounded-full">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="aspect-square bg-slate-50 rounded-[3rem] border-8 border-slate-50 overflow-hidden shadow-inner flex items-center justify-center p-6 relative">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(getSafeUrl('/' + qrModal.slug))}`} 
                alt="QR Code" 
                className="w-full h-full mix-blend-multiply" 
              />
              <div className="absolute inset-0 border-[12px] border-white/50 rounded-[2.5rem] pointer-events-none" />
            </div>

            <div className="space-y-1">
              <p className="font-black text-2xl text-slate-900 leading-tight tracking-tight">{qrModal.name}</p>
              <p className="text-[11px] text-slate-400 font-bold break-all opacity-40 italic">pieroth-menu.app/{qrModal.slug}</p>
            </div>

            <button 
              onClick={() => setQrModal(null)} 
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm active:scale-95 transition-all shadow-xl border-b-4 border-black"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* Bottom Floating Nav Bar (Thumb-friendly Navigation) */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-sm h-18 bg-white/95 backdrop-blur-2xl border border-slate-200/50 px-2 rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.2)] flex justify-around items-center z-[150] transition-all">
        <button 
          onClick={() => { setView('dashboard'); setActiveSlug(null); }} 
          className={`flex flex-col items-center gap-1 flex-1 transition-all ${view === 'dashboard' ? 'text-amber-500 scale-110' : 'text-slate-300 hover:text-slate-500'}`}
        >
          <LayoutDashboard size={26}/>
          <span className="text-[8px] font-black uppercase tracking-widest">Stores</span>
        </button>

        <button 
          onClick={() => { setEditSlug(null); setView('settings'); }} 
          className="w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl -translate-y-6 border-[6px] border-slate-50 active:scale-90 transition-all group"
        >
          <Plus size={28} className="group-hover:rotate-90 transition-transform duration-500"/>
        </button>

        <button 
          onClick={() => setView('master')} 
          className={`flex flex-col items-center gap-1 flex-1 transition-all ${view === 'master' ? 'text-amber-500 scale-110' : 'text-slate-300 hover:text-slate-500'}`}
        >
          <Database size={26}/>
          <span className="text-[8px] font-black uppercase tracking-widest">Master</span>
        </button>
      </nav>
      
      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-100/50 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-200/50 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
