"use client";
export const runtime = 'edge';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Store, Globe, Save, ArrowLeft, Palette, Loader2, CheckCircle2 } from 'lucide-react';

function SettingsForm() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [color, setColor] = useState('#b45309');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSlug = searchParams.get('edit');

  useEffect(() => {
    if (editSlug) {
      setLoading(true);
      fetch(`/api/store/config/public?slug=${editSlug}`).then(res => res.json()).then(data => {
        setName(data.store_name || '');
        setSlug(data.slug || editSlug);
        setColor(data.theme_color || '#b45309');
        setLoading(false);
      });
    }
  }, [editSlug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/store/config', {
      method: 'POST',
      body: JSON.stringify({ store_name: name, slug: slug.toLowerCase().trim(), theme_color: color }),
    });
    if (res.ok) {
      setStatus(true);
      setTimeout(() => setStatus(false), 3000);
      if (!editSlug) router.push('/admin');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-left text-slate-900">
      <div className="max-w-xl mx-auto space-y-8">
        <button onClick={() => router.push('/admin')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-600">
          <ArrowLeft size={20}/> Dashboardへ戻る
        </button>

        <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl border border-slate-100">
          <div className="flex items-center gap-5 mb-12">
            <div className="p-5 bg-slate-900 rounded-3xl text-white shadow-xl"><Store size={36}/></div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">{editSlug ? 'Edit Store' : 'Add Store'}</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">顧客店舗の設定</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-10">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 ml-5 uppercase tracking-widest">店舗名</label>
              <input type="text" required placeholder="例：リストランテ・ピーロート" className="w-full p-6 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-amber-500 focus:bg-white font-bold outline-none shadow-inner transition-all" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 ml-5 uppercase tracking-widest">URLスラグ（半角英数字）</label>
              <div className="relative group">
                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500" size={20}/>
                <input type="text" required disabled={!!editSlug} placeholder="ristorante-pieroth" className={`w-full p-6 pl-16 rounded-2xl border-2 border-transparent outline-none font-bold shadow-inner ${editSlug ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 focus:border-amber-500 focus:bg-white'}`} value={slug} onChange={e => setSlug(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 ml-5 uppercase tracking-widest">テーマカラー</label>
              <div className="flex gap-5 items-center bg-slate-50 p-6 rounded-2xl">
                <Palette className="text-slate-300" size={28}/>
                <input type="color" className="w-14 h-14 rounded-xl cursor-pointer bg-transparent border-none" value={color} onChange={e => setColor(e.target.value)} />
                <span className="font-mono font-black text-lg text-slate-700">{color.toUpperCase()}</span>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-2xl hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center gap-4">
              {loading ? <Loader2 className="animate-spin" /> : <><Save size={24}/> {editSlug ? '設定を更新する' : '店舗を新規登録する'}</>}
            </button>

            {status && <div className="p-6 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center gap-4 font-bold border-2 border-emerald-100 animate-bounce"><CheckCircle2 size={24}/> 保存完了</div>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default function StoreSettings() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-400" size={48}/></div>}>
      <SettingsForm />
    </Suspense>
  );
}
