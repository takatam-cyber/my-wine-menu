// app/admin/settings/page.tsx
"use client";
export const runtime = 'edge';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Store, Globe, Save, ArrowLeft, Palette, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

function SettingsForm() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [color, setColor] = useState('#b45309');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSlug = searchParams.get('edit');

  useEffect(() => {
    if (editSlug) {
      setLoading(true);
      fetch(`/api/store/config/public?slug=${editSlug}`)
        .then(res => res.json())
        .then(data => {
          setName(data.store_name || '');
          setSlug(editSlug);
          setColor(data.theme_color || '#b45309');
        })
        .finally(() => setLoading(false));
    }
  }, [editSlug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const res = await fetch('/api/store/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        store_name: name, 
        slug: slug.toLowerCase().trim(), 
        theme_color: color,
        is_edit: !!editSlug
      }),
    });

    const result = await res.json();
    if (res.ok) {
      setStatus({ type: 'success', msg: '設定を保存しました。' });
      setTimeout(() => { if (!editSlug) router.push('/admin'); }, 2000);
    } else {
      setStatus({ type: 'error', msg: result.error || '保存に失敗しました。' });
    }
    setLoading(false);
  };

  if (loading && editSlug) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black animate-pulse">LOADING CONFIG...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.push('/admin')} className="flex items-center gap-2 text-slate-400 font-black hover:text-slate-600 mb-8">
          <ArrowLeft size={20}/> DASHBOARD
        </button>

        <div className="bg-white rounded-[3.5rem] p-10 md:p-16 shadow-2xl border border-slate-100">
          <div className="flex items-center gap-6 mb-12">
            <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] text-white flex items-center justify-center shadow-xl rotate-3">
              <Store size={32}/>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">{editSlug ? 'Edit Store' : 'New Registration'}</h1>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mt-1">店舗プロファイル設定</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-10">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 ml-6 uppercase tracking-widest">店舗名称</label>
              <input 
                type="text" required placeholder="例：ピーロート日比谷店" 
                className="w-full h-[72px] px-8 bg-slate-50 rounded-[2rem] border-2 border-transparent focus:border-amber-500 font-bold outline-none shadow-inner transition-all text-lg" 
                value={name} onChange={e => setName(e.target.value)} 
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 ml-6 uppercase tracking-widest">URLスラグ（英数字のみ）</label>
              <div className="relative group">
                <Globe className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300" size={24}/>
                <input 
                  type="text" required disabled={!!editSlug} 
                  placeholder="hibiya-pieroth" 
                  className={`w-full h-[72px] pl-20 pr-8 rounded-[2rem] border-2 border-transparent font-bold shadow-inner transition-all text-lg ${editSlug ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 focus:border-amber-500'}`} 
                  value={slug} onChange={e => setSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))} 
                />
              </div>
              {!editSlug && <p className="text-[10px] text-slate-400 ml-6 font-bold uppercase italic">※一度登録すると変更できません</p>}
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 ml-6 uppercase tracking-widest">メニューテーマカラー</label>
              <div className="flex gap-6 items-center bg-slate-50 p-6 rounded-[2rem] shadow-inner">
                <div className="relative">
                  <input 
                    type="color" 
                    className="w-16 h-16 rounded-2xl cursor-pointer bg-transparent border-none outline-none" 
                    value={color} onChange={e => setColor(e.target.value)} 
                  />
                  <Palette className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none drop-shadow-md" size={24}/>
                </div>
                <span className="font-mono font-black text-xl text-slate-700 tracking-wider uppercase">{color}</span>
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit" disabled={loading} 
                className="w-full h-[80px] bg-slate-900 text-white rounded-[2.5rem] font-black text-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center gap-4"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Save size={24}/> {editSlug ? '更新内容を保存' : '店舗を新規開設'}</>}
              </button>
            </div>

            {status && (
              <div className={`p-6 rounded-[2rem] flex items-center gap-4 font-black border-2 animate-in fade-in slide-in-from-bottom-2 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                {status.type === 'success' ? <CheckCircle2 size={24}/> : <AlertCircle size={24}/>}
                {status.msg}
              </div>
            )}
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
