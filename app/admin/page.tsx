// app/admin/page.tsx
"use client";

export const runtime = 'edge';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, Plus, Search, Database, LayoutDashboard, LogOut, 
  ExternalLink, Settings, QrCode, X, Loader2, ArrowLeft, 
  CheckCircle2, AlertCircle, Save, Wine, Palette, 
  Eye, EyeOff, Sparkles, Trash2, ChevronRight, RefreshCw
} from 'lucide-react';

/**
 * プレビュー・本番環境共通のパス解決ヘルパー
 * 相対パスを確実に絶対URLに変換し、Locationへの代入エラーを防ぎます。
 */
const getSafeUrl = (path: string) => {
  if (!path) return '#';
  if (typeof window === 'undefined') return path;
  try {
    const origin = window.location.origin;
    // blob URL や null origin の場合、現在の href をベースにする
    const baseUrl = (origin && origin !== 'null' && !origin.startsWith('blob:')) 
      ? origin 
      : window.location.href.split('?')[0].split('#')[0];
    
    // パスがスラッシュで始まっていない場合は補完
    const safePath = path.startsWith('/') ? path : `/${path}`;
    // URL オブジェクトを使用して確実に絶対URLを生成
    return new URL(safePath, baseUrl).href;
  } catch (e) { 
    console.warn("URL resolution failed, falling back to original path", e);
    return path || '#'; 
  }
};

/**
 * --- 店舗設定ビュー (新規登録/編集) ---
 */
function StoreSettingsView({ editStore, onBack, onSuccess }: { editStore: any | null, onBack: () => void, onSuccess: () => void }) {
  const [name, setName] = useState(editStore?.store_name || '');
  const [slug, setSlug] = useState(editStore?.slug || '');
  const [color, setColor] = useState(editStore?.theme_color || '#b45309');
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
          store_name: name, 
          slug: slug.trim().toLowerCase(), 
          theme_color: color,
          is_edit: !!editStore
        }),
      });

      const result = await res.json();
      if (res.ok) {
        onSuccess();
      } else {
        setError(result.error || '保存に失敗しました。');
      }
    } catch (err) {
      setError('通信エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 pb-20">
      <div className="flex items-center gap-4 px-2">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100 active:scale-90 transition-all">
          <ArrowLeft size={20}/>
        </button>
        <h2 className="text-2xl font-black text-slate-800">{editStore ? '店舗情報を編集' : '新規店舗を登録'}</h2>
      </div>

      <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-slate-50">
        <form onSubmit={handleSave} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">店舗名称 (レストラン名など)</label>
            <input 
              type="text" required value={name} onChange={e => setName(e.target.value)} 
              placeholder="例：ピーロート日比谷店" 
              className="w-full h-16 px-6 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-amber-500 transition-all outline-none" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">URLスラッグ (半角英数字のみ)</label>
            <input 
              type="text" required disabled={!!editStore} value={slug} 
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} 
              placeholder="hibiya-pieroth" 
              className="w-full h-16 px-6 bg-slate-50 rounded-2xl font-bold border-2 border-transparent outline-none disabled:opacity-50" 
            />
            {!editStore && <p className="text-[9px] text-slate-400 ml-4 font-bold">※一度登録すると変更できません</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">メニューテーマカラー</label>
            <div className="flex items-center gap-6 p-5 bg-slate-50 rounded-2xl">
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-14 h-14 rounded-xl cursor-pointer bg-transparent border-none" />
              <span className="font-mono font-black text-slate-700 uppercase tracking-widest">{color}</span>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16}/> {error}
            </div>
          )}

          <button 
            type="submit" disabled={loading} 
            className="w-full h-18 bg-slate-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={22}/>}
            {editStore ? '変更を保存する' : '店舗メニューを開設する'}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * --- メインダッシュボード ---
 */
export default function AdminDashboard() {
  const [view, setView] = useState<'dashboard' | 'settings'>('dashboard');
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editStore, setEditStore] = useState<any | null>(null);
  const [qrModal, setQrModal] = useState<any | null>(null);
  const [search, setSearch] = useState("");

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await fetch(getSafeUrl('/api/store/list'));
      if (res.ok) {
        const data = await res.json();
        setStores(data);
      }
    } catch (e) {
      console.error("Fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStores(); }, []);

  const filteredStores = useMemo(() => 
    stores.filter(s => s.store_name.toLowerCase().includes(search.toLowerCase()) || s.slug.includes(search)),
    [stores, search]
  );

  const handleLogout = async () => {
    try {
      await fetch(getSafeUrl('/api/auth/logout'), { method: 'POST' });
      // 絶対URLを使用してリダイレクト
      window.location.href = getSafeUrl('/admin/login');
    } catch (e) {
      console.error("Logout error", e);
      window.location.href = getSafeUrl('/admin/login');
    }
  };

  if (view === 'settings') {
    return (
      <main className="min-h-screen bg-slate-50 p-5 md:p-10">
        <div className="max-w-xl mx-auto">
          <StoreSettingsView 
            editStore={editStore} 
            onBack={() => { setView('dashboard'); setEditStore(null); }} 
            onSuccess={() => { setView('dashboard'); setEditStore(null); fetchStores(); }} 
          />
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-40 font-sans text-slate-900 antialiased overflow-x-hidden selection:bg-amber-100">
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-[100] shadow-sm">
        <h1 className="text-xl font-black italic tracking-tighter cursor-pointer flex items-center gap-2" onClick={() => fetchStores()}>
          <LayoutDashboard className="text-amber-500" size={22} /> PIEROTH <span className="font-light text-slate-400 text-sm tracking-widest uppercase">Management</span>
        </h1>
        <button onClick={handleLogout} className="p-2 text-slate-300 hover:text-red-500 transition-colors active:scale-90">
          <LogOut size={20} />
        </button>
      </header>

      <main className="max-w-xl mx-auto p-5 space-y-8">
        {/* サマリー・アクション */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">担当店舗一覧</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">{stores.length} STORES ACTIVE</p>
          </div>
          <button 
            onClick={() => { setEditStore(null); setView('settings'); }}
            className="w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all"
          >
            <Plus size={28}/>
          </button>
        </div>

        {/* 検索 */}
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={20}/>
          <input 
            type="text" placeholder="店名やURLで検索..." 
            className="w-full h-16 pl-14 pr-6 bg-white rounded-2xl border-2 border-transparent shadow-sm font-bold text-sm outline-none focus:border-amber-500 transition-all"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* 店舗リスト */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-amber-500" size={32} />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Syncing with D1...</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredStores.length === 0 ? (
              <div className="bg-white p-16 rounded-[3rem] border-2 border-dashed border-slate-100 text-center space-y-4">
                <Store size={40} className="mx-auto text-slate-100" />
                <p className="text-slate-300 font-bold italic text-sm">管理店舗が見つかりません</p>
              </div>
            ) : (
              filteredStores.map(store => (
                <div key={store.slug} className="bg-white p-6 rounded-[2.8rem] shadow-sm border border-slate-50 flex flex-col gap-6 hover:shadow-md transition-all active:scale-[0.99] group relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-14 h-14 rounded-[1.2rem] flex items-center justify-center text-white shadow-lg group-hover:rotate-3 transition-transform" 
                        style={{ backgroundColor: store.theme_color || '#b45309' }}
                      >
                        <Store size={28}/>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-lg text-slate-800 leading-tight truncate max-w-[160px]">{store.store_name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">/{store.slug}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setQrModal(store)} className="p-3 text-slate-300 hover:text-amber-500 transition-colors"><QrCode size={20}/></button>
                      <button onClick={() => { setEditStore(store); setView('settings'); }} className="p-3 text-slate-300 hover:text-slate-900 transition-colors"><Settings size={20}/></button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => window.location.href = getSafeUrl(`/admin/inventory/${store.slug}`)}
                      className="h-14 bg-slate-900 text-white rounded-2xl font-black text-xs flex items-center justify-center shadow-lg active:scale-95 transition-all"
                    >
                      在庫管理
                    </button>
                    <button 
                      onClick={() => window.open(getSafeUrl(`/${store.slug}`), '_blank')}
                      className="h-14 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs flex items-center justify-center shadow-sm active:bg-slate-50 transition-all"
                    >
                      メニューを開く <ExternalLink size={14} className="ml-2"/>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* フッターナビ */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-18 bg-white/90 backdrop-blur-xl border border-white/20 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex justify-around items-center z-[150] px-4">
        <button onClick={() => { setView('dashboard'); fetchStores(); }} className={`flex flex-col items-center gap-1 flex-1 transition-all ${view === 'dashboard' ? 'text-amber-500 scale-110' : 'text-slate-300'}`}>
          <LayoutDashboard size={24}/>
          <span className="text-[8px] font-black uppercase">Stores</span>
        </button>
        <button onClick={() => window.location.href = getSafeUrl('/admin/master')} className={`flex flex-col items-center gap-1 flex-1 transition-all text-slate-300 hover:text-slate-600`}>
          <Database size={24}/>
          <span className="text-[8px] font-black uppercase">Master</span>
        </button>
      </nav>

      {/* QRモーダル */}
      {qrModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md" onClick={() => setQrModal(null)}>
          <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl max-w-xs w-full text-center space-y-8 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-2">
              <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Digital Menu Access</span>
              <button onClick={() => setQrModal(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors active:scale-90"><X size={20} className="text-slate-300" /></button>
            </div>
            <div className="aspect-square bg-slate-50 rounded-[4rem] border-8 border-slate-50 shadow-inner flex items-center justify-center p-6">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getSafeUrl('/' + qrModal.slug))}`} 
                alt="QR" className="w-full h-full mix-blend-multiply" 
              />
            </div>
            <div className="space-y-1">
              <p className="font-black text-2xl text-slate-900 leading-tight">{qrModal.store_name}</p>
              <p className="text-[10px] text-slate-400 font-bold opacity-50 tracking-widest">/{qrModal.slug}</p>
            </div>
            <button onClick={() => setQrModal(null)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm active:scale-95 shadow-xl transition-all uppercase tracking-widest">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
