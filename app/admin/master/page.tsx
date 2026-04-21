"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Database, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function MasterAdmin() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const router = useRouter();

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setStatus('idle');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/master/bulk', { method: 'POST', body: formData });
      if (res.ok) setStatus('success');
      else setStatus('error');
    } catch (e) {
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        <button onClick={() => router.push('/admin')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-600 transition-colors">
          <ArrowLeft size={20}/> Back to Menu
        </button>

        <div className="bg-white rounded-[3rem] p-12 shadow-xl border border-slate-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-amber-500 rounded-3xl text-white shadow-lg">
              <Database size={32}/>
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Master Data</h1>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">CSV Bulk Import</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-4 border-dashed border-slate-100 rounded-[2rem] p-12 text-center space-y-4 hover:border-amber-200 transition-colors bg-slate-50/50">
              <Upload className="mx-auto text-slate-300" size={48}/>
              <div className="space-y-1">
                <p className="text-lg font-bold text-slate-600">{file ? file.name : "ワインリストCSVを選択"}</p>
                <p className="text-xs text-slate-400">Gemini 3で生成したCSVファイルをアップロードしてください</p>
              </div>
              <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="csv-upload" />
              <label htmlFor="csv-upload" className="inline-block px-8 py-3 bg-white border-2 border-slate-200 rounded-full font-black text-xs cursor-pointer hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                ファイルを選択
              </label>
            </div>

            <button 
              onClick={handleUpload} disabled={!file || uploading}
              className="w-full py-6 bg-amber-500 text-black rounded-[1.5rem] font-black text-lg shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {uploading ? <Loader2 className="animate-spin" /> : "マスターデータを更新する"}
            </button>

            {status === 'success' && (
              <div className="p-6 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center gap-3 font-bold border border-emerald-100 animate-in fade-in slide-in-from-top-4">
                <CheckCircle2/> データの更新が完了しました！
              </div>
            )}
            {status === 'error' && (
              <div className="p-6 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3 font-bold border border-red-100">
                <AlertCircle/> 更新に失敗しました。CSVの形式を確認してください。
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ここでも runtime = 'edge' は削除しました。
