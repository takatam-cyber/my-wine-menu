"use client";
export const runtime = 'edge';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Plus, Search, Database, LayoutDashboard, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const [stores, setStores] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch('/api/store/list').then(res => res.json()).then(data => setStores(Array.isArray(data) ? data : []));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-4"><LayoutDashboard size={32}/> Store Manager</h1>
          </div>
          <div className="flex gap-4">
            <button onClick={() => router.push('/admin/master')} className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-bold flex items-center gap-2">
              <Database size={18} className="text-amber-500"/> マスター管理
            </button>
            <button onClick={() => router.push('/admin/settings')} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2">
              <Plus size={18}/> 店舗追加
            </button>
            <button onClick={handleLogout} className="p-3 text-slate-400 hover:text-red-500 transition-colors">
              <LogOut size={24}/>
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
          <input type="text" placeholder="担当店舗を検索..." className="w-full p-6 pl-16 bg-white rounded-[2rem] shadow-sm outline-none ring-amber-500 font-bold" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {stores.filter(s => s.store_name.includes(searchQuery)).map(store => (
            <div key={store.slug} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl w-fit"><Store size={24}/></div>
              <h3 className="text-xl font-black truncate">{store.store_name}</h3>
              <button onClick={() => router.push(`/admin/inventory/${store.slug}`)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest">在庫・価格編集</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
