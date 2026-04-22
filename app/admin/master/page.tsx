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
      // マスターデータの一括登録APIを叩く
      const res = await fetch('/api/master/bulk', { method: 'POST', body: formData });
      const result = await res.json();
      
      if (res.ok) {
        setStatus('success');
        setMsg(`${result.count}件のワインデータを正常に同期しました！`);
      } else {
        setStatus('error');
        // サーバー側で詳細なエラーメッセージ（認識中のヘッダーなど）を返している場合はそれを表示
        setMsg(result.error || "データの取り込みに失敗しました。");
      }
    } catch (e: any) {
      setStatus('error');
      setMsg("通信エラー: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6 text-left">
        {/* ヘッダーエリア */}
        <div className="flex justify-between items-center">
          <button 
            onClick={() => router.push('/admin')} 
            className="flex items-center gap-2 font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft size={20}/> Back to Menu
          </button>
          
          {/* 【新機能】テンプレートダウンロードボタン */}
          <a 
            href="/api/master/template" 
            className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full text-xs font-black border-2 border-slate-200 hover:bg-slate-50 transition-all shadow-sm text-slate-600"
          >
            <Download size={14}/> テンプレートをDL
          </a>
        </div>

        {/* メインカード */}
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

          {/* 手順ガイド */}
          <div className="bg-amber-50 border-2 border-amber-100 rounded-[2rem] p-8 mb-10 text-sm text-amber-900">
            <p className="font-black mb-3 text-base flex items-center gap-2">
              <CheckCircle2 size={18} className="text-amber-600"/> 確実なアップロードの手順
            </p>
            <ol className="space-y-2 font-bold opacity-80 list-decimal ml-5">
              <li>右上の「テンプレートをDL」からCSVを取得</li>
              <li>スプレッドシート等で開き、2行目以降にデータを貼り付け</li>
              <li>CSV形式（カンマ区切り）で保存してアップロード</li>
            </ol>
          </div>

          <div className="space-y-6">
            {/* アップロードエリア */}
            <div className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-12 text-center space-y-4 hover:border-amber-200 transition-colors bg-slate-50/50 group">
              <Upload className="mx-auto text-slate-300 group-hover:text-amber-400 transition-colors" size={56}/>
              <div className="space-y-1">
                <p className="text-lg font-black text-slate-600">
                  {file ? file.name : "ワインリストを選択"}
                </p>
                <p className="text-xs text-slate-400 font-bold">
                  Geminiで作成したデータをテンプレートに貼ってアップしてください
                </p>
              </div>
              <input 
                type="file" 
                accept=".csv" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                className="hidden" 
                id="csv-upload" 
              />
              <label 
                htmlFor="csv-upload" 
                className="inline-block px-10 py-3 bg-white border-2 border-slate-200 rounded-full font-black text-xs cursor-pointer hover:bg-slate-900 hover:text-white transition-all shadow-sm"
              >
                ファイルを選択
              </label>
            </div>

            {/* 実行ボタン */}
            <button 
              onClick={handleUpload} 
              disabled={!file || uploading}
              className="w-full py-7 bg-amber-500 text-black rounded-[1.5rem] font-black text-xl shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {uploading ? <Loader2 className="animate-spin" /> : "マスターデータを一括更新"}
            </button>

            {/* ステータス表示 */}
            {status === 'success' && (
              <div className="p-6 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center gap-3 font-black border border-emerald-100 animate-in fade-in slide-in-from-top-4">
                <CheckCircle2/> {msg}
              </div>
            )}
            
            {status === 'error' && (
              <div className="p-6 bg-red-50 text-red-700 rounded-2xl flex flex-col gap-1 font-black border border-red-100 animate-in shake-2">
                <div className="flex items-center gap-3">
                  <AlertCircle/> 更新に失敗しました
                </div>
                <p className="text-xs font-bold opacity-80 ml-8 whitespace-pre-wrap">{msg}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
