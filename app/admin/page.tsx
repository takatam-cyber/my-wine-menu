// app/admin/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Plus, ExternalLink, Database, LayoutDashboard, ArrowRight, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const [stores, setStores] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/store/config').then(res => {
      if (res.status === 401) router.push('/admin/login'); // 認証切れ対応
      return res.json();
    }).then(setStores).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="p-5 bg-slate-900 rounded-[2rem] text-white shadow-2xl">
              <LayoutDashboard size={36}/>
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Pieroth Admin</h1>
              <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Wine Sales Support System</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => router.push('/admin/master')} className="px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl font-bold flex items-center gap-2 hover:border-amber-500 hover:text-amber-600 transition-all text-xs">
              <Database size={18}/> マスターデータ管理
            </button>
            <button onClick={() => router.push('/admin/settings')} className="px-6 py-4 bg-amber-500 text-black rounded-2xl font-black flex items-center gap-2 hover:bg-amber-400 transition-all text-xs shadow-lg shadow-amber-500/20">
              <Plus size={18}/> 新規店舗を登録
            </button>
            <button onClick={handleLogout} className="p-4 bg-slate-200 text-slate-600 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all">
              <LogOut size={20}/>
            </button>
          </div>
        </header>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stores.length === 0 ? (
            <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100 text-slate-300 font-bold">
              店舗が登録されていません。右上のボタンから追加してください。
            </div>
          ) : (
            stores.map(store => (
              <div key={store.slug} className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50 space-y-8 hover:shadow-2xl hover:-translate-y-1 transition-all group">
                <div className="flex justify-between items-start">
                  <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all shadow-inner">
                    <Store size={28}/>
                  </div>
                  <a href={`/${store.slug}`} target="_blank" className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 uppercase tracking-widest hover:bg-amber-50 px-3 py-1.5 rounded-full transition-colors">
                    Preview <ExternalLink size={12}/>
                  </a>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">{store.store_name}</h2>
                  <p className="text-slate-400 font-mono text-[11px] mt-2 bg-slate-50 px-3 py-1 rounded-md inline-block">/{store.slug}</p>
                </div>
                <div className="space-y-3">
                  <button 
                    onClick={() => router.push(`/admin/inventory/${store.slug}`)} 
                    className="w-full py-5 bg-slate-900 text-white rounded-[1.2rem] font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl"
                  >
                    在庫・価格を更新 <ArrowRight size={18}/>
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
