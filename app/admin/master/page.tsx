"use client";
export const runtime = 'edge';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Database, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Download, FileSpreadsheet } from 'lucide-react';

export default function MasterAdmin() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const router = useRouter();

  // マスター一括登録（アップロード）
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/master/bulk', { method: 'POST', body: formData });
    const result = await res.json();
    if (res.ok) {
      setStatus('success');
      setMsg(`${result.count}件のマスターデータを同期しました`);
      setFile(null);
    } else {
      setStatus('error');
      setMsg(result.error || 'アップロードに失敗しました');
    }
    setUploading(false);
  };

  // テンプレートダウンロード
  const handleDownloadTemplate = () => {
    window.open('/api/master/template', '_blank');
  };

  // 既存全データエクスポート
  const handleExportData = () => {
    window.open('/api/master/export', '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation */}
        <button 
          onClick={() => router.push('/admin')} 
          className="flex items-center gap-2 font-black text-slate-400 hover:text-slate-600 transition-colors uppercase text-sm tracking-widest"
        >
          <ArrowLeft size={20}/> Dashboard
        </button>

        <div className="bg-white rounded-[3.5rem] p-10 md:p-16 shadow-2xl border border-slate-100">
          <div className="flex items-center gap-6 mb-12">
            <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] text-amber-500 flex items-center justify-center shadow-xl rotate-3">
              <Database size={32}/>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Master Data</h1>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mt-1">全商品カタログ管理</p>
            </div>
          </div>

          {/* Download Tools Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <button 
              onClick={handleDownloadTemplate}
              className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border-2 border-transparent hover:border-amber-500/30 hover:bg-white transition-all group"
            >
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">新規登録用</p>
                <p className="font-black text-slate-700">CSVテンプレート</p>
              </div>
              <Download className="text-slate-300 group-hover:text-amber-500 transition-colors" size={24}/>
            </button>

            <button 
              onClick={handleExportData}
              className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border-2 border-transparent hover:border-amber-500/30 hover:bg-white transition-all group"
            >
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">バックアップ・編集用</p>
                <p className="font-black text-slate-700">全マスター出力</p>
              </div>
              <FileSpreadsheet className="text-slate-300 group-hover:text-amber-500 transition-colors" size={24}/>
            </button>
          </div>

          <div className="h-[1px] bg-slate-100 w-full mb-10" />

          {/* Upload Section */}
          <div className="space-y-6">
            <p className="text-[11px] font-black text-slate-400 ml-2 uppercase tracking-[0.2em]">一括同期（CSVアップロード）</p>
            
            <div className={`border-4 border-dashed rounded-[2.5rem] p-12 text-center transition-all ${file ? 'border-amber-500 bg-amber-50' : 'border-slate-50 bg-slate-50/50 hover:bg-slate-50'}`}>
              <Upload className={`mx-auto mb-4 ${file ? 'text-amber-500' : 'text-slate-200'}`} size={48}/>
              <p className="font-bold text-slate-600 mb-6">{file ? file.name : "Excelで編集したCSVファイルを選択"}</p>
              
              <input 
                type="file" 
                accept=".csv" 
                onChange={e => {
                  setFile(e.target.files?.[0] || null);
                  setStatus('idle');
                }} 
                className="hidden" 
                id="csv-master" 
              />
              <label 
                htmlFor="csv-master" 
                className="px-10 py-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-xs cursor-pointer shadow-sm hover:border-amber-500 transition-all uppercase tracking-widest"
              >
                ファイルを選択
              </label>
            </div>

            <button 
              onClick={handleUpload} 
              disabled={!file || uploading} 
              className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-lg shadow-xl disabled:opacity-20 hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center gap-4"
            >
              {uploading ? <Loader2 className="animate-spin" /> : <>マスターデータを更新する</>}
            </button>

            {status !== 'idle' && (
              <div className={`p-6 rounded-[2rem] font-bold flex items-center gap-4 border-2 animate-in fade-in slide-in-from-bottom-2 ${status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                {status === 'success' ? <CheckCircle2 size={24}/> : <AlertCircle size={24}/>}
                {msg}
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.3em]">
            Warning: IDが一致する既存データは上書きされます
          </p>
        </div>
      </div>
    </div>
  );
}
