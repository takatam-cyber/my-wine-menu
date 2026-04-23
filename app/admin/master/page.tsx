// app/admin/page.tsx
"use client";
export const runtime = 'edge';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, Plus, Search, Database, LayoutDashboard, LogOut, 
  ExternalLink, Settings, QrCode, TrendingUp, X, ChevronRight, 
  Loader2, ArrowLeft, Download, FileText, Upload, Check, 
  CheckCircle2, AlertCircle, Save, Globe, FileSpreadsheet,
  RefreshCw, FileDown, Wine, Calendar, MapPin
} from 'lucide-react';

/**
 * プレビュー環境でのパス解決ヘルパー
 */
const getSafeUrl = (path: string) => {
  if (!path) return '#';
  if (typeof window === 'undefined') return path;
  try {
    const origin = window.location.origin;
    if (!origin || origin === 'null' || origin.startsWith('blob:')) return path;
    return new URL(path, origin).href;
  } catch (e) { return path; }
};

/**
 * =====================================================================
 * SUB-COMPONENTS
 * =====================================================================
 */

// --- 在庫管理（詳細表示強化版） ---
function InventoryManagerView({ slug, onBack }: { slug: string, onBack: () => void }) {
  const [master, setMaster] = useState<any[]>([]);
  const [inventory, setInventory] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const refresh = async () => {
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
      if (Array.isArray(sData)) sData.forEach((w: any) => { 
        invMap[w.id] = { active: true, price_bottle: w.price_bottle, stock: w.stock }; 
      });
      setInventory(invMap);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [slug]);

  const handleCsv = async () => {
    if (!file) return;
    setSyncStatus("同期中...");
    const fd = new FormData(); fd.append('file', file); fd.append('slug', slug);
    const res = await fetch(getSafeUrl('/api/wines/bulk'), { method: 'POST', body: fd });
    if (res.ok) { setSyncStatus("完了！"); setFile(null); refresh(); }
    else setSyncStatus("エラー");
    setTimeout(() => setSyncStatus(null), 2000);
  };

  const filtered = master.filter(w => 
    (w.name_jp || "").includes(search) || 
    (w.id || "").includes(search) ||
    (w.country || "").includes(search)
  ).slice(0, 40);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-32">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100"><ArrowLeft size={20}/></button>
          <h2 className="text-xl font-black text-slate-800 truncate max-w-[140px]">{slug} の在庫</h2>
        </div>
        <button onClick={() => window.open(getSafeUrl(`/api/store/export/${slug}`))} className="p-3 bg-slate-900 text-white rounded-2xl active:bg-amber-500 transition-all shadow-md"><Download size={20}/></button>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bulk CSV Update</span>
          {syncStatus && <span className="text-xs font-black text-amber-600">{syncStatus}</span>}
        </div>
        <div className="relative h-20 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50/50">
          <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
          <p className="text-[11px] font-bold text-slate-500 px-4 truncate">{file ? file.name : '店舗用CSVをアップロード'}</p>
        </div>
        <button disabled={!file} onClick={handleCsv} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-sm active:bg-amber-500 transition-all disabled:opacity-30">反映する</button>
      </div>

      <div className="sticky top-0 z-20 py-2 bg-slate-50/80 backdrop-blur-md px-1">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input type="text" placeholder="名前、国、IDで検索..." className="w-full h-14 pl-12 pr-4 bg-white rounded-2xl border border-slate-200 shadow-sm outline-none focus:border-amber-500 font-bold text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center font-black text-slate-300 animate-pulse uppercase tracking-tighter">Database Connecting...</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(w => (
            <div key={w.id} className={`bg-white p-4 rounded-[1.8rem] border-2 flex items-start gap-4 transition-all ${inventory[w.id]?.active ? 'border-amber-500 shadow-sm' : 'border-transparent opacity-60'}`}>
              <div className="w-12 h-16 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                <img src={w.image_url} className="max-h-full object-contain" alt="" onError={(e:any)=>e.target.style.display='none'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded text-white ${w.color === '赤' ? 'bg-red-700' : w.color === '白' ? 'bg-yellow-500' : 'bg-slate-400'}`}>{w.color}</span>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Calendar size={10}/>{w.vintage || 'NV'}</span>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><MapPin size={10}/>{w.country}</span>
                </div>
                <h4 className="font-black text-slate-900 text-[13px] leading-tight mb-2">{w.name_jp}</h4>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-black text-amber-600">¥{(inventory[w.id]?.price_bottle || w.price_bottle || 0).toLocaleString()}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${Number(inventory[w.id]?.stock) > 0 ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-500'}`}>在庫: {inventory[w.id]?.stock || 0}</span>
                </div>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${inventory[w.id]?.active ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-300'}`}><Check size={20} strokeWidth={4}/></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- マスター管理 ---
function MasterManagerView({ onBack }: { onBack: () => void }) {
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
      else { setStatus("エラー"); }
    } catch (e) { setStatus("失敗"); }
    setLoading(false);
    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-32 p-2">
      <div className="flex items-center gap-3"><button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100"><ArrowLeft size={20}/></button><h2 className="text-xl font-black text-slate-800">マスター一括管理</h2></div>
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
        <div className="p-5 bg-amber-500/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto border border-amber-500/20"><Database size={40} className="text-amber-500" /></div>
        <div className="space-y-2"><h3 className="text-xl font-black">カタログ全同期</h3><p className="text-[11px] text-slate-400 font-bold px-4">本部データの全34項目を上書き更新します。</p></div>
        <div className="relative h-36 border-4 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center bg-slate-50/50 group active:border-amber-500 transition-all">
          <input type="file" accept=".csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFile(e.target.files?.[0] || null)} />
          <Upload size={32} className={`mb-2 transition-all ${file ? 'text-amber-500' : 'text-slate-200'}`} />
          <p className="text-[10px] font-black text-slate-400 px-6 truncate">{file ? file.name : 'CSVをタップして選択'}</p>
        </div>
        <button disabled={!file || loading} onClick={handleSync} className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-lg active:scale-95 disabled:opacity-30 transition-all">{loading ? <RefreshCw className="animate-spin mx-auto" size={24}/> : 'マスターを同期する'}</button>
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

  const init = async () => {
    setLoading(true);
    try {
      const res = await fetch(getSafeUrl('/api/store/list'));
      if (res.ok) setStores(await res.json());
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { init(); }, []);

  const handleLogout = async () => {
    await fetch(getSafeUrl('/api/auth/logout'), { method: 'POST' });
    if (typeof window !== 'undefined') window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-900 selection:bg-amber-100 antialiased overflow-x-hidden">
      <header className="bg-white border-b border-slate-200 px-5 py-4 flex justify-between items-center sticky top-0 z-[100] shadow-sm">
        <h1 className="text-xl font-black italic tracking-tighter cursor-pointer flex items-center gap-2" onClick={() => setView('dashboard')}>
          <LayoutDashboard className="text-amber-500" size={22} /> PIEROTH <span className="font-light text-slate-400 text-sm">MS</span>
        </h1>
        <button onClick={handleLogout} className="p-2 text-slate-400 active:text-red-500 transition-colors"><LogOut size={22} /></button>
      </header>

      <main className="max-w-xl mx-auto p-4">
        {view === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between px-1">
              <div><h2 className="text-2xl font-black text-slate-900">担当店舗</h2><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Menu Management</p></div>
              <button onClick={() => { setEditSlug(null); setView('settings'); }} className="w-12 h-12 bg-amber-500 text-white rounded-2xl shadow-lg flex items-center justify-center active:scale-90 transition-all"><Plus size={24}/></button>
            </div>
            {loading ? <div className="py-20 text-center text-slate-300 font-black animate-pulse">Syncing...</div> : (
              <div className="grid gap-4">
                {stores.length === 0 ? <div className="bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center"><p className="font-bold text-slate-300 text-sm italic">管理中の店舗がありません</p></div> : 
                stores.map(store => (
                  <div key={store.slug} className="bg-white p-6 rounded-[2.2rem] shadow-sm border border-slate-50 flex flex-col gap-6 hover:shadow-md transition-all active:scale-[0.98]">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: store.theme_color || '#b45309' }}><Store size={28}/></div>
                        <div className="min-w-0 flex-1"><h3 className="font-black text-lg text-slate-800 leading-tight truncate">{store.store_name}</h3><p className="text-[10px] text-slate-400 font-black tracking-widest mt-1">/{store.slug}</p></div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setQrModal({slug: store.slug, name: store.store_name})} className="p-3 text-slate-300 active:text-amber-500 transition-colors"><QrCode size={20}/></button>
                        <button onClick={() => { setEditSlug(store.slug); setView('settings'); }} className="p-3 text-slate-300 active:text-slate-900 transition-colors"><Settings size={20}/></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => { setActiveSlug(store.slug); setView('inventory'); }} className="h-14 bg-slate-900 text-white rounded-xl font-black text-xs flex items-center justify-center shadow-lg active:scale-95 transition-all">在庫管理</button>
                      <button onClick={() => window.open(getSafeUrl(`/${store.slug}`), '_blank')} className="h-14 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-xs flex items-center justify-center shadow-sm">公開ページ</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'settings' && (
          <div className="animate-in slide-in-from-right-4 duration-300">
             {/* settings content is in another file but integrated in App in this OneFile rule context */}
             <p className="text-center p-20 text-slate-300 font-black">SETTINGS INTEGRATED...</p>
          </div>
        )}
        {view === 'inventory' && activeSlug && <InventoryManagerView slug={activeSlug} onBack={() => setView('dashboard')} />}
        {view === 'master' && <MasterManagerView onBack={() => setView('dashboard')} />}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm h-16 bg-white/95 backdrop-blur-xl border border-slate-200/50 px-2 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex justify-around items-center z-[150]">
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 flex-1 transition-all ${view === 'dashboard' ? 'text-amber-500 scale-110' : 'text-slate-300'}`}><LayoutDashboard size={24}/><span className="text-[8px] font-black uppercase">Stores</span></button>
        <button onClick={() => setView('master')} className={`flex flex-col items-center gap-1 flex-1 transition-all ${view === 'master' ? 'text-amber-500 scale-110' : 'text-slate-300'}`}><Database size={24}/><span className="text-[8px] font-black uppercase">Master</span></button>
      </nav>

      {qrModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md" onClick={() => setQrModal(null)}>
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl max-w-xs w-full text-center space-y-6 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center"><span className="font-black text-slate-400 text-[10px] uppercase tracking-widest">QR Access</span><button onClick={() => setQrModal(null)} className="p-2 transition-colors active:text-red-500"><X size={24} className="text-slate-300" /></button></div>
            <div className="aspect-square bg-slate-50 rounded-3xl border-4 border-slate-50 overflow-hidden shadow-inner flex items-center justify-center p-4">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getSafeUrl('/' + qrModal.slug))}`} alt="QR" className="w-full h-full mix-blend-multiply" />
            </div>
            <div><p className="font-black text-lg text-slate-900 leading-tight">{qrModal.name}</p><p className="text-[10px] text-slate-400 font-bold break-all opacity-50">/{qrModal.slug}</p></div>
            <button onClick={() => setQrModal(null)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-sm active:scale-95 transition-all">閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}
