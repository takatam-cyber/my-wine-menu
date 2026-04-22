"use client";
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
    setStatus('idle');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/master/bulk', { method: 'POST', body: formData });
      const result = await res.json();
      if (res.ok) {
        setStatus('success');
        setMsg(`${result.count}件のワインデータを同期しました！`);
      } else {
        setStatus('error');
        setMsg(result.error || "失敗しました");
      }
    } catch (e: any) {
      setStatus('error');
      setMsg(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <button onClick={() => router.push('/admin')} className="flex items-center gap-2 font-bold text-slate-400"><ArrowLeft size={20}/> Back</button>
          {/* ここにダウンロードボタンが追加されます */}
          <a href="/api/master/template" className="flex items-center gap-2 bg-white px-4 py-2 rounded-full text-xs font-black border-2 border-slate-200 hover:bg-slate-50 transition-all text-slate-600">
            <Download size={14}/> テンプレートをDL
          </a>
        </div>
        <div className="bg-white rounded-[3rem] p-12 shadow-xl border border-slate-100">
          <h1 className="text-3xl font-black mb-8 flex items-center gap-4"><Database className="text-amber-500" size={32}/> Master Data</h1>
          <div className="bg-amber-50 border-2 border-amber-100 rounded-[2rem] p-8 mb-10 text-sm text-amber-900">
            <p className="font-black mb-2 text-base text-left">💡 確実なアップロード手順</p>
            <ol className="list-decimal ml-5 space-y-1 font-bold opacity-80 text-left">
              <li>右上のボタンからテンプレートをDL</li>
              <li>スプレッドシート等で開き、2行目以降にデータを貼り付け</li>
              <li>CSV形式で保存して、下のボタンからアップロード</li>
            </ol>
          </div>
          <div className="border-4 border-dashed rounded-[2.5rem] p-12 text-center bg-slate-50/50 hover:border-amber-200 transition-colors">
            <Upload className="mx-auto text-slate-300 mb-4" size={48}/>
            <p className="font-bold text-slate-600">{file ? file.name : "CSVを選択"}</p>
            <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="csv" />
            <label htmlFor="csv" className="mt-4 inline-block px-8 py-3 bg-white border-2 rounded-full font-black text-xs cursor-pointer hover:bg-black hover:text-white transition-all shadow-sm">ファイル選択</label>
          </div>
          <button onClick={handleUpload} disabled={!file || uploading} className="w-full mt-6 py-6 bg-amber-500 text-black rounded-[1.5rem] font-black text-lg disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg hover:bg-amber-400 transition-all">
            {uploading ? <Loader2 className="animate-spin" /> : "データを一括更新"}
          </button>
          {status !== 'idle' && (
            <div className={`mt-6 p-6 rounded-2xl font-bold flex items-center gap-3 ${status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {status === 'success' ? <CheckCircle2/> : <AlertCircle/>} {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
