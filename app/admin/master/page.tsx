// app/admin/page.tsx
"use client";
export const runtime = 'edge';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, Plus, Search, Database, LayoutDashboard, LogOut, 
  ExternalLink, Settings, QrCode, TrendingUp, X, ChevronRight, 
  Loader2, ArrowLeft, Download, FileText, Upload, Check, 
  CheckCircle2, AlertCircle, Save, Palette, Globe, FileSpreadsheet,
  RefreshCw, Menu, FileDown, History, Wine
} from 'lucide-react';

/**
 * UTILS: プレビュー環境での絶対パス解決
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

const safeNavigate = (path: string) => {
  if (typeof window !== 'undefined' && path !== '#') window.location.href = getSafeUrl(path);
};

/**
 * SUB-COMPONENTS
 */

// --- 1. 店舗設定 (モバイル最適化) ---
function StoreSettingsView({ editSlug, onBack }: { editSlug: string | null, onBack: () => void }) {
  const [formData, setFormData] = useState({ name: '', slug: '', color: '#b45309' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);

  useEffect(() => {
    if (editSlug) {
      setLoading(true);
      fetch(getSafeUrl(`/api/store/config/public?slug=${editSlug}`))
        .then(res => res.json())
        .then(data => setFormData({ name: data.store_name, slug: editSlug, color: data.theme_color || '#b45309' }))
        .finally(() => setLoading(false));
    }
  }, [editSlug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.slug.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(getSafeUrl('/api/store/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_name: formData.name, slug: formData.slug.toLowerCase().trim(), theme_color: formData.color, is_edit: !!editSlug }),
      });
      const result = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', msg: '保存しました。' });
        setTimeout(onBack, 1000);
      } else { setStatus({ type: 'error', msg: result.error || '保存に失敗' }); }
    } catch (e) { setStatus({ type: 'error', msg: '通信エラー' }); }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-20 p-2">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100 active:bg-slate-50"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black text-slate-800">{editSlug ? 'プロフィール編集' : '新規開設'}</h2>
      </div>
      <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-50 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1" style={{backgroundColor: formData.color}}/>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">店舗名称</p>
            <input type="text" required className="w-full h-14 px-5 bg-slate-50 rounded-2xl border border-slate-100 focus:border-amber-500 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="レストラン名など" />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">URLスラッグ</p>
            <input type="text" required disabled={!!editSlug} className="w-full h-14 px-5 bg-slate-50 rounded-2xl border border-slate-100 font-bold disabled:opacity-50" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} placeholder="ID (英数字)" />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">テーマカラー</p>
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <input type="color" className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
              <span className="font-mono font-bold text-slate-600">{formData.color.toUpperCase()}</span>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-lg active:scale-95 transition-all">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : '設定を保存'}
          </button>
          {status && <div className={`p-4 rounded-xl font-bold flex items-center justify-center gap-2 text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{status.msg}</div>}
        </form>
      </div>
    </div>
  );
}

// --- 2. 在庫管理 (スマホ最適化) ---
function InventoryManagerView({ slug, onBack }: { slug: string, onBack: () => void }) {
  const [master, setMaster] = useState<any[]>([]);
  const [inventory, setInventory] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [mRes, sRes] = await Promise.all([fetch(getSafeUrl('/api/master/list')), fetch(getSafeUrl(`/api/wines?slug=${slug}`))]);
      setMaster(await mRes.json());
      const sData = await sRes.json();
      const invMap: any = {};
      if (Array.isArray(sData)) sData.forEach((w: any) => { invMap[w.id] = { active: true, price_bottle: w.price_bottle, stock: w.stock }; });
      setInventory(invMap);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [slug]);

  const handleUpload = async () => {
    if (!file) return;
    setSyncMsg("同期中...");
    const fd = new FormData(); fd.append('file', file); fd.append('slug', slug);
    const res = await fetch(getSafeUrl('/api/wines/bulk'), { method: 'POST', body: fd });
    if (res.ok) { setSyncMsg("完了！"); setFile(null); refresh(); }
    else setSyncMsg("エラー");
    setTimeout(() => setSyncMsg(null), 2000);
  };

  const filtered = master.filter(w => (w.name_jp || "").includes(search) || (w.id || "").includes(search)).slice(0, 30);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-32 p-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100 active:bg-slate-50"><ArrowLeft size={20}/></button>
          <h2 className="text-xl font-black text-slate-800 truncate max-w-[140px]">{slug} 在庫</h2>
        </div>
        <button onClick={() => window.open(getSafeUrl(`/api/store/export/${slug}`))} className="p-3 bg-slate-900 text-white rounded-2xl active:bg-amber-500 transition-all"><Download size={20}/></button>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm space-y-4">
        <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CSV Update</span>{syncMsg && <span className="text-xs font-black text-amber-600">{syncMsg}</span>}</div>
        <div className="relative h-20 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50/50">
          <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
          <p className="text-[11px] font-bold text-slate-500 px-4 truncate">{file ? file.name : '店舗用CSVをタップして選択'}</p>
        </div>
        <button disabled={!file} onClick={handleUpload} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-sm active:bg-amber-500 transition-all disabled:opacity-30">反映する</button>
      </div>

      <div className="sticky top-0 z-20 py-2 bg-slate-50/80 backdrop-blur-md">
        <input type="text" placeholder="商品名/IDで絞り込み..." className="w-full h-14 px-5 bg-white rounded-2xl border shadow-sm font-bold text-sm" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="text-center p-10 font-black text-slate-300">同期中...</div> : (
        <div className="grid gap-3">
          {filtered.map(w => (
            <div key={w.id} className={`bg-white p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${inventory[w.id]?.active ? 'border-amber-500' : 'border-transparent opacity-60'}`}>
              <div className="w-10 h-14 bg-slate-50 rounded flex items-center justify-center shrink-0">
                <img src={w.image_url} className="max-h-full object-contain" alt="" onError={(e:any)=>e.target.style.display='none'} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-900 text-sm truncate leading-tight">{w.name_jp}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded">¥{(inventory[w.id]?.price_bottle || 0).toLocaleString()}</span>
                  <span className={`text-[10px] font-bold ${Number(inventory[w.id]?.stock) < 5 ? 'text-red-500' : 'text-slate-400'}`}>在庫: {inventory[w.id]?.stock || 0}</span>
                </div>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${inventory[w.id]?.active ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-300'}`}><Check size={18} strokeWidth={4}/></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- 3. マスター管理 (モバイル最適化) ---
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
      else { setStatus("エラーが発生しました"); }
    } catch (e) { setStatus("通信失敗"); }
    setLoading(false);
    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-32 p-2">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100 active:bg-slate-50"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black text-slate-800">マスター一括管理</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => window.open(getSafeUrl('/api/master/export'), '_blank')} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-2 active:bg-slate-50 transition-all">
          <FileDown className="text-amber-600" size={28}/>
          <span className="text-[11px] font-black text-slate-600">全マスター出力</span>
        </button>
        <button onClick={() => window.open(getSafeUrl('/api/master/template'), '_blank')} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-2 active:bg-slate-50 transition-all">
          <FileText className="text-slate-400" size={28}/>
          <span className="text-[11px] font-black text-slate-600">テンプレート</span>
        </button>
      </div>

      <div className="bg-white p-8 rounded-[3rem] border shadow-xl text-center space-y-8">
        <div className="p-4 bg-amber-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto"><Database size={32} className="text-amber-500" /></div>
        <div className="space-y-2">
          <h3 className="text-xl font-black">カタログ全同期</h3>
          <p className="text-[11px] text-slate-400 font-bold leading-relaxed px-4 text-center">本部から配布された最新カタログCSVを<br/>アップロードしてデータベースを更新します。</p>
        </div>
        <div className="relative h-32 border-4 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center bg-slate-50 active:bg-amber-50 transition-all">
          <input type="file" accept=".csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFile(e.target.files?.[0] || null)} />
          <Upload size={32} className={file ? 'text-amber-500' : 'text-slate-200'} />
          <p className="text-[10px] font-black text-slate-400 mt-2 truncate px-4">{file ? file.name : 'タップしてCSVを選択'}</p>
        </div>
        <button disabled={!file || loading} onClick={handleSync} className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-lg active:scale-95 disabled:opacity-20 transition-all">
          {loading ? <RefreshCw className="animate-spin mx-auto" /> : 'マスターを同期する'}
        </button>
        {status && <div className="text-sm font-black text-amber-600 animate-bounce">{status}</div>}
      </div>
    </div>
  );
}

/**
 * MAIN APP
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
    safeNavigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-900 selection:bg-amber-100 antialiased overflow-x-hidden">
      <header className="bg-white border-b px-5 py-4 flex justify-between items-center sticky top-0 z-[100] shadow-sm">
        <h1 className="text-xl font-black italic tracking-tighter cursor-pointer flex items-center gap-2" onClick={() => setView('dashboard')}>
          <LayoutDashboard className="text-amber-500" size={22} /> PIEROTH <span className="font-light text-slate-400 text-sm">MS</span>
        </h1>
        <button onClick={handleLogout} className="p-2 text-slate-400 active:text-red-500"><LogOut size={22} /></button>
      </header>

      <main className="max-w-xl mx-auto p-4">
        {view === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between px-1">
              <div><h2 className="text-2xl font-black text-slate-900">担当店舗</h2><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Menu Management</p></div>
              <button onClick={() => { setEditSlug(null); setView('settings'); }} className="w-12 h-12 bg-amber-500 text-white rounded-2xl shadow-lg flex items-center justify-center active:scale-90 transition-all"><Plus size={24}/></button>
            </div>
            {loading ? <div className="py-20 text-center text-slate-300 font-black animate-pulse">同期中...</div> : (
              <div className="grid gap-4">
                {stores.length === 0 ? <div className="bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center"><p className="font-bold text-slate-300 text-sm italic">店舗メニューを追加してください</p></div> : 
                stores.map(store => (
                  <div key={store.slug} className="bg-white p-6 rounded-[2.2rem] shadow-sm border border-slate-50 flex flex-col gap-6 hover:shadow-md transition-all active:scale-[0.98]">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: store.theme_color || '#b45309' }}><Store size={28}/></div>
                        <div className="min-w-0 flex-1"><h3 className="font-black text-lg text-slate-800 leading-tight truncate">{store.store_name}</h3><p className="text-[10px] text-slate-400 font-black tracking-widest mt-1">/{store.slug}</p></div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setQrModal({slug: store.slug, name: store.store_name})} className="p-3 text-slate-300 active:text-amber-500"><QrCode size={20}/></button>
                        <button onClick={() => { setEditSlug(store.slug); setView('settings'); }} className="p-3 text-slate-300 active:text-slate-900"><Settings size={20}/></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => { setActiveSlug(store.slug); setView('inventory'); }} className="h-14 bg-slate-900 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1 shadow-lg active:scale-95 transition-all">在庫管理 <ChevronRight size={14}/></button>
                      <button onClick={() => window.open(getSafeUrl(`/${store.slug}`), '_blank')} className="h-14 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-xs flex items-center justify-center gap-1 active:bg-slate-50 transition-all">表示確認 <ExternalLink size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'settings' && <StoreSettingsView editSlug={editSlug} onBack={() => { setView('dashboard'); init(); }} />}
        {view === 'inventory' && activeSlug && <InventoryManagerView slug={activeSlug} onBack={() => setView('dashboard')} />}
        {view === 'master' && <MasterManagerView onBack={() => setView('dashboard')} />}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm h-16 bg-white/95 backdrop-blur-xl border border-slate-200/50 px-2 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex justify-around items-center z-[150]">
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 flex-1 transition-all ${view === 'dashboard' ? 'text-amber-500 scale-110' : 'text-slate-300'}`}><LayoutDashboard size={24}/><span className="text-[8px] font-black uppercase">Stores</span></button>
        <button onClick={() => { setEditSlug(null); setView('settings'); }} className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-xl -translate-y-5 border-4 border-slate-50 active:scale-90 transition-all"><Plus size={24}/></button>
        <button onClick={() => setView('master')} className={`flex flex-col items-center gap-1 flex-1 transition-all ${view === 'master' ? 'text-amber-500 scale-110' : 'text-slate-300'}`}><Database size={24}/><span className="text-[8px] font-black uppercase">Master</span></button>
      </nav>

      {qrModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md" onClick={() => setQrModal(null)}>
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl max-w-xs w-full text-center space-y-6 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center"><span className="font-black text-slate-400 text-[10px] uppercase tracking-widest">QR Access</span><button onClick={() => setQrModal(null)}><X size={24} className="text-slate-300" /></button></div>
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
