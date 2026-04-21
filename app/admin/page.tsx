"use client";
export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Plus, ExternalLink, Database, LayoutDashboard, ArrowRight, Search, QrCode } from 'lucide-react';

export default function AdminDashboard() {
  const [stores, setStores] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    // さきほど作ったAPIから店舗一覧を取得
    fetch('/api/store/list')
      .then(res => res.json())
      .then(data => setStores(Array.isArray(data) ? data : []))
      .catch(() => setStores([]));
  }, []);

  // 100店舗の中から検索するロジック
  const filteredStores = stores.filter(s => 
    s.store_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 text-left selection:bg-amber-500">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-slate-900 rounded-[1.5rem] text-white shadow-xl">
              <LayoutDashboard size={32}/>
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Portfolio</h1>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">100+ Stores Management</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push('/admin/master')} className="px-6 py-3 bg-white border-2 border-slate-200 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all text-xs">
              <Database size={16}/> マスター更新
            </button>
            <button onClick={() => router.push('/admin/settings')} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-black transition-all text-xs shadow-lg shadow-slate-900/20">
              <Plus size={16}/> 新規店舗登録
            </button>
          </div>
        </header>

        {/* 検索バー */}
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={20}/>
          <input 
            type="text" 
            placeholder="店舗名またはURL（Slug）で検索..." 
            className="w-full p-6 pl-16 bg-white rounded-[2rem] border-2 border-transparent focus:border-amber-500 outline-none shadow-sm transition-all font-bold text-slate-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.length === 0 ? (
            <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100 text-slate-300 font-bold">
              店舗が見つかりません。
            </div>
          ) : (
            filteredStores.map(store => (
              <div key={store.slug} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6 hover:shadow-2xl hover:-translate-y-1 transition-all group">
                <div className="flex justify-between items-start">
                  <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors"><Store size={24}/></div>
                  <a href={`/${store.slug}`} target="_blank" className="flex items-center gap-1 text-[10px] font-black text-amber-500 uppercase tracking-widest hover:underline">
                    Public Link <ExternalLink size={12}/>
                  </a>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 truncate">{store.store_name}</h2>
                  <p className="text-slate-400 font-mono text-[10px] mt-1 tracking-tighter">URL: /{store.slug}</p>
                </div>
                <button onClick={() => router.push(`/admin/inventory/${store.slug}`)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-black transition-all flex items-center justify-center gap-2">
                  在庫・価格を更新 <ArrowRight size={14}/>
                </button>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
