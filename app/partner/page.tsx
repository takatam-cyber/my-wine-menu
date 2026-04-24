// app/partner/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wine, GlassWater, Coins, CheckCircle2, AlertCircle, 
  Loader2, LogOut, QrCode, ExternalLink, RefreshCw,
  Search, SlidersHorizontal, ArrowLeft, Save, Sparkles,
  ChevronRight, LayoutGrid, Info
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
      .replace(/\/(partner|admin).*/, '');
    return base.replace(/\/+$/, '') + cleanPath;
  } catch (e) {
    return cleanPath;
  }
};

// --- サンプルデータ（ログイン後の状態をシミュレート） ---
const MOCK_STORE = {
  slug: 'pieroth-hibiya',
  store_name: 'ピーロート・ジャパン 日比谷店',
  theme_color: '#b45309'
};

const MOCK_INVENTORY = [
  { id: "P-9095472", name_jp: "パスカルトソ スパークリング", price_bottle: 3800, price_glass: 800, stock: 12, is_visible: 1, country: "アルゼンチン" },
  { id: "P-9343898", name_jp: "パスカルトソ CS レゼルヴァ", price_bottle: 5200, price_glass: 1200, stock: 5, is_visible: 1, country: "アルゼンチン" },
  { id: "P-7721102", name_jp: "ブルー・ナン ゴールド・エディション", price_bottle: 4500, price_glass: 950, stock: 0, is_visible: 1, country: "ドイツ" },
];

export default function PartnerDashboard() {
  const [store, setStore] = useState<any>(MOCK_STORE);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);

  // 簡易的な認証チェック（本来はJWT等の検証が必要）
  useEffect(() => {
    // デモ用: ログイン状態がなければログイン画面へ
    // 実際の実装では Cookie または localStorage を確認
  }, []);

  // データ取得
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const url = getSafeUrl(`/api/wines?slug=${store.slug}`);
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInventory(Array.isArray(data) && data.length > 0 ? data : MOCK_INVENTORY);
      } else {
        setInventory(MOCK_INVENTORY);
      }
    } catch (e) {
      setInventory(MOCK_INVENTORY);
    }
    setLoading(false);
  }, [store.slug]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  // 在庫・価格の即時更新
  const handleQuickUpdate = async (wineId: string, updates: any) => {
    setUpdating(wineId);
    try {
      const res = await fetch(getSafeUrl('/api/store/inventory/quick-update'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: store.slug, wineId, ...updates })
      });
      
      if (res.ok) {
        setInventory(prev => prev.map(w => w.id === wineId ? { ...w, ...updates } : w));
        setStatus({ type: 'success', msg: '更新しました' });
        setTimeout(() => setStatus(null), 2000);
      }
    } catch (e) {
      setStatus({ type: 'error', msg: '更新に失敗しました' });
    }
    setUpdating(null);
  };

  const filteredInventory = inventory.filter(w => 
    w.name_jp?.includes(search) || w.id?.includes(search)
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-40 font-sans antialiased">
      {/* ヘッダー */}
      <header className="bg-white border-b border-slate-100 px-6 py-5 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md rotate-2" style={{ backgroundColor: store.theme_color }}>
            <Wine size={22} strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 leading-none truncate max-w-[150px]">{store.store_name}</h1>
            <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mt-1">Partner Portal</p>
          </div>
        </div>
        <button onClick={() => window.location.href = getSafeUrl('/partner/login')} className="p-2.5 bg-slate-100 text-slate-400 rounded-full active:scale-90 transition-all">
          <LogOut size={18} />
        </button>
      </header>

      <main className="max-w-2xl mx-auto p-5 space-y-6">
        {/* クイックアクション */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => window.open(getSafeUrl(`/${store.slug}`), '_blank')}
            className="bg-slate-900 text-white p-4 rounded-[2rem] flex flex-col items-center gap-2 shadow-xl active:scale-95 transition-all"
          >
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"><ExternalLink size={18}/></div>
            <span className="text-[10px] font-black uppercase tracking-widest">メニューを確認</span>
          </button>
          <button 
            className="bg-white border border-slate-200 p-4 rounded-[2rem] flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-all"
            onClick={() => setStatus({ type: 'success', msg: 'QRコードを生成しました' })}
          >
            <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"><QrCode size={18}/></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">QRコード表示</span>
          </button>
        </div>

        {/* 検索・フィルター */}
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
          <input 
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="メニュー内を検索..." 
            className="w-full h-14 pl-14 pr-6 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 ring-amber-500/5 transition-all" 
          />
        </div>

        {/* 在庫管理リスト */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Wine Inventory</h2>
            <button onClick={fetchInventory} className="text-slate-400 active:rotate-180 transition-transform duration-500"><RefreshCw size={14}/></button>
          </div>

          {loading ? (
            <div className="py-20 text-center animate-pulse">
              <Loader2 className="animate-spin mx-auto text-slate-200 mb-4" size={32} />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Fetching menu...</p>
            </div>
          ) : filteredInventory.map(w => (
            <div key={w.id} className={`bg-white border border-slate-100 rounded-[2.5rem] p-5 shadow-sm transition-all ${w.stock <= 0 ? 'opacity-60 bg-slate-50' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  <div className="w-12 h-18 bg-white border border-slate-100 rounded-xl flex items-center justify-center p-2 shrink-0">
                    <img src={w.image_url || 'https://placehold.co/100x150?text=WINE'} className="w-full h-full object-contain" alt="" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[7px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase">{w.country}</span>
                      {w.stock <= 3 && w.stock > 0 && <span className="text-[7px] font-black text-red-500 uppercase tracking-tighter animate-pulse">残りわずか</span>}
                    </div>
                    <h3 className="text-sm font-black text-slate-800 leading-tight line-clamp-2">{w.name_jp}</h3>
                  </div>
                </div>
                {/* 完売ボタン */}
                <button 
                  disabled={updating === w.id}
                  onClick={() => handleQuickUpdate(w.id, { stock: w.stock > 0 ? 0 : 12 })}
                  className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${w.stock > 0 ? 'bg-slate-100 text-slate-400' : 'bg-red-500 text-white shadow-lg ring-4 ring-red-500/20'}`}
                >
                  {updating === w.id ? <Loader2 size={12} className="animate-spin" /> : w.stock > 0 ? '販売中' : '完売'}
                </button>
              </div>

              {/* 価格・在庫編集エリア */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><Coins size={10}/> Bottle (¥)</label>
                  <input 
                    type="number" 
                    value={w.price_bottle} 
                    onChange={e => setInventory(prev => prev.map(item => item.id === w.id ? {...item, price_bottle: parseInt(e.target.value)} : item))}
                    onBlur={(e) => handleQuickUpdate(w.id, { price_bottle: parseInt(e.target.value) })}
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-black outline-none focus:bg-white focus:ring-2 ring-amber-500/10" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><GlassWater size={10}/> Glass (¥)</label>
                  <input 
                    type="number" 
                    value={w.price_glass} 
                    onChange={e => setInventory(prev => prev.map(item => item.id === w.id ? {...item, price_glass: parseInt(e.target.value)} : item))}
                    onBlur={(e) => handleQuickUpdate(w.id, { price_glass: parseInt(e.target.value) })}
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-black outline-none focus:bg-white focus:ring-2 ring-amber-500/10" 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ステータス通知 */}
      {status && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-4 ${status.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {status.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
          <span className="text-xs font-black uppercase tracking-widest">{status.msg}</span>
        </div>
      )}

      {/* ボトムナビ */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pointer-events-none">
        <div className="max-w-2xl mx-auto flex items-center justify-center pointer-events-auto">
          <div className="bg-slate-900 text-white px-8 py-4 rounded-full flex items-center gap-6 shadow-2xl border border-white/10">
            <button className="flex flex-col items-center gap-1 text-amber-500"><LayoutGrid size={20}/><span className="text-[7px] font-black uppercase tracking-tighter">Inventory</span></button>
            <div className="w-[1px] h-4 bg-white/10" />
            <button className="flex flex-col items-center gap-1 text-white/40"><QrCode size={20}/><span className="text-[7px] font-black uppercase tracking-tighter">QR Code</span></button>
            <div className="w-[1px] h-4 bg-white/10" />
            <button className="flex flex-col items-center gap-1 text-white/40"><Sparkles size={20}/><span className="text-[7px] font-black uppercase tracking-tighter">AI Analysis</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}
