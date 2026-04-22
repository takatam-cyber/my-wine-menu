// app/admin/inventory/[slug]/page.tsx
"use client";
export const runtime = 'edge';
import { useState, useEffect, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, Loader2, Check, FileText, CheckCircle2, Download, Upload, AlertCircle } from 'lucide-react';

export default function InventoryManager({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [file, setFile] = useState<File | null>(null);
  const [master, setMaster] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [inventory, setInventory] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, sRes] = await Promise.all([
        fetch('/api/master/list'),
        fetch(`/api/wines?slug=${slug}`)
      ]);
      const mList = await mRes.json();
      const sList = await sRes.json();

      setMaster(Array.isArray(mList) ? mList : []);
      const invMap: any = {};
      (Array.isArray(sList) ? sList : []).forEach((w: any) => {
        invMap[w.id] = { active: true, price_bottle: w.price_bottle, price_glass: w.price_glass, stock: w.stock };
      });
      setInventory(invMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [slug]);

  const filteredMaster = useMemo(() => 
    master.filter(w => 
      w.name_jp?.includes(searchQuery) || 
      w.id?.includes(searchQuery) || 
      w.country?.includes(searchQuery)
    ).slice(0, 50),
    [master, searchQuery]
  );

  const handleCsvUpload = async () => {
    if (!file) return;
    setUploading(true);
    setStatus(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('slug', slug);
    
    try {
      const res = await fetch(`/api/wines/bulk`, { method: 'POST', body: formData });
      const result = await res.json();
      if (res.ok) { 
        setStatus({ type: 'success', msg: `${result.count}件の在庫を同期しました` });
        setFile(null);
        fetchData(); // リロード
      } else {
        setStatus({ type: 'error', msg: result.error });
      }
    } catch { 
      setStatus({ type: 'error', msg: "通信エラーが発生しました" });
    } finally { 
      setUploading(false); 
    }
  };

  const handleDownload = () => {
    window.open(`/api/store/export/${slug}`, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-amber-500 mb-4" size={48} />
      <p className="font-black text-slate-400 animate-pulse">CONNECTING TO D1...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <header className="bg-white p-6 border-b sticky top-0 z-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin')} className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors">
            <ArrowLeft size={20}/>
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-none">{slug}</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Inventory Management</p>
          </div>
        </div>
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-amber-500 hover:text-black transition-all shadow-md"
        >
          <Download size={16}/> CSV出力
        </button>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* CSV Sync Section */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center gap-3 font-black text-slate-900 text-lg">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><FileText size={20}/></div>
            一括更新（CSV）
          </div>
          
          <div className={`relative group border-4 border-dashed rounded-[2rem] p-10 text-center transition-all ${file ? 'border-amber-500 bg-amber-50' : 'border-slate-100 hover:border-slate-200'}`}>
            <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" id="csv-up" />
            <label htmlFor="csv-up" className="cursor-pointer block">
              <Upload className={`mx-auto mb-4 ${file ? 'text-amber-500' : 'text-slate-300'}`} size={40} />
              <p className="font-black text-slate-600">{file ? file.name : "Excelで編集したCSVを選択"}</p>
              <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">Shift-JIS / UTF-8 両対応</p>
            </label>
          </div>

          <button 
            disabled={!file || uploading} 
            onClick={handleCsvUpload}
            className="w-full h-[72px] bg-slate-900 text-white rounded-[1.5rem] font-black text-lg shadow-xl disabled:opacity-20 hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center gap-3"
          >
            {uploading ? <Loader2 className="animate-spin" /> : "メニュー内容を同期する"}
          </button>

          {status && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {status.type === 'success' ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}
              {status.msg}
            </div>
          )}
        </div>

        {/* Real-time Search */}
        <div className="relative sticky top-[100px] z-10">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
          <input 
            type="text" placeholder="商品名、生産国、銘柄IDで検索..." 
            className="w-full h-[64px] pl-14 pr-6 bg-white rounded-2xl shadow-md outline-none border-2 border-transparent focus:border-amber-500 font-bold transition-all text-sm"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Master List Display */}
        <div className="grid gap-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">現在のラインナップ（上位50件表示）</p>
          {filteredMaster.map(wine => {
            const inv = inventory[wine.id];
            return (
              <div key={wine.id} className={`bg-white p-5 rounded-[1.8rem] flex items-center gap-5 border-2 transition-all shadow-sm ${inv?.active ? 'border-amber-500/50' : 'border-transparent opacity-60'}`}>
                <div className="relative shrink-0">
                  <img src={wine.image_url} className="w-14 h-20 object-cover rounded-xl bg-slate-50 shadow-inner" alt="" />
                  {inv?.active && <div className="absolute -top-2 -left-2 bg-amber-500 text-white p-1 rounded-full shadow-lg"><Check size={12} strokeWidth={4}/></div>}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-tighter">{wine.country}</span>
                    <span className="text-[9px] font-black text-slate-300">ID: {wine.id}</span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base truncate leading-tight">{wine.name_jp}</h3>
                  <div className="flex gap-4 pt-1">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase">Bottle</span>
                      <span className="font-mono font-bold text-sm text-slate-700">¥{Number(inv?.price_bottle || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase">Stock</span>
                      <span className={`font-mono font-bold text-sm ${Number(inv?.stock) < 5 ? 'text-red-500' : 'text-slate-700'}`}>{inv?.stock || 0}</span>
                    </div>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${inv?.active ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                  <Check size={24} strokeWidth={4}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
