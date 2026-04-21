"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wine, Store, Plus, ExternalLink, Database, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const [stores, setStores] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    // 登録済みの店舗一覧を取得
    fetch('/api/store/list').then(res => res.json()).then(setStores).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-left">
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Wine Management</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">インポーター専用コントロールパネル</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push('/admin/master')} className="px-6 py-3 bg-white border-2 border-slate-200 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all text-sm">
              <Database size={18}/> マスター更新
            </button>
            <button onClick={() => router.push('/admin/settings')} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-black transition-all text-sm">
              <Plus size={18}/> 新規店舗登録
            </button>
          </div>
        </header>

        <section className="grid md:grid-cols-2 gap-6">
          {stores.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100 text-slate-300 font-bold">
              まだ店舗が登録されていません。「新規店舗登録」から開始してください。
            </div>
          ) : (
            stores.map(store => (
              <div key={store.slug} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6 hover:shadow-2xl transition-all">
                <div className="flex justify-between items-start">
                  <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl"><Store size={24}/></div>
                  <a href={`/${store.slug}`} target="_blank" className="flex items-center gap-1 text-[10px] font-black text-amber-500 uppercase tracking-widest hover:underline">
                    Public Link <ExternalLink size={12}/>
                  </a>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{store.store_name}</h2>
                  <p className="text-slate-400 font-mono text-xs">URL: /{store.slug}</p>
                </div>
                <div className="pt-4 flex gap-2">
                  <button onClick={() => router.push(`/admin/inventory/${store.slug}`)} className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-bold text-sm hover:scale-[1.02] transition-all">
                    ワインを選ぶ
                  </button>
                  <button onClick={() => router.push(`/admin/settings?edit=${store.slug}`)} className="p-4 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all">
                    <Settings size={20}/>
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
