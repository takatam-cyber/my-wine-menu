"use client";
export const runtime = 'edge';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Save, Loader2, FileText, CheckCircle2 } from 'lucide-react';

export default function InventoryManager({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [currentWines, setCurrentWines] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/wines?slug=${slug}`).then(res => res.json()).then(setCurrentWines).catch(() => {});
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
      if (res.ok) setStatus('success');
      else setStatus('error');
    } catch (e) {
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-left font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <button onClick={() => router.push('/admin')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-600 transition-colors">
          <ArrowLeft size={20}/> Dashboard
        </button>

        <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-amber-500 rounded-2xl text-white shadow-lg"><FileText size={24}/></div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{slug} : Menu Upload</h1>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">店舗別CSV一括登録</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-3xl p-8 border-2 border-dashed border-slate-200 space-y-4 text-center">
            <p className="text-sm font-bold text-slate-600">
              {file ? `選択中: ${file.name}` : "店舗用CSVファイルを選択してください"}
            </p>
            <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="store-csv" />
            <label htmlFor="store-csv" className="inline-block px-8 py-3 bg-white border-2 border-slate-900 rounded-full font-black text-xs cursor-pointer hover:bg-slate-900 hover:text-white transition-all shadow-sm">
              ファイルを選択
            </label>
            
            <button 
              onClick={handleCsvUpload} disabled={!file || uploading}
              className="w-full mt-4 py-5 bg-amber-500 text-black rounded-2xl font-black text-lg shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {uploading ? <Loader2 className="animate-spin" /> : <><Upload size={20}/> 店舗メニューを更新する</>}
            </button>
          </div>

          {status === 'success' && (
            <div className="mt-6 p-4 bg-emerald-50 text-emerald-700 rounded-xl flex items-center gap-2 font-bold border border-emerald-100 animate-bounce">
              <CheckCircle2 size={20}/> メニューの更新に成功しました！
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Current Lineup（現在のリスト）</h2>
          <div className="grid gap-3">
            {currentWines.map((wine: any) => (
              <div key={wine.id} className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-slate-100">
                <img src={wine.image_url} className="w-10 h-14 object-cover rounded shadow-sm" />
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-sm">{wine.name_jp}</h3>
                  <p className="text-xs text-slate-400 font-bold">ボトル: ¥{Number(wine.price_bottle).toLocaleString()} / グラス: ¥{Number(wine.price_glass).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
