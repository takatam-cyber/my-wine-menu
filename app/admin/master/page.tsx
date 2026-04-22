"use client";
export const runtime = 'edge'; // Cloudflareにはこれが必須！

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Database, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Download } from 'lucide-react';

export default function MasterAdmin() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const router = useRouter();

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/master/bulk', { method: 'POST', body: formData });
    const result = await res.json();
    if (res.ok) {
      setStatus('success');
      setMsg(`${result.count}件同期完了`);
    } else {
      setStatus('error');
      setMsg(result.error);
    }
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6 text-left">
        <button onClick={() => router.push('/admin')} className="flex items-center gap-2 font-bold text-slate-400">
          <ArrowLeft size={20}/> Back
        </button>
        <div className="bg-white rounded-[3rem] p-12 shadow-xl border border-slate-100">
          <h1 className="text-3xl font-black mb-8 flex items-center gap-4 text-slate-900"><Database className="text-amber-500" size={32}/> Master Data</h1>
          <div className="border-4 border-dashed rounded-[2.5rem] p-12 text-center bg-slate-50">
            <Upload className="mx-auto text-slate-300 mb-4" size={48}/>
            <p className="font-bold text-slate-600 mb-4">{file ? file.name : "CSVを選択（Excel保存OK）"}</p>
            <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" id="csv" />
            <label htmlFor="csv" className="px-8 py-3 bg-white border-2 rounded-full font-black text-xs cursor-pointer shadow-sm">ファイル選択</label>
          </div>
          <button onClick={handleUpload} disabled={!file || uploading} className="w-full mt-6 py-6 bg-amber-500 text-black rounded-2xl font-black text-lg shadow-lg">
            {uploading ? <Loader2 className="animate-spin mx-auto" /> : "マスターを更新する"}
          </button>
          {status !== 'idle' && (
             <div className={`mt-6 p-4 rounded-xl font-bold flex items-center gap-2 ${status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
               {status === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>} {msg}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
