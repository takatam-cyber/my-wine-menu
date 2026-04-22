"use client";
export const runtime = 'edge';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Plus, Search, Database, LayoutDashboard, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const [stores, setStores] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch('/api/store/list').then(res => res.json()).then(data => setStores(Array.isArray(data) ? data : []));
  }, []);

  const filtered = stores.filter(s => s.store_name.includes(searchQuery) || s.slug.includes(searchQuery));

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-left font-sans text-slate-900">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* ヘッダーエリア */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-4"><LayoutDashboard size={32}/> Store Manager</h1>
            <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest">店舗別メニュー管理</p>
          </div>
          <div className="flex gap-4">
            {/* 【追加】マスターデータへのリンク */}
            <button onClick={() => router.push('/admin/master')} className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
              <Database size={18} className="text-amber-500"/> マスター管理
            </button>
            <button onClick={() => router.push('/admin/settings')} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-black shadow-lg">
              <Plus size={18}/> 店舗を追加
            </button>
          </div>
        </div>

        {/* 検索バー */}
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
          <input type="text" placeholder="店舗名やURLで検索..." className="w-full p-6 pl-16 bg-white rounded-[2rem] shadow-sm outline-none focus:ring-2 ring-amber-500 font-bold" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>

        {/* 店舗カードリスト */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(store => (
            <div key={store.slug} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6 hover:shadow-xl transition-all group">
              <div className="flex justify-between">
                <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Store size={24}/></div>
                <button onClick={() => router.push(`/admin/settings?edit=${store.slug}`)} className="p-3 text-slate-300 hover:text-slate-900 transition-colors">
                  <Settings size={20}/>
                </button>
              </div>
              <h3 className="text-xl font-black truncate">{store.store_name}</h3>
              <button onClick={() => router.push(`/admin/inventory/${store.slug}`)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all">
                在庫・価格を編集
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
