// app/admin/page.tsx
"use client";

export const runtime = 'edge';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, Plus, Search, Database, LayoutDashboard, LogOut, 
  ExternalLink, Settings, QrCode, TrendingUp, X, ChevronRight, 
  Loader2, ArrowLeft, Download, FileText, Upload, Check, 
  CheckCircle2, AlertCircle, Save, Globe, FileSpreadsheet,
  RefreshCw, FileDown, Wine, Calendar, MapPin, Palette, Trash2
} from 'lucide-react';

/**
 * プレビュー・本番環境でのパス解決ヘルパー
 */
const getSafeUrl = (path: string) => {
  if (!path) return '#';
  if (typeof window === 'undefined') return path;
  try {
    const origin = window.location.origin;
    if (!origin || origin === 'null' || origin.startsWith('blob:')) return path;
    const safePath = path.startsWith('/') ? path : `/${path}`;
    return new URL(safePath, origin).href;
  } catch (e) { return path; }
};

/**
 * =====================================================================
 * SUB-COMPONENTS
 * =====================================================================
 */

// --- 店舗設定（登録・編集） ---
function StoreSettingsView({ 
  editSlug, 
  onBack, 
  onSuccess 
}: { 
  editSlug: string | null, 
  onBack: () => void, 
  onSuccess: () => void 
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [color, setColor] = useState('#b45309');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  useEffect(() => {
    if (editSlug) {
      setLoading(true);
      fetch(getSafeUrl(`/api/store/config/public?slug=${editSlug}`))
        .then(res => res.json())
        .then(data => {
          setName(data.store_name || '');
          setSlug(editSlug);
          setColor(data.theme_color || '#b45309');
        })
        .finally(() => setLoading(false));
    }
  }, [editSlug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim()) return;
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch(getSafeUrl('/api/store/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          store_name: name, 
          slug: slug.toLowerCase().trim(), 
          theme_color: color,
          is_edit: !!editSlug
        }),
      });

      const result = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', msg: '設定を保存しました。' });
        setTimeout(onSuccess, 1000);
      } else {
        setStatus({ type: 'error', msg: result.error || '保存に失敗しました。' });
      }
    } catch (error) {
      setStatus({ type: 'error', msg: '通信エラーが発生しました。' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100"><ArrowLeft size={20}/></button>
        <h2 className="text-2xl font-black text-slate-800">{editSlug ? '店舗編集' : '新規登録'}</h2>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">店舗名称</label>
            <input 
              type="text" required placeholder="例：ピーロート日比谷店" 
              className="w-full h-16 px-6 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-amber-500 transition-all outline-none"
              value={name} onChange={e => setName(e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">URLスラッグ</label>
            <div className="relative">
              <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
              <input 
                type="text" required disabled={!!editSlug} 
                placeholder="hibiya-pieroth" 
                className={`w-full h-16 pl-12 pr-6 rounded-2xl font-bold border-2 border-transparent focus:border-amber-500 transition-all outline-none ${editSlug ? 'bg-slate-100 text-slate-400' : 'bg-slate-50'}`}
                value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">テーマカラー</label>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
              <input type="color" className="w-12 h-12 rounded-lg cursor-pointer" value={color} onChange={e => setColor(e.target.value)} />
              <span className="font-mono font-black text-slate-600 uppercase">{color}</span>
            </div>
          </div>

          <button disabled={loading} className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20}/>}
            {editSlug ? '更新する' : '店舗を開設する'}
          </button>

          {status && (
            <div className={`p-4 rounded-xl flex items-center gap-3 font-bold text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {status.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
              {status.msg}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// --- 在庫管理 ---
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100"><ArrowLeft size={20}/></button>
          <h2 className="text-xl font-black text-slate-800">在庫: {slug}</h2>
        </div>
        <button onClick={() => window.open(getSafeUrl(`/api/store/export/${slug}`))} className="p-3 bg-slate-900 text-white rounded-xl shadow-md"><Download size={20}/></button>
      </div>

      <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bulk CSV Sync</p>
        <div className="relative h-16 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50/50">
          <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
          <p className="text-[11px] font-bold text-slate-500 px-4 truncate">{file ? file.name : 'CSVで一括更新'}</p>
        </div>
        <button disabled={!file} onClick={handleCsv} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs disabled:opacity-30">反映する</button>
      </div>

      <div className="relative sticky top-0 z-20 pt-2 pb-4 bg-slate-50/90 backdrop-blur-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
        <input type="text" placeholder="銘柄検索..." className="w-full h-14 pl-12 pr-4 bg-white rounded-2xl border border-slate-100 shadow-sm outline-none font-bold" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-3">
        {loading ? <div className="text-center p-10 font-black text-slate-300 animate-pulse">SYNCING D1...</div> : 
        filtered.map(w => (
          <div key={w.id} className={`bg-white p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${inventory[w.id]?.active ? 'border-amber-500' : 'border-transparent opacity-60'}`}>
            <div className="w-12 h-16 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
              <img src={w.image_url} className="max-h-full object-contain" alt="" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-slate-900 text-[12px] leading-tight mb-1 truncate">{w.name_jp}</h4>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black text-amber-600">¥{(inventory[w.id]?.price_bottle || w.price_bottle || 0).toLocaleString()}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${Number(inventory[w.id]?.stock) > 0 ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-500'}`}>在庫: {inventory[w.id]?.stock || 0}</span>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${inventory[w.id]?.active ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-300'}`}><Check size={16} strokeWidth={4}/></div>
          </div>
        ))}
      </div>
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
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3"><button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100"><ArrowLeft size={20}/></button><h2 className="text-xl font-black text-slate-800">カタログ管理</h2></div>
      
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => window.open(getSafeUrl('/api/master/export'), '_blank')} className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col items-center gap-3 active:bg-slate-50 transition-all">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><FileDown size={28}/></div>
          <span className="text-[10px] font-black text-slate-600">カタログDL</span>
        </button>
        <button onClick={() => window.open(getSafeUrl('/api/master/template'), '_blank')} className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col items-center gap-3 active:bg-slate-50 transition-all">
          <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl"><FileText size={28}/></div>
          <span className="text-[10px] font-black text-slate-600">テンプレート</span>
        </button>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border shadow-xl text-center space-y-6">
        <div className="p-4 bg-amber-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto"><Database size={32} className="text-amber-500" /></div>
        <div className="space-y-1"><h3 className="text-lg font-black">一括同期</h3><p className="text-[10px] text-slate-400 font-bold">カタログ情報を最新のCSVで上書きします。</p></div>
        <div className="relative h-28 border-4 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center bg-slate-50/50 transition-all">
          <input type="file" accept=".csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFile(e.target.files?.[0] || null)} />
          <Upload size={24} className={file ? 'text-amber-500' : 'text-slate-200'} />
          <p className="text-[10px] font-black text-slate-400 mt-2">{file ? file.name : 'CSVを選択'}</p>
        </div>
        <button disabled={!file || loading} onClick={handleSync} className="w-full h-14 bg-slate-900 text-white rounded-xl font-black shadow-lg active:scale-95 disabled:opacity-30 transition-all">{loading ? <RefreshCw className="animate-spin mx-auto" /> : 'マスターを同期'}</button>
        {status && <div className="text-xs font-black text-amber-600">{status}</div>}
      </div>
    </div>
  );
}

/**
 * =====================================================================
 * MAIN DASHBOARD
 * =====================================================================
 */
export default function App() {
  const [view, setView] = useState<'dashboard' | 'settings' | 'inventory' | 'master'>('dashboard');
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState<{slug: string, name: string} | null>(null);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await fetch(getSafeUrl('/api/store/list'));
      if (res.ok) setStores(await res.json());
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { fetchStores(); }, []);

  const handleLogout = async () => {
    await fetch(getSafeUrl('/api/auth/logout'), { method: 'POST' });
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-900 antialiased overflow-x-hidden selection:bg-amber-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-[100] shadow-sm">
        <h1 className="text-xl font-black italic tracking-tighter cursor-pointer flex items-center gap-2" onClick={() => setView('dashboard')}>
          <LayoutDashboard className="text-amber-500" size={22} /> PIEROTH <span className="font-light text-slate-400 text-sm">MS</span>
        </h1>
        <button onClick={handleLogout} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><LogOut size={20} /></button>
      </header>

      <main className="max-w-xl mx-auto p-4 md:p-6">
        {view === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight">担当店舗</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Store Selection</p>
              </div>
              <button 
                onClick={() => { setEditSlug(null); setView('settings'); }} 
                className="w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all"
              >
                <Plus size={28}/>
              </button>
            </div>

            {loading ? <div className="py-20 text-center text-slate-200 font-black animate-pulse">Syncing...</div> : (
              <div className="grid gap-4">
                {stores.length === 0 ? (
                  <div className="bg-white p-16 rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center space-y-4">
                    <Store size={48} className="text-slate-100 mx-auto" />
                    <p className="font-bold text-slate-300 text-sm italic">管理中の店舗がありません</p>
                  </div>
                ) : 
                stores.map(store => (
                  <div key={store.slug} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 flex flex-col gap-6 hover:shadow-md transition-all active:scale-[0.99] group">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: store.theme_color || '#b45309' }}>
                          <Store size={28}/>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-lg text-slate-800 leading-tight truncate max-w-[160px]">{store.store_name}</h3>
                          <p className="text-[10px] text-slate-400 font-black tracking-widest mt-1">/{store.slug}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setQrModal({slug: store.slug, name: store.store_name})} className="p-2 text-slate-300 hover:text-amber-500 transition-colors"><QrCode size={20}/></button>
                        <button onClick={() => { setEditSlug(store.slug); setView('settings'); }} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><Settings size={20}/></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => { setActiveSlug(store.slug); setView('inventory'); }} 
                        className="h-12 bg-slate-900 text-white rounded-xl font-black text-[11px] flex items-center justify-center shadow-lg active:scale-95 transition-all"
                      >
                        在庫管理
                      </button>
                      <button 
                        onClick={() => window.open(getSafeUrl(`/${store.slug}`), '_blank')} 
                        className="h-12 bg-white border border-slate-100 text-slate-500 rounded-xl font-black text-[11px] flex items-center justify-center shadow-sm active:bg-slate-50"
                      >
                        メニューを開く <ExternalLink size={14} className="ml-2"/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'settings' && <StoreSettingsView editSlug={editSlug} onBack={() => setView('dashboard')} onSuccess={() => { setView('dashboard'); fetchStores(); }} />}
        {view === 'inventory' && activeSlug && <InventoryManagerView slug={activeSlug} onBack={() => setView('dashboard')} />}
        {view === 'master' && <MasterManagerView onBack={() => setView('dashboard')} />}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-16 bg-white/90 backdrop-blur-xl border border-white/20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex justify-around items-center z-[150]">
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 flex-1 transition-all ${view === 'dashboard' || view === 'inventory' || view === 'settings' ? 'text-amber-500 scale-110' : 'text-slate-300'}`}>
          <LayoutDashboard size={22}/>
          <span className="text-[8px] font-black uppercase">Stores</span>
        </button>
        <button onClick={() => setView('master')} className={`flex flex-col items-center gap-1 flex-1 transition-all ${view === 'master' ? 'text-amber-500 scale-110' : 'text-slate-300'}`}>
          <Database size={22}/>
          <span className="text-[8px] font-black uppercase">Catalog</span>
        </button>
      </nav>

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md" onClick={() => setQrModal(null)}>
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl max-w-xs w-full text-center space-y-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-2">
              <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Digital Menu QR</span>
              <button onClick={() => setQrModal(null)} className="p-1 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>
            <div className="aspect-square bg-slate-50 rounded-[2.5rem] border-8 border-slate-50 shadow-inner flex items-center justify-center p-4">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getSafeUrl('/' + qrModal.slug))}`} alt="QR" className="w-full h-full mix-blend-multiply" />
            </div>
            <div className="space-y-1">
              <p className="font-black text-xl text-slate-900 leading-tight">{qrModal.name}</p>
              <p className="text-[10px] text-slate-400 font-bold opacity-50">/{qrModal.slug}</p>
            </div>
            <button onClick={() => setQrModal(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm active:scale-95 transition-all">閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}
