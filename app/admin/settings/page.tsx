"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Globe, Save, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function StoreSettings() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const router = useRouter();

  // 現在の設定を読み込む
  useEffect(() => {
    fetch('/api/store/config').then(res => res.json()).then(data => {
      setName(data.store_name || '');
      setSlug(data.slug || '');
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    try {
      const res = await fetch('/api/store/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_name: name, slug: slug.toLowerCase() }),
      });
      
      if (res.ok) setStatus('success');
      else {
        const err = await res.json();
        alert(err.error || '保存に失敗しました');
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-xl mx-auto space-y-8 text-left">
        <button onClick={() => router.push('/admin/master')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-600 transition-colors">
          <ArrowLeft size={20}/> マスター管理へ
        </button>

        <div className="bg-white rounded-[3rem] p-12 shadow-xl border border-slate-100">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-4 bg-slate-900 rounded-3xl text-white shadow-lg">
              <Store size={32}/>
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Store Setup</h1>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">店舗名とURLの設定</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Store Name（店舗名）</label>
              <input 
                type="text" required placeholder="例：Wine Bar Pieroth"
                className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-amber-500 focus:bg-white text-slate-900 font-bold outline-none transition-all"
                value={name} onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">URL Slug（URLの末尾）</label>
              <div className="relative">
                <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                <input 
                  type="text" required placeholder="例：pieroth-ginza"
                  className="w-full p-5 pl-14 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-amber-500 focus:bg-white text-slate-900 font-bold outline-none transition-all"
                  value={slug} onChange={(e) => setSlug(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-slate-400 ml-4">※英数字とハイフンのみ。例：`https://.../pieroth-ginza`</p>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full py-6 bg-slate-900 text-white rounded-[1.5rem] font-black text-lg shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Save size={20}/> 設定を保存する</>}
            </button>

            {status === 'success' && (
              <div className="p-6 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center gap-3 font-bold border border-emerald-100 animate-in fade-in slide-in-from-top-4">
                <CheckCircle2/> 保存完了！公開URL：`/{slug}`
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
