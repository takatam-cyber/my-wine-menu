// app/admin/inventory/[slug]/page.tsx
"use client";
export const runtime = 'edge';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Loader2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

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
    const fetchWines = async () => {
      try {
        const res = await fetch(`/api/wines?slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentWines(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchWines();
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
        // 3秒後にステータスリセット
        setTimeout(() => setStatus('idle'), 3000);
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
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <button onClick={() => router.push('/admin')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-all">
          <ArrowLeft size={20} /> <span>Dashboard</span>
        </button>

        <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100">
          <div className="flex items-center gap-5 mb-10">
            <div className="p-5 bg-amber-500 rounded-[1.5rem] text-white shadow-xl shadow-amber-500/20">
              <FileText size={28}/>
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                {slug}<br/><span className="text-amber-500 text-lg tracking-normal">在庫アップロード</span>
              </h1>
            </div>
          </div>

          <div className="bg-slate-50 rounded-[2.5rem] p-10 border-4 border-dashed border-slate-200 space-y-6 text-center">
            <Upload className="mx-auto text-slate-300" size={48} />
            <div>
              <p className="text-lg font-black text-slate-700">{file ? file.name : "店舗用CSVを選択"}</p>
              <p className="text-xs text-slate-400 mt-1 uppercase font-bold">ID, ボトル価格, グラス価格, 在庫</p>
            </div>
            
            <div className="flex flex-col gap-4 max-w-sm mx-auto">
              <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="store-csv-upload" />
              <label htmlFor="store-csv-upload" className="inline-block px-10 py-4 bg-white border-2 border-slate-900 rounded-full font-black text-xs cursor-pointer hover:bg-slate-900 hover:text-white transition-all shadow-md">
                ファイルを選択
              </label>
              
              <button 
                onClick={handleCsvUpload} 
                disabled={!file || uploading} 
                className="w-full py-6 bg-amber-500 text-black rounded-[1.5rem] font-black text-xl shadow-2xl shadow-amber-500/30 hover:bg-amber-400 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {uploading ? <Loader2 className="animate-spin" /> : "メニューを更新する"}
              </button>
            </div>
          </div>

          {status === 'success' && (
            <div className="mt-8 p-6 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center gap-4 font-black border border-emerald-100 animate-in fade-in zoom-in">
              <CheckCircle2 size={24} /> <span>在庫データの更新に成功しました！</span>
            </div>
          )}
          {status === 'error' && (
            <div className="mt-8 p-6 bg-red-50 text-red-700 rounded-2xl flex items-center gap-4 font-black border border-red-100 animate-in fade-in zoom-in">
              <AlertCircle size={24} /> <span>更新に失敗しました。CSVを確認してください。</span>
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-4">現在のラインナップ ({currentWines.length})</h2>
          {currentWines.map((wine: any) => (
            <div key={wine.id} className="bg-white p-5 rounded-[2rem] flex items-center gap-6 shadow-sm border border-slate-50 group hover:shadow-xl transition-all">
              <div className="w-16 h-20 bg-slate-50 rounded-xl overflow-hidden shrink-0">
                <img src={wine.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-slate-900 text-lg truncate">{wine.name_jp}</h3>
                <div className="flex gap-4 mt-1 text-xs font-bold text-slate-400">
                  <span>ボトル: ¥{Number(wine.price_bottle).toLocaleString()}</span>
                  <span>グラス: ¥{Number(wine.price_glass).toLocaleString()}</span>
                  <span className={wine.stock > 0 ? "text-emerald-500" : "text-red-500"}>在庫: {wine.stock}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
