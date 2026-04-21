"use client";
export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Plus, ExternalLink, Search, Database, ArrowRight, Grid, QrCode, TrendingUp, BarChart3 } from 'lucide-react';

export default function AdminDashboard() {
  const [stores, setStores] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showQR, setShowQR] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/store/list').then(res => res.json()).then(setStores).catch(() => {});
  }, []);

  const filteredStores = stores.filter(s => 
    s.store_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-8 text-left font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-900/5 rounded-full -mr-32 -mt-32" />
          <div className="relative z-10 space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
              <TrendingUp className="text-amber-500" size={36}/> Portfolio Control
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">SaaS Edition 2026 / 1,000+ SKU Supported</p>
          </div>
          <div className="flex gap-4 relative z-10">
            <button onClick={() => router.push('/admin/master')} className="px-8 py-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-sm hover:border-slate-900 transition-all flex items-center gap-2">
              <Database size={18}/> マスター管理
            </button>
            <button onClick={() => router.push('/admin/settings')} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all flex items-center gap-2 shadow-2xl shadow-slate-900/40">
              <Plus size={18}/> 新規開拓
            </button>
          </div>
        </header>

        {/* 検索・分析バー */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24}/>
            <input 
              type="text" placeholder="店舗名、またはURLで瞬時に検索..." 
              className="w-full p-7 pl-16 bg-white rounded-[2.5rem] border-2 border-transparent focus:border-amber-500 outline-none shadow-sm font-bold text-lg transition-all"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredStores.map(store => (
            <div key={store.slug} className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all group">
              <div className="flex justify-between items-start mb-8">
                <div className="p-5 bg-amber-50 text-amber-600 rounded-3xl group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                  <Store size={28}/>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowQR(`${window.location.origin}/${store.slug}`)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-slate-900 transition-colors">
                    <QrCode size={20}/>
                  </button>
                  <a href={`/${store.slug}`} target="_blank" className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-amber-600 transition-colors">
                    <ExternalLink size={20}/>
                  </a>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight truncate">{store.store_name}</h3>
                <p className="text-slate-400 font-mono text-[11px] font-bold">/{store.slug}</p>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-50 flex gap-4">
                <button 
                  onClick={() => router.push(`/admin/inventory/${store.slug}`)}
                  className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/20"
                >
                  在庫・価格更新
                </button>
                <button className="px-5 py-5 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all">
                  <BarChart3 size={20}/>
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* QRコード表示モーダル */}
      {showQR && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowQR(null)}>
          <div className="bg-white p-12 rounded-[4rem] text-center space-y-6 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-slate-900 uppercase">Store QR Code</h2>
            <div className="bg-slate-50 p-8 rounded-[3rem] border-2 border-dashed border-slate-200 aspect-square flex items-center justify-center">
              <QrCode size={160} className="text-slate-900" />
            </div>
            <p className="text-xs font-bold text-slate-400 break-all">{showQR}</p>
            <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Print QR Sticker</button>
          </div>
        </div>
      )}
    </div>
  );
}
