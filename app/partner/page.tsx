// app/partner/page.tsx
"use client";

export const runtime = 'edge';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, Search, LayoutDashboard, LogOut, 
  ExternalLink, QrCode, X, Loader2, Download, 
  Check, Save, Edit3, Database, GlassWater, Sparkles, Wine,
  AlertCircle, RefreshCw, ArrowRight
} from 'lucide-react';

/**
 * プレビュー環境（サンドボックス）でのURL解析エラーを回避するための堅牢なヘルパー
 */
const getSafeUrl = (path: string) => {
  if (!path) return '#';
  if (typeof window === 'undefined') return path;
  try {
    const origin = window.location.origin;
    // blob URL や null origin の場合、現在の URL をベースにする
    const baseUrl = (!origin || origin === 'null' || origin.startsWith('blob:')) 
      ? window.location.href.split('?')[0].split('#')[0]
      : origin;
    
    // パスが '/' から始まっていない場合は補完し、正規化された絶対URLを返す
    const safePath = path.startsWith('/') ? path : `/${path}`;
    return new URL(safePath, baseUrl).href;
  } catch (e) { 
    return path; 
  }
};

/**
 * JSONレスポンスを安全に取得するためのヘルパー
 */
async function fetchJson(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  
  if (!res.ok) {
    if (res.status === 401) throw new Error("セッションが切れました。再ログインしてください。");
    if (res.status === 404) {
      const err = new Error(`APIエンドポイントが見つかりません (404): ${url}`);
      (err as any).status = 404;
      throw err;
    }
    throw new Error(`APIエラー: ${res.status}`);
  }

  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("サーバーから無効なデータが返されました。");
  }

  return await res.json();
}

export default function PartnerDashboard() {
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [master, setMaster] = useState<any[]>([]);
  const [inventory, setInventory] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [qrModal, setQrModal] = useState(false);
  
  // 店舗識別子が見つからない場合の入力用
  const [manualSlug, setManualSlug] = useState("");
  const [isSlugMissing, setIsSlugMissing] = useState(false);

  // パートナー情報の初期化
  const init = async (targetSlug?: string) => {
    setLoading(true);
    setError(null);
    setIsSlugMissing(false);

    try {
      // 1. 全銘柄リストの取得（失敗しても続行）
      try {
        const mData = await fetchJson(getSafeUrl('/api/master/list'));
        setMaster(Array.isArray(mData) ? mData : []);
      } catch (e) {
        console.warn("Master list sync skipped");
      }

      // 2. 店舗識別子（Slug）の特定
      const urlParams = new URLSearchParams(window.location.search);
      let slug = targetSlug || urlParams.get('slug') || urlParams.get('s') || localStorage.getItem('partner_slug');

      if (!slug) {
        try {
          const stores = await fetchJson(getSafeUrl('/api/store/list'));
          slug = stores[0]?.slug;
        } catch (e: any) {
          console.warn("API /api/store/list not available:", e.message);
        }
      }
      
      // 依然としてSlugがない場合は入力UIへ
      if (!slug) {
        setIsSlugMissing(true);
        setLoading(false);
        return;
      }

      // 3. 在庫情報と店舗設定を並列で取得
      const [sData, configData] = await Promise.all([
        fetchJson(getSafeUrl(`/api/wines?slug=${slug}`)),
        fetchJson(getSafeUrl(`/api/store/config/public?slug=${slug}`))
      ]);

      setStoreInfo({ ...configData, slug });
      localStorage.setItem('partner_slug', slug); 
      
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
    } catch (e: any) { 
      console.error("Sync Error", e); 
      setError(String(e.message || "データの同期に失敗しました。"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { init(); }, []);

  const handleManualSlugSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualSlug.trim()) {
      init(manualSlug.trim().toLowerCase());
    }
  };

  const toggleVisibility = async (wineId: string) => {
    if (updatingId || !storeInfo?.slug) return;
    setUpdatingId(wineId);
    
    const isCurrentlyActive = !!inventory[wineId];

    try {
      await fetchJson(getSafeUrl('/api/store/inventory/toggle'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: storeInfo.slug, wineId })
      });
      
      setInventory(prev => {
        const next = { ...prev };
        if (isCurrentlyActive) {
          delete next[wineId];
        } else {
          const m = master.find(x => x.id === wineId);
          next[wineId] = { active: true, price_bottle: m?.price_bottle || 0, price_glass: 0, stock: 0 };
        }
        return next;
      });
    } catch (e: any) { 
      console.error("Toggle error:", e);
    } finally {
      setUpdatingId(null);
    }
  };

  const updateField = async (wineId: string, field: string, value: number) => {
    if (!storeInfo?.slug || isNaN(value)) return;
    try {
      await fetchJson(getSafeUrl('/api/store/inventory/update'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: storeInfo.slug, wineId, [field]: value })
      });
      setInventory(prev => ({
        ...prev,
        [wineId]: { ...prev[wineId], [field]: value }
      }));
    } catch (e: any) { console.error("Field update error:", e); }
  };

  const handleReflect = async () => {
    setSyncing(true);
    await init(storeInfo?.slug);
    setTimeout(() => setSyncing(false), 800);
  };

  const filtered = useMemo(() => 
    master.filter(w => 
      (w.name_jp || "").toLowerCase().includes(search.toLowerCase()) || 
      (w.id || "").toLowerCase().includes(search.toLowerCase())
    ).slice(0, 50),
    [master, search]
  );

  const handleLogout = () => {
    localStorage.removeItem('partner_slug');
    window.location.href = '/partner/login';
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-amber-500" size={32} />
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Loading Store Data...</p>
    </div>
  );

  // 店舗IDが見つからない場合のフォールバックUI
  if (isSlugMissing) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-slate-200">
        <div className="flex justify-center mb-8">
          <div className="p-5 bg-slate-900 text-amber-500 rounded-3xl shadow-xl">
            <Store size={40}/>
          </div>
        </div>
        <div className="text-center mb-8">
          <h2 className="text-xl font-black text-slate-900">店舗IDを指定してください</h2>
          <p className="text-xs text-slate-400 font-bold mt-2">管理する店舗のURLスラッグを入力してください</p>
        </div>
        <form onSubmit={handleManualSlugSubmit} className="space-y-4">
          <input 
            type="text" 
            placeholder="例: pieroth-hibiya" 
            className="w-full h-16 px-6 bg-slate-100 text-slate-900 rounded-2xl font-bold outline-none focus:ring-2 ring-amber-500 transition-all"
            value={manualSlug}
            onChange={e => setManualSlug(e.target.value)}
            autoFocus
          />
          <button 
            type="submit" 
            className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-amber-500 hover:text-slate-950 transition-all shadow-lg"
          >
            ダッシュボードを開く <ArrowRight size={20}/>
          </button>
        </form>
        <div className="mt-8 text-center">
          <button onClick={handleLogout} className="text-xs text-slate-400 font-bold underline">ログイン画面へ戻る</button>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 gap-6 text-center">
      <div className="p-8 bg-white rounded-[2.5rem] shadow-2xl space-y-5 max-w-sm border border-slate-100 animate-in fade-in zoom-in-95">
        <AlertCircle size={48} className="text-red-500 mx-auto" />
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900">アクセスエラー</h2>
          <p className="text-xs text-slate-500 font-bold leading-relaxed">{error}</p>
        </div>
        <div className="pt-2 space-y-3">
          <button 
            onClick={() => init()} 
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <RefreshCw size={18}/> データを再読み込み
          </button>
          <button 
            onClick={() => setIsSlugMissing(true)} 
            className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs hover:bg-slate-100 transition-colors"
          >
            店舗IDを手動で入力する
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans antialiased overflow-x-hidden selection:bg-amber-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 text-amber-500 rounded-xl shadow-lg">
            <Store size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black text-slate-900 truncate leading-tight">{storeInfo?.store_name || "店舗管理"}</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Partner Dashboard</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2.5 text-slate-400 bg-slate-50 rounded-full hover:text-red-500 active:bg-red-50 transition-colors"><LogOut size={20} /></button>
      </header>

      <main className="max-w-xl mx-auto p-5 space-y-6">
        {/* メニュー反映 & QR操作 */}
        <div className="flex gap-3">
          <button 
            onClick={() => setQrModal(true)}
            className="flex-1 h-14 bg-white border border-slate-200 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-sm active:bg-slate-50 transition-all hover:border-amber-200"
          >
            <QrCode size={18} className="text-slate-400"/> QR表示
          </button>
          <button 
            onClick={handleReflect}
            disabled={syncing}
            className="flex-1 h-14 bg-amber-500 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {syncing ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>}
            メニューに反映
          </button>
        </div>

        {/* 検索バー */}
        <div className="relative sticky top-[80px] z-20 py-2 bg-slate-50/80 backdrop-blur-md">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={18}/>
            <input 
              type="text" placeholder="商品名や銘柄IDで検索..." 
              className="w-full h-14 pl-12 pr-4 bg-white rounded-2xl border border-slate-100 shadow-sm font-bold text-sm outline-none focus:ring-2 ring-amber-500/20 focus:border-amber-500 transition-all"
              value={search} onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>

        {/* ワインリスト */}
        <div className="grid gap-4">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-300 font-bold italic space-y-2 opacity-60">
              <Wine size={48} className="mx-auto" />
              <p>該当するワインがありません</p>
            </div>
          ) : (
            filtered.map(w => {
              const inv = inventory[w.id];
              const isActive = !!inv;
              return (
                <div 
                  key={w.id} 
                  className={`bg-white p-5 rounded-[2.2rem] border-2 flex flex-col gap-4 transition-all duration-300 ${
                    isActive ? 'border-amber-500 shadow-xl' : 'border-transparent opacity-60 grayscale-[0.2]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-20 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-inner border border-slate-100">
                      <img src={w.image_url} className="max-h-full object-contain p-1" alt="" onError={(e:any)=>e.target.src='https://placehold.co/100x150?text=WINE'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">ID: {w.id}</span>
                        <span className="text-[8px] font-black text-slate-300 truncate">{w.country}</span>
                      </div>
                      <h4 className="font-black text-slate-900 text-[13px] leading-tight line-clamp-2">{w.name_jp}</h4>
                    </div>
                    <button 
                      onClick={() => toggleVisibility(w.id)}
                      disabled={updatingId === w.id}
                      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all shadow-md active:scale-90 ${
                        isActive ? 'bg-amber-500 text-white shadow-amber-200' : 'bg-slate-100 text-slate-300'
                      }`}
                    >
                      {updatingId === w.id ? <Loader2 className="animate-spin" size={20}/> : <Check size={26} strokeWidth={4}/>}
                    </button>
                  </div>

                  {isActive && (
                    <div className="space-y-3 pt-3 border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase ml-2">
                            <Edit3 size={10}/> ボトル価格 (¥)
                          </div>
                          <input 
                            type="number" 
                            className="w-full h-11 px-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-amber-500/20 focus:border-amber-500 transition-all"
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
                            className="w-full h-11 px-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-amber-500/20 focus:border-amber-500 transition-all"
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
                          className="w-full h-11 px-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-amber-500/20 focus:border-amber-500 transition-all"
                          defaultValue={inv.stock}
                          onBlur={(e) => updateField(w.id, 'stock', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* QRコードモーダル */}
      {qrModal && storeInfo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setQrModal(false)}>
          <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl max-w-xs w-full text-center space-y-8 animate-in zoom-in-95 duration-300 border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-2">
              <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Menu Access QR</span>
              <button onClick={() => setQrModal(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors active:scale-90"><X size={20} className="text-slate-300" /></button>
            </div>
            <div className="aspect-square bg-slate-50 rounded-[3rem] border-8 border-slate-50 overflow-hidden shadow-inner flex items-center justify-center p-6 relative group">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(getSafeUrl('/' + storeInfo.slug))}`} alt="QR" className="w-full h-full mix-blend-multiply hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="space-y-1">
              <p className="font-black text-2xl text-slate-900 leading-tight tracking-tight">{storeInfo.store_name}</p>
              <p className="text-[11px] text-slate-400 font-bold break-all opacity-40 italic">/{storeInfo.slug}</p>
            </div>
            <button onClick={() => setQrModal(false)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm active:scale-95 shadow-xl hover:bg-slate-800 transition-all border-b-4 border-black uppercase tracking-widest">閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}
