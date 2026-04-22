"use client";
export const runtime = 'edge';
import { useState, useEffect, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, Loader2, Check, FileText, CheckCircle2 } from 'lucide-react';

export default function InventoryManager({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [file, setFile] = useState<File | null>(null);
  const [master, setMaster] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [inventory, setInventory] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch('/api/master/list').then(res => res.json()),
      fetch(`/api/wines?slug=${slug}`).then(res => res.json())
    ]).then(([mList, sList]) => {
      setMaster(Array.isArray(mList) ? mList : []);
      const invMap: any = {};
      (Array.isArray(sList) ? sList : []).forEach((w: any) => {
        invMap[w.id] = { active: true, price_bottle: w.price_bottle, price_glass: w.price_glass };
      });
      setInventory(invMap);
      setLoading(false);
    });
  }, [slug, status]);

  const filteredMaster = useMemo(() => 
    master.filter(w => 
      w.name_jp.includes(searchQuery) || w.id.includes(searchQuery) || w.country.includes(searchQuery)
    ).slice(0, 30),
    [master, searchQuery]
  );

  const handleCsvUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('slug', slug);
    try {
      const res = await fetch(`/api/wines/bulk`, { method: 'POST', body: formData });
      if (res.ok) { setStatus('success'); setFile(null); setTimeout(() => setStatus('idle'), 3000); }
      else setStatus('error');
    } catch { setStatus('error'); }
    finally { setUploading(false); }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-amber-500 font-black animate-pulse">LOADING INVENTORY...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="bg-white p-6 border-b sticky top-0 z-10 flex items-center gap-4">
        <button onClick={() => router.push('/admin')} className="p-2 bg-slate-100 rounded-full"><ArrowLeft size={20}/></button>
        <h1 className="text-xl font-black truncate">{slug} 在庫管理</h1>
      </header>

      <div className="p-4 space-y-6">
        {/* CSV Sync Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 font-black text-slate-900"><FileText className="text-amber-500" size={20}/> 店舗別CSV同期</div>
          <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${file ? 'border-amber-500 bg-amber-50' : 'border-slate-200'}`}>
            <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" id="csv-up" />
            <label htmlFor="csv-up" className="text-sm font-bold text-slate-500 cursor-pointer block">
              {file ? file.name : "タップしてCSVを選択"}
            </label>
          </div>
          <button 
            disabled={!file || uploading} onClick={handleCsvUpload}
            className="w-full h-[56px] bg-amber-500 text-black rounded-2xl font-black shadow-lg disabled:opacity-30"
          >
            {uploading ? <Loader2 className="animate-spin mx-auto"/> : "メニューを最新に更新"}
          </button>
          {status === 'success' && <div className="text-center text-emerald-600 font-black text-xs flex items-center justify-center gap-1"><CheckCircle2 size={14}/> 同期が完了しました</div>}
        </div>

        {/* Real-time Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
          <input 
            type="text" placeholder="商品名、国名、IDで検索..." 
            className="w-full h-[56px] pl-12 bg-white rounded-2xl shadow-sm outline-none border-2 border-transparent focus:border-amber-500 font-bold transition-all"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Master List */}
        <div className="grid gap-3">
          {filteredMaster.map(wine => (
            <div key={wine.id} className={`bg-white p-4 rounded-2xl flex items-center gap-4 border-2 transition-all ${inventory[wine.id]?.active ? 'border-amber-500 shadow-md' : 'border-transparent opacity-60'}`}>
              <img src={wine.image_url} className="w-12 h-16 object-cover rounded-lg bg-slate-100" />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">{wine.country}</p>
                <h3 className="font-bold text-slate-900 text-sm truncate">{wine.name_jp}</h3>
                <div className="flex gap-3 mt-1">
                  <span className="text-[10px] font-bold text-slate-400">ID: {wine.id}</span>
                  {inventory[wine.id]?.active && <span className="text-[10px] font-black text-slate-900">¥{Number(inventory[wine.id].price_bottle).toLocaleString()}</span>}
                </div>
              </div>
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${inventory[wine.id]?.active ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                <Check size={18} strokeWidth={4}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
