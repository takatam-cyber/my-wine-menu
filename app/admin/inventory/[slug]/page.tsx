"use client";
export const runtime = 'edge';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Save, ArrowLeft, Loader2, Check, FileText, Upload, CheckCircle2 } from 'lucide-react';

export default function InventoryManager({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [file, setFile] = useState<File | null>(null);
  const [master, setMaster] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [inventory, setInventory] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const router = useRouter();

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      fetch('/api/master/list').then(res => res.json()),
      fetch(`/api/wines?slug=${slug}`).then(res => res.json())
    ]).then(([mList, sList]) => {
      setMaster(Array.isArray(mList) ? mList : []);
      const invMap: any = {};
      sList.forEach((w: any) => {
        invMap[w.id] = { active: true, price_bottle: w.price_bottle, price_glass: w.price_glass };
      });
      setInventory(invMap);
      setLoading(false);
    });
  }, [slug, status]);

  const handleCsvUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('slug', slug);
    try {
      const res = await fetch(`/api/wines/bulk`, { method: 'POST', body: formData });
      if (res.ok) { setStatus('success'); setFile(null); }
      else setStatus('error');
    } catch { setStatus('error'); }
    finally { setUploading(false); }
  };

  const filteredMaster = master.filter(w => 
    w.name_jp.includes(searchQuery) || w.id.includes(searchQuery)
  ).slice(0, 50);

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-black tracking-widest">ANALYZING MASTER...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 text-left font-sans">
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
          <button onClick={() => router.push('/admin')} className="p-4 hover:bg-slate-50 rounded-full transition-all group">
            <ArrowLeft size={24} className="text-slate-400 group-hover:text-slate-900 group-hover:-translate-x-1 transition-all"/>
          </button>
          <div className="text-right">
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{slug}</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Inventory Control</p>
          </div>
        </header>

        {/* CSVアップロードエリア */}
        <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-amber-500 rounded-2xl text-white shadow-lg"><FileText size={24}/></div>
            <h2 className="text-xl font-black text-slate-900">店舗別CSVで一括更新</h2>
          </div>
          <div className="bg-slate-50 rounded-[2rem] p-8 border-4 border-dashed border-slate-100 text-center space-y-4">
            <p className="font-bold text-slate-500">{file ? file.name : "CSVファイルを選択"}</p>
            <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="store-csv" />
            <label htmlFor="store-csv" className="inline-block px-8 py-3 bg-white border-2 border-slate-900 rounded-full font-black text-xs cursor-pointer hover:bg-slate-900 hover:text-white transition-all">ファイルを選択</label>
            <button onClick={handleCsvUpload} disabled={!file || uploading} className="w-full mt-4 py-5 bg-amber-500 text-black rounded-2xl font-black text-lg shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-3">
              {uploading ? <Loader2 className="animate-spin" /> : "メニューを同期する"}
            </button>
          </div>
          {status === 'success' && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl font-bold flex items-center gap-2"><CheckCircle2 size={20}/> 同期完了</div>}
        </div>

        {/* 検索・閲覧エリア */}
        <div className="space-y-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={24}/>
            <input 
              type="text" placeholder="マスター1,000銘柄から検索..." 
              className="w-full p-8 pl-16 bg-white rounded-[2.5rem] border-2 border-transparent focus:border-amber-500 outline-none shadow-sm font-bold text-lg transition-all"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="grid gap-4">
            {filteredMaster.map(wine => (
              <div key={wine.id} className={`bg-white p-6 rounded-[2rem] flex items-center gap-6 border-2 transition-all ${inventory[wine.id]?.active ? 'border-amber-500' : 'border-transparent opacity-60'}`}>
                <img src={wine.image_url} className="w-16 h-20 object-cover rounded-xl shadow-md" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{wine.country}</p>
                  <h3 className="font-black text-slate-900 text-lg truncate">{wine.name_jp}</h3>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">ID: {wine.id}</span>
                    {inventory[wine.id]?.active && <span className="text-xs font-bold text-amber-600 uppercase">¥{Number(inventory[wine.id].price_bottle).toLocaleString()}</span>}
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${inventory[wine.id]?.active ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                  <Check size={20} strokeWidth={4}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
