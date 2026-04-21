"use client";
export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Plus, ExternalLink, QrCode, Search, Database, LayoutDashboard } from 'lucide-react';

export default function AdminDashboard() {
  const [stores, setStores] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showQR, setShowQR] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/store/list').then(res => res.json()).then(data => setStores(Array.isArray(data) ? data : []));
  }, []);

  const filtered = stores.filter(s => s.store_name.includes(searchQuery) || s.slug.includes(searchQuery));

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-left">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex justify-between items-end">
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-4"><LayoutDashboard size={32}/> Store Manager</h1>
          <button onClick={() => router.push('/admin/settings')} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2"><Plus size={18}/> 新規登録</button>
        </div>

        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
          <input type="text" placeholder="店舗を検索..." className="w-full p-6 pl-16 bg-white rounded-[2rem] shadow-sm outline-none focus:ring-2 ring-amber-500 font-bold" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(store => (
            <div key={store.slug} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex justify-between">
                <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Store size={24}/></div>
                <div className="flex gap-2">
                  <button onClick={() => setShowQR(`${window.location.origin}/${store.slug}`)} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900"><QrCode size={20}/></button>
                  <a href={`/${store.slug}`} target="_blank" className="p-3 bg-slate-50 rounded-xl text-slate-400"><ExternalLink size={20}/></a>
                </div>
              </div>
              <h3 className="text-xl font-black truncate">{store.store_name}</h3>
              <button onClick={() => router.push(`/admin/inventory/${store.slug}`)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest">在庫・価格設定</button>
            </div>
          ))}
        </div>
      </div>

      {showQR && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100]" onClick={() => setShowQR(null)}>
          <div className="bg-white p-12 rounded-[3rem] text-center space-y-6 max-w-sm w-full">
            <h2 className="text-xl font-black uppercase tracking-tight">Store Menu QR</h2>
            <div className="bg-slate-100 p-8 rounded-3xl flex flex-col items-center gap-4">
              <QrCode size={120} />
              <p className="text-[10px] font-mono text-slate-400 break-all">{showQR}</p>
            </div>
            <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs">印刷用に出力 (PDF)</button>
          </div>
        </div>
      )}
    </div>
  );
}
