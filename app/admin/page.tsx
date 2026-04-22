"use client";
export const runtime = 'edge';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Store, Plus, Search, Database, LayoutDashboard, 
  LogOut, Download, ExternalLink, Settings, FileSpreadsheet 
} from 'lucide-react';

export default function AdminDashboard() {
  const [stores, setStores] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch('/api/store/list')
      .then(res => res.json())
      .then(data => setStores(Array.isArray(data) ? data : []));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  // マスターCSVダウンロード
  const downloadMaster = () => {
    window.location.href = '/api/master/export';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900 text-left">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* ヘッダー */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-black flex items-center gap-4">
              <LayoutDashboard size={40} className="text-slate-900"/> 
              Store Manager
            </h1>
            <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest ml-14">
              ピーロート営業支援プラットフォーム
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={downloadMaster} className="bg-white border-2 border-slate-200 text-slate-600 px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
              <Download size={18} className="text-blue-500"/> マスターCSV
            </button>
            <button onClick={() => router.push('/admin/master')} className="bg-white border-2 border-slate-200 text-slate-600 px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
              <Database size={18} className="text-amber-500"/> 商品管理
            </button>
            <button onClick={() => router.push('/admin/settings')} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:shadow-xl transition-all">
              <Plus size={18}/> 店舗追加
            </button>
            <button onClick={handleLogout} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
              <LogOut size={24}/>
            </button>
          </div>
        </div>

        {/* 検索バー */}
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={24}/>
          <input 
            type="text" 
            placeholder="店舗名やURLで検索..." 
            className="w-full p-7 pl-16 bg-white rounded-[2.5rem] shadow-sm outline-none ring-amber-500 font-bold text-lg border-2 border-transparent focus:border-amber-500 transition-all" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
        </div>

        {/* 店舗リスト */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stores.filter(s => s.store_name.includes(searchQuery) || s.slug.includes(searchQuery)).map(store => (
            <div key={store.slug} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6 hover:shadow-2xl transition-all group relative overflow-hidden">
              {/* 背景の装飾 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[5rem] -mr-16 -mt-16 transition-all group-hover:bg-amber-50" />
              
              <div className="flex justify-between items-start relative z-10">
                <div className="p-5 bg-slate-900 text-white rounded-3xl shadow-lg shadow-slate-200">
                  <Store size={28}/>
                </div>
                <div className="flex gap-2">
                  {/* 公開メニューリンク */}
                  <a href={`/${store.slug}`} target="_blank" className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-white hover:text-amber-600 hover:shadow-md transition-all" title="メニューを表示">
                    <ExternalLink size={20}/>
                  </a>
                  {/* 在庫CSVダウンロード */}
                  <a href={`/api/store/export/${store.slug}`} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-white hover:text-emerald-600 hover:shadow-md transition-all" title="在庫CSVをDL">
                    <FileSpreadsheet size={20}/>
                  </a>
                  {/* 設定編集ボタン */}
                  <button onClick={() => router.push(`/admin/settings?edit=${store.slug}`)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-white hover:text-slate-900 hover:shadow-md transition-all" title="店舗設定を編集">
                    <Settings size={20}/>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black truncate">{store.store_name}</h3>
                <p className="text-slate-300 font-mono text-xs font-bold">SLUG: /{store.slug}</p>
              </div>

              {/* 在庫・価格編集画面へのメイン導線 */}
              <button 
                onClick={() => router.push(`/admin/inventory/${store.slug}`)} 
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-amber-500 hover:text-black transition-all shadow-lg"
              >
                在庫・価格を編集する
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
