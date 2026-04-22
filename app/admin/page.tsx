"use client";
export const runtime = 'edge';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Plus, Search, Database, LayoutDashboard, LogOut, Download, ExternalLink, Settings, FileSpreadsheet } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900 text-left">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black flex items-center gap-4"><LayoutDashboard size={40}/> Store Manager</h1>
            <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest ml-14">ピーロート営業支援プラットフォーム</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => window.location.href='/api/master/export'} className="bg-white border-2 border-slate-200 text-slate-600 px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm"><Download size={18} className="text-blue-500"/> マスターCSV</button>
            <button onClick={() => router.push('/admin/master')} className="bg-white border-2 border-slate-200 text-slate-600 px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm"><Database size={18} className="text-amber-500"/> 商品管理</button>
            <button onClick={() => router.push('/admin/settings')} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:shadow-xl"><Plus size={18}/> 店舗追加</button>
            <button onClick={handleLogout} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><LogOut size={24}/></button>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={24}/>
          <input type="text" placeholder="店舗名やURLで検索..." className="w-full p-7 pl-16 bg-white rounded-[2.5rem] shadow-sm outline-none ring-amber-500 font-bold text-lg border-2 border-transparent focus:border-amber-500 transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stores.filter(s => s.store_name.includes(searchQuery) || s.slug.includes(searchQuery)).map(store => (
            <div key={store.slug} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6 hover:shadow-2xl transition-all group">
              <div className="flex justify-between items-start">
                <div className="p-5 bg-slate-900 text-white rounded-3xl"><Store size={28}/></div>
                <div className="flex gap-2">
                  <a href={`/${store.slug}`} target="_blank" className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-amber-600 hover:bg-white transition-all"><ExternalLink size={20}/></a>
                  <a href={`/api/store/export/${store.slug}`} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-emerald-600 hover:bg-white transition-all"><FileSpreadsheet size={20}/></a>
                  <button onClick={() => router.push(`/admin/settings?edit=${store.slug}`)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-900 hover:bg-white transition-all"><Settings size={20}/></button>
                </div>
              </div>
              <h3 className="text-2xl font-black truncate">{store.store_name}</h3>
              <button onClick={() => router.push(`/admin/inventory/${store.slug}`)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase hover:bg-amber-500 hover:text-black transition-all shadow-lg text-center">在庫・価格を編集</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
