// app/admin/settings/page.tsx
"use client";
export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Globe, Save, ArrowLeft, CheckCircle2, Loader2, Lock, Palette } from 'lucide-react';

export default function StoreSettings() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [password, setPassword] = useState('');
  const [color, setColor] = useState('#b45309');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/store/config').then(res => res.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        const d = data[0]; // 最初の店舗を表示
        setName(d.store_name || '');
        setSlug(d.slug || '');
        setColor(d.theme_color || '#b45309');
        setPassword(d.access_password || '');
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/store/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        store_name: name, 
        slug: slug.toLowerCase().trim(),
        theme_color: color,
        access_password: password
      }),
    });
    if (res.ok) {
      setStatus(true);
      setTimeout(() => setStatus(false), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-left">
      <div className="max-w-xl mx-auto space-y-8">
        <button onClick={() => router.push('/admin')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-600 transition-all">
          <ArrowLeft size={20}/> Dashboard
        </button>

        <div className="bg-white rounded-[3rem] p-12 shadow-xl border border-slate-100">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-4 bg-amber-500 rounded-3xl text-white shadow-lg"><Store size={32}/></div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Store Setup</h1>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">店舗情報を編集</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Store Name</label>
              <input type="text" required placeholder="例：ピーロート日比谷店" className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-amber-500 focus:bg-white text-slate-900 font-bold outline-none shadow-sm transition-all" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">URL Slug</label>
              <div className="relative">
                <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                <input type="text" required placeholder="例：pieroth-hibiya" className="w-full p-5 pl-14 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-amber-500 focus:bg-white text-slate-900 font-bold outline-none shadow-sm transition-all" value={slug} onChange={e => setSlug(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest flex items-center gap-1"><Lock size={10}/> Password</label>
                <input type="password" placeholder="任意" className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-amber-500 focus:bg-white text-slate-900 font-bold outline-none shadow-sm transition-all" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest flex items-center gap-1"><Palette size={10}/> Theme Color</label>
                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl">
                  <input type="color" className="w-12 h-12 bg-transparent border-none cursor-pointer" value={color} onChange={e => setColor(e.target.value)} />
                  <span className="font-mono text-xs font-bold text-slate-400 uppercase">{color}</span>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-[1.5rem] font-black text-lg shadow-xl hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-3 mt-4">
              {loading ? <Loader2 className="animate-spin" /> : "この内容で登録・保存する"}
            </button>

            {status && (
              <div className="p-6 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center gap-3 font-bold border border-emerald-100 animate-in fade-in zoom-in">
                <CheckCircle2/> 設定を保存しました
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
