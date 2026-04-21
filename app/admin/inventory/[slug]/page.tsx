"use client";
export const runtime = 'edge';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Save, Loader2, FileText, CheckCircle2 } from 'lucide-react';

export default function InventoryManager({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [currentWines, setCurrentWines] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/wines?slug=${slug}`)
      .then(res => res.json())
      .then(data => setCurrentWines(Array.isArray(data) ? data : []))
      .catch(() => setCurrentWines([]));
  }, [slug, status]);

  const handleCsvUpload = async () => {
    if (!file) return;
    setUploading(true);
    setStatus('idle');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('slug', slug);

    try {
      const res = await fetch(`/api/wines/bulk`, { method: 'POST', body: formData });
      if (res.ok) {
        setStatus('success');
        setFile(null);
      } else {
        setStatus('error');
      }
    } catch (e) {
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-left font-sans selection:bg-amber-500">
      <div className="max-w-3xl mx-auto space-y-8">
        <button 
          onClick={() => router.push('/admin')} 
          className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-all group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
          <span>Dashboard</span>
        </button>

        <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16" />
          <div className="flex items-center gap-5 mb-10">
            <div className="p-5 bg-amber-500 rounded-[1.5rem] text-white shadow-xl shadow-amber-500/20">
              <FileText size={28}/>
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                {slug}<br/><span className="text-amber-500 text-lg">Menu Upload</span>
              </h1>
            </div>
          </div>

          <div className="bg-slate-50 rounded-[2.5rem] p-10 border-4 border-dashed border-slate-200 space-y-6 text-center transition-colors hover:border-amber-200 group">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
              <Upload className="text-slate-300 group-hover:text-amber-500 transition-colors" size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-black text-slate-700">{file ? file.name : "店舗用CSVを選択"}</p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">ID, ボトル価格, グラス価格, 在庫</p>
            </div>
            <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="store-csv-upload" />
            <label htmlFor="store-csv-upload" className="inline-block px-10 py-4 bg-white border-2 border-slate-900 rounded-full font-black text-xs cursor-pointer hover:bg-slate-900 hover:text-white transition-all shadow-md active:scale-95">ファイルを選択</label>
            <button onClick={handleCsvUpload} disabled={!file || uploading} className="w-full mt-6 py-6 bg-amber-500 text-black rounded-[1.5rem] font-black text-xl shadow-2xl shadow-amber-500/30 hover:bg-amber-400 hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
              {uploading ? <Loader2 className="animate-spin" /> : "メニューを更新する"}
            </button>
          </div>

          {status === 'success' && (
            <div className="mt-8 p-6 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center gap-4 font-black border border-emerald-100">
              <CheckCircle2 size={24} className="animate-bounce" /> <span>更新に成功しました！</span>
            </div>
          )}
        </div>

        <div className="grid gap-4">
          {currentWines.map((wine: any) => (
            <div key={wine.id} className="bg-white p-5 rounded-[2rem] flex items-center gap-6 shadow-sm border border-slate-50 hover:shadow-xl transition-all group">
              <div className="w-16 h-20 bg-slate-50 rounded-xl overflow-hidden shrink-0">
                <img src={wine.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">{wine.country}</p>
                <h3 className="font-black text-slate-900 text-lg truncate">{wine.name_jp}</h3>
                <div className="flex gap-4 mt-2">
                  <div className="flex flex-col text-sm"><span className="text-[9px] font-black text-slate-300 uppercase">Bottle</span><span className="font-bold">¥{Number(wine.price_bottle).toLocaleString()}</span></div>
                  <div className="flex flex-col text-sm"><span className="text-[9px] font-black text-slate-300 uppercase">Glass</span><span className="font-bold">¥{Number(wine.price_glass).toLocaleString()}</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
