// app/admin/page.tsx
"use client";

export const runtime = 'edge';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, Plus, Search, Database, LayoutDashboard, LogOut, 
  ExternalLink, Settings, QrCode, TrendingUp, X, ChevronRight, 
  Loader2, ArrowLeft, Download, FileText, Upload, Check, 
  CheckCircle2, AlertCircle, Save, Globe, FileSpreadsheet,
  RefreshCw, FileDown, Wine, Calendar, MapPin, Palette, Trash2,
  GlassWater, Eye, EyeOff, Sparkles
} from 'lucide-react';

/**
 * プレビュー用のサンプルデータ
 */
const SAMPLE_STORES = [
  { slug: 'pieroth-hibiya', store_name: 'ピーロート・ジャパン 日比谷店', theme_color: '#b45309' },
  { slug: 'grand-hotel-tokyo', store_name: 'グランドホテル東京 メインダイニング', theme_color: '#1e1b15' },
  { slug: 'bar-luxury', store_name: 'Bar Luxury Azabu', theme_color: '#7f1d1d' }
];

const SAMPLE_MASTER = [
  { id: 'P-001', name_jp: 'シャトー・ラフィット・ロートシルト 2018', country: 'フランス', vintage: '2018', color: '赤', price_bottle: 158000, price_glass: 0, image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400', is_priority: 1 },
  { id: 'P-002', name_jp: 'ブルーナン ゴールド・エディション', country: 'ドイツ', vintage: 'NV', color: '泡', price_bottle: 5500, price_glass: 800, image_url: 'https://images.unsplash.com/photo-1553361371-9bb220265263?w=400', is_priority: 1 },
  { id: 'P-003', name_jp: 'トカイ・アスー 6プットニョス', country: 'ハンガリー', vintage: '2017', color: '白', price_bottle: 12000, price_glass: 1500, image_url: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=400', is_priority: 0 }
];

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
 * --- 店舗設定 ---
 */
function StoreSettingsView({ editSlug, onBack, onSuccess }: { editSlug: string | null, onBack: () => void, onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [color, setColor] = useState('#b45309');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  useEffect(() => {
    if (editSlug) {
      const sample = SAMPLE_STORES.find(s => s.slug === editSlug);
      if (sample) {
        setName(sample.store_name);
        setSlug(sample.slug);
        setColor(sample.theme_color);
      }
    }
  }, [editSlug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setStatus({ type: 'success', msg: '設定を保存しました（プレビューモード）' });
      setTimeout(onSuccess, 1000);
    }, 800);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 pb-20">
      <div className="flex items-center gap-4 px-2">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100 active:scale-90 transition-all"><ArrowLeft size={20}/></button>
        <h2 className="text-2xl font-black text-slate-800">{editSlug ? '店舗編集' : '新規登録'}</h2>
      </div>
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">店舗名称</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="例：ピーロート日比谷店" className="w-full h-16 px-6 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-amber-500 transition-all outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">URLスラッグ</label>
            <input type="text" required disabled={!!editSlug} value={slug} onChange={e => setSlug(e.target.value)} placeholder="hibiya-pieroth" className="w-full h-16 px-6 bg-slate-50 rounded-2xl font-bold border-2 border-transparent outline-none disabled:opacity-50" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">テーマカラー</label>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-12 rounded-lg cursor-pointer" />
              <span className="font-mono font-black text-slate-600 uppercase">{color}</span>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-lg active:scale-95 disabled:opacity-50 transition-all">
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20}/>}
            {editSlug ? '更新する' : '店舗を開設する'}
          </button>
          {status && <div className="p-4 rounded-xl font-bold text-center bg-emerald-50 text-emerald-700">{status.msg}</div>}
        </form>
      </div>
    </div>
  );
}

/**
 * --- 在庫管理 (Editable Version with Reflect Button) ---
 */
function InventoryManagerView({ slug, onBack }: { slug: string, onBack: () => void }) {
  const [search, setSearch] = useState("");
  const [isReflecting, setIsReflecting] = useState(false);
  const [showReflectSuccess, setShowReflectSuccess] = useState(false);
  
  const [inventory, setInventory] = useState<Record<string, any>>({ 
    'P-001': { active: true, price_bottle: 158000, price_glass: 0, stock: 12 }, 
    'P-002': { active: true, price_bottle: 5500, price_glass: 800, stock: 48 },
    'P-003': { active: false, price_bottle: 12000, price_glass: 1500, stock: 0 }
  });

  const filtered = SAMPLE_MASTER.filter(w => 
    w.name_jp.includes(search) || w.id.includes(search)
  );

  const updateItem = (id: string, field: string, value: any) => {
    setInventory(prev => ({
      ...prev,
      [id]: { 
        ...(prev[id] || { active: false, price_bottle: 0, price_glass: 0, stock: 0 }),
        [field]: value 
      }
    }));
  };

  const handleReflectToMenu = () => {
    setIsReflecting(true);
    // API呼び出しをシミュレート
    setTimeout(() => {
      setIsReflecting(false);
      setShowReflectSuccess(true);
      setTimeout(() => setShowReflectSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-52">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100 active:scale-90 transition-all"><ArrowLeft size={20}/></button>
          <div className="min-w-0">
            <h2 className="text-xl font-black text-slate-800 truncate">在庫・価格設定</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{slug}</p>
          </div>
        </div>
        <button className="p-3 bg-slate-100 text-slate-600 rounded-2xl active:scale-95 transition-all"><Download size={20}/></button>
      </div>

      <div className="relative sticky top-0 z-20 pt-2 pb-4 bg-slate-50/90 backdrop-blur-md px-1">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={18}/>
          <input 
            type="text" 
            placeholder="商品名・IDで検索..." 
            className="w-full h-14 pl-12 pr-4 bg-white rounded-2xl border border-slate-100 shadow-sm outline-none font-bold text-sm focus:ring-2 ring-amber-500/10" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.map(w => {
          const inv = inventory[w.id] || { active: false, price_bottle: w.price_bottle, price_glass: w.price_glass, stock: 0 };
          const isActive = inv.active;
          
          return (
            <div 
              key={w.id} 
              className={`bg-white p-5 rounded-[2.2rem] border-2 transition-all duration-300 flex flex-col gap-4 ${
                isActive ? 'border-amber-500 shadow-xl' : 'border-transparent opacity-60 grayscale-[0.2]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-20 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-inner relative">
                  <img src={w.image_url} className="max-h-full object-contain p-1" alt="" />
                  {w.is_priority === 1 && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-white p-1 rounded-bl-lg">
                      <CheckCircle2 size={10} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-md uppercase">ID: {w.id}</span>
                    <span className="text-[8px] font-black text-amber-600/60 uppercase tracking-tighter">{w.country}</span>
                  </div>
                  <h4 className="font-black text-slate-900 text-[13px] leading-tight line-clamp-2">{w.name_jp}</h4>
                </div>
                <button 
                  onClick={() => updateItem(w.id, 'active', !isActive)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md active:scale-90 ${
                    isActive ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-300'
                  }`}
                >
                  {isActive ? <Eye size={20} strokeWidth={3}/> : <EyeOff size={20} strokeWidth={3}/>}
                </button>
              </div>

              <div className={`grid grid-cols-2 gap-3 pt-3 border-t border-slate-50 transition-opacity ${isActive ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase ml-2">
                    <Wine size={10}/> ボトル価格 (¥)
                  </label>
                  <input 
                    type="number" 
                    value={inv.price_bottle}
                    onChange={e => updateItem(w.id, 'price_bottle', parseInt(e.target.value) || 0)}
                    className="w-full h-11 px-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-amber-500/20 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase ml-2">
                    <GlassWater size={10}/> グラス価格 (¥)
                  </label>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={inv.price_glass}
                    onChange={e => updateItem(w.id, 'price_glass', parseInt(e.target.value) || 0)}
                    className="w-full h-11 px-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-amber-500/20 focus:bg-white transition-all"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase ml-2">
                    <Database size={10}/> 在庫本数
                  </label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      value={inv.stock}
                      onChange={e => updateItem(w.id, 'stock', parseInt(e.target.value) || 0)}
                      className="flex-1 h-11 px-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-amber-500/20 focus:bg-white transition-all"
                    />
                    <div className="flex gap-1">
                      <button onClick={() => updateItem(w.id, 'stock', Math.max(0, inv.stock - 1))} className="w-11 h-11 bg-slate-100 text-slate-600 rounded-xl font-black text-lg active:bg-amber-100">-</button>
                      <button onClick={() => updateItem(w.id, 'stock', inv.stock + 1)} className="w-11 h-11 bg-slate-100 text-slate-600 rounded-xl font-black text-lg active:bg-amber-100">+</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Button: Reflect to Menu */}
      <div className="fixed bottom-32 left-0 right-0 z-50 px-8 flex justify-center pointer-events-none">
        <button 
          onClick={handleReflectToMenu}
          disabled={isReflecting}
          className={`pointer-events-auto h-16 w-full max-w-sm rounded-full flex items-center justify-center gap-3 font-black text-sm shadow-[0_20px_40px_rgba(0,0,0,0.2)] transition-all active:scale-95 ${
            showReflectSuccess 
            ? 'bg-emerald-500 text-white' 
            : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
        >
          {isReflecting ? (
            <>
              <Loader2 className="animate-spin" size={20}/>
              同期中...
            </>
          ) : showReflectSuccess ? (
            <>
              <CheckCircle2 size={20}/>
              反映完了！
            </>
          ) : (
            <>
              <Sparkles size={20} className="animate-pulse" />
              メニューに反映する
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * --- マスター管理 ---
 */
function MasterManagerView({ onBack }: { onBack: () => void }) {
  const [syncing, setSyncing] = useState(false);
  const [done, setDone] = useState(false);

  const startSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 p-2">
      <div className="flex items-center gap-3"><button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100"><ArrowLeft size={20}/></button><h2 className="text-xl font-black text-slate-800">カタログ管理</h2></div>
      <div className="grid grid-cols-2 gap-3">
        <button className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col items-center gap-3 active:bg-slate-50 transition-all">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><FileDown size={28}/></div>
          <span className="text-[10px] font-black text-slate-600 uppercase">全マスターDL</span>
        </button>
        <button className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col items-center gap-3 active:bg-slate-50 transition-all">
          <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl"><FileText size={28}/></div>
          <span className="text-[10px] font-black text-slate-600 uppercase">テンプレート</span>
        </button>
      </div>
      <div className="bg-white p-8 rounded-[3rem] border shadow-xl text-center space-y-8">
        <div className="p-5 bg-amber-500/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto border border-amber-500/20"><Database size={40} className="text-amber-500" /></div>
        <div className="space-y-2"><h3 className="text-xl font-black">カタログ一括同期</h3><p className="text-[11px] text-slate-400 font-bold px-4">本部データの最新情報を全店舗のカタログに反映します。</p></div>
        <div className="relative h-36 border-4 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center bg-slate-50/50 group active:border-amber-500 transition-all cursor-pointer">
          <Upload size={32} className="text-slate-200 mb-2" />
          <p className="text-[10px] font-black text-slate-400">CSVファイルをアップロード</p>
        </div>
        <button 
          onClick={startSync}
          disabled={syncing}
          className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-lg active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center gap-3"
        >
          {syncing ? <RefreshCw className="animate-spin" size={24}/> : done ? <CheckCircle2 size={24}/> : '同期を実行する'}
          {syncing ? '同期中...' : done ? '同期完了' : ''}
        </button>
      </div>
    </div>
  );
}

/**
 * --- Main App ---
 */
export default function App() {
  const [view, setView] = useState<'dashboard' | 'settings' | 'inventory' | 'master'>('dashboard');
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [stores, setStores] = useState<any[]>(SAMPLE_STORES);
  const [qrModal, setQrModal] = useState<{slug: string, name: string} | null>(null);

  const handleLogout = () => {
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-40 font-sans text-slate-900 antialiased overflow-x-hidden selection:bg-amber-100">
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-[100] shadow-sm">
        <h1 className="text-xl font-black italic tracking-tighter cursor-pointer flex items-center gap-2" onClick={() => setView('dashboard')}>
          <LayoutDashboard className="text-amber-500" size={22} /> PIEROTH <span className="font-light text-slate-400 text-sm tracking-widest">MS</span>
        </h1>
        <button onClick={handleLogout} className="p-2 text-slate-300 hover:text-red-500 transition-colors active:scale-90"><LogOut size={20} /></button>
      </header>

      <main className="max-w-xl mx-auto p-4 md:p-6">
        {view === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight">担当店舗</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Management Console</p>
              </div>
              <button 
                onClick={() => { setEditSlug(null); setView('settings'); }} 
                className="w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all"
              >
                <Plus size={28}/>
              </button>
            </div>
            <div className="grid gap-4">
              {stores.map(store => (
                <div key={store.slug} className="bg-white p-6 rounded-[2.8rem] shadow-sm border border-slate-100 flex flex-col gap-6 hover:shadow-md transition-all active:scale-[0.99] group relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-[1.2rem] flex items-center justify-center text-white shadow-lg rotate-2 group-hover:rotate-0 transition-transform" style={{ backgroundColor: store.theme_color || '#b45309' }}>
                        <Store size={28}/>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-lg text-slate-800 leading-tight truncate max-w-[160px]">{store.store_name}</h3>
                        <p className="text-[10px] text-slate-400 font-black tracking-widest mt-1">/{store.slug}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setQrModal({slug: store.slug, name: store.store_name})} className="p-3 text-slate-300 hover:text-amber-500 transition-colors"><QrCode size={20}/></button>
                      <button onClick={() => { setEditSlug(store.slug); setView('settings'); }} className="p-3 text-slate-300 hover:text-slate-900 transition-colors"><Settings size={20}/></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => { setActiveSlug(store.slug); setView('inventory'); }} 
                      className="h-14 bg-slate-900 text-white rounded-2xl font-black text-xs flex items-center justify-center shadow-lg active:scale-95 transition-all"
                    >
                      在庫管理
                    </button>
                    <button 
                      onClick={() => window.open(getSafeUrl(`/${store.slug}`), '_blank')} 
                      className="h-14 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs flex items-center justify-center shadow-sm active:bg-slate-50"
                    >
                      メニューを開く <ExternalLink size={14} className="ml-2"/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'settings' && <StoreSettingsView editSlug={editSlug} onBack={() => setView('dashboard')} onSuccess={() => setView('dashboard')} />}
        {view === 'inventory' && activeSlug && <InventoryManagerView slug={activeSlug} onBack={() => setView('dashboard')} />}
        {view === 'master' && <MasterManagerView onBack={() => setView('dashboard')} />}
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-16 bg-white/90 backdrop-blur-xl border border-white/20 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex justify-around items-center z-[150]">
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 flex-1 transition-all ${view === 'dashboard' || view === 'inventory' || view === 'settings' ? 'text-amber-500 scale-110' : 'text-slate-300'}`}>
          <LayoutDashboard size={22}/>
          <span className="text-[8px] font-black uppercase">Stores</span>
        </button>
        <button onClick={() => setView('master')} className={`flex flex-col items-center gap-1 flex-1 transition-all ${view === 'master' ? 'text-amber-500 scale-110' : 'text-slate-300'}`}>
          <Database size={22}/>
          <span className="text-[8px] font-black uppercase">Catalog</span>
        </button>
      </nav>

      {qrModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md" onClick={() => setQrModal(null)}>
          <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl max-w-xs w-full text-center space-y-8 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-2">
              <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Digital Menu Access</span>
              <button onClick={() => setQrModal(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors active:scale-90"><X size={20} className="text-slate-300" /></button>
            </div>
            <div className="aspect-square bg-slate-50 rounded-[3rem] border-8 border-slate-50 shadow-inner flex items-center justify-center p-6">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getSafeUrl('/' + qrModal.slug))}`} alt="QR" className="w-full h-full mix-blend-multiply" />
            </div>
            <div className="space-y-1">
              <p className="font-black text-2xl text-slate-900 leading-tight">{qrModal.name}</p>
              <p className="text-[10px] text-slate-400 font-bold opacity-50 tracking-widest">/{qrModal.slug}</p>
            </div>
            <button onClick={() => setQrModal(null)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm active:scale-95 shadow-xl border-b-4 border-black transition-all">閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}
