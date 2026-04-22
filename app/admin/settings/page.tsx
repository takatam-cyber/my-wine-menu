"use client";
export const runtime = 'edge';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Globe, Save, ArrowLeft, Palette, Loader2, CheckCircle2 } from 'lucide-react';

export default function StoreSettings() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [color, setColor] = useState('#b45309');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(false);
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/store/config', {
      method: 'POST',
      body: JSON.stringify({ store_name: name, slug: slug.toLowerCase().trim(), theme_color: color }),
    });
    if (res.ok) setStatus(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-left text-slate-900">
      <div className="max-w-xl mx-auto space-y-8">
        <button onClick={() => router.push('/admin')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-600">
          <ArrowLeft size={20}/> Dashboard
        </button>

        <div className="bg-white rounded-[3rem] p-12 shadow-xl border border-slate-100">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-4 bg-slate-900 rounded-3xl text-white"><Store size={32}/></div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Store Config</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">顧客店舗の設定</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Store Name</label>
              <input type="text" required placeholder="例：リストランテ・ピーロート" className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-amber-500 focus:bg-white font-bold outline-none shadow-sm" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">URL Slug</label>
              <div className="relative">
                <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                <input type="text" required placeholder="ristorante-pieroth" className="w-full p-5 pl-14 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-amber-500 focus:bg-white font-bold outline-none" value={slug} onChange={e => setSlug(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Theme Color</label>
              <div className="flex gap-4 items-center bg-slate-50 p-5 rounded-2xl">
                <Palette className="text-slate-300" size={24}/>
                <input type="color" className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-none" value={color} onChange={e => setColor(e.target.value)} />
                <span className="font-mono font-bold text-slate-400">{color.toUpperCase()}</span>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" /> : "設定を保存する"}
            </button>

            {status && (
              <div className="p-6 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center gap-3 font-bold border border-emerald-100">
                <CheckCircle2/> 保存しました
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
