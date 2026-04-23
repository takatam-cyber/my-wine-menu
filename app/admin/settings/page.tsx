// app/admin/settings/page.tsx
"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { Store, Globe, Save, ArrowLeft, Palette, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * 開発環境（プレビュー）での `next/navigation` の解決エラーを回避するため、
 * ブラウザ標準の API を使用したカスタムフックを定義します。
 * window.location.href への代入時に発生する URL 解決エラー（SyntaxError）を防ぐため
 * パスを絶対 URL に変換して処理します。
 */
const useMockRouter = () => {
  return {
    push: (path: string) => {
      if (!path) return;
      try {
        // プレビュー環境（blob URLなど）での相対パス解決を確実にするため
        // origin を取得し、URL オブジェクトを使用して絶対パスを生成します。
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        
        // origin が取得できない、または 'null' の場合のフォールバック
        if (!origin || origin === 'null') {
          window.location.href = path;
        } else {
          const absoluteUrl = new URL(path, origin).href;
          window.location.href = absoluteUrl;
        }
      } catch (e) {
        console.error("Navigation error:", e);
        // 最終的なフォールバックとしてそのまま代入
        window.location.href = path;
      }
    }
  };
};

const useMockSearchParams = () => {
  return {
    get: (key: string) => {
      if (typeof window === 'undefined') return null;
      const params = new URLSearchParams(window.location.search);
      return params.get(key);
    }
  };
};

function SettingsForm() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [color, setColor] = useState('#b45309');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  
  const router = useMockRouter();
  const searchParams = useMockSearchParams();
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
        .catch(err => {
          console.error("Failed to fetch store config:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [editSlug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim()) return;

    setLoading(true);
    setStatus(null);

    try {
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
        setTimeout(() => router.push('/admin'), 1500);
      } else {
        setStatus({ type: 'error', msg: result.error || '保存に失敗しました。' });
      }
    } catch (error) {
      setStatus({ type: 'error', msg: '通信エラーが発生しました。' });
    } finally {
      setLoading(false);
    }
  };

  if (loading && editSlug) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black animate-pulse text-slate-400">
        LOADING CONFIG...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => router.push('/admin')} 
          className="flex items-center gap-2 text-slate-400 font-black hover:text-slate-600 mb-8 uppercase tracking-widest text-sm transition-colors"
        >
          <ArrowLeft size={20}/> Dashboard
        </button>

        <div className="bg-white rounded-[3.5rem] p-10 md:p-16 shadow-2xl border border-slate-100">
          <div className="flex items-center gap-6 mb-12">
            <div 
              className="w-16 h-16 bg-slate-900 rounded-[1.5rem] text-white flex items-center justify-center shadow-xl rotate-3 transition-colors" 
              style={{ backgroundColor: color }}
            >
              <Store size={32}/>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                {editSlug ? '店舗情報を編集' : '新規店舗を登録'}
              </h1>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mt-1">
                Store Profile Configuration
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-10">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 ml-6 uppercase tracking-widest">
                店舗名称
              </label>
              <input 
                type="text" 
                required 
                placeholder="例：ピーロート日比谷店" 
                className="w-full h-[72px] px-8 bg-slate-50 rounded-[2rem] border-2 border-transparent focus:border-amber-500 font-bold outline-none shadow-inner transition-all text-lg" 
                value={name} 
                onChange={e => setName(e.target.value)} 
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 ml-6 uppercase tracking-widest">
                URLスラグ（半角英数字・ハイフン）
              </label>
              <div className="relative group">
                <Globe className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300" size={24}/>
                <input 
                  type="text" 
                  required 
                  disabled={!!editSlug} 
                  placeholder="hibiya-pieroth" 
                  className={`w-full h-[72px] pl-20 pr-8 rounded-[2rem] border-2 border-transparent font-bold shadow-inner transition-all text-lg ${
                    editSlug ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 focus:border-amber-500'
                  }`} 
                  value={slug} 
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} 
                />
              </div>
              {!editSlug && (
                <p className="text-[10px] text-slate-400 ml-6 font-bold uppercase italic">
                  ※一度登録すると変更できません（公開URLになります）
                </p>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 ml-6 uppercase tracking-widest">
                メニューテーマカラー
              </label>
              <div className="flex gap-6 items-center bg-slate-50 p-6 rounded-[2rem] shadow-inner">
                <div className="relative">
                  <input 
                    type="color" 
                    className="w-16 h-16 rounded-2xl cursor-pointer bg-transparent border-none outline-none" 
                    value={color} 
                    onChange={e => setColor(e.target.value)} 
                  />
                  <Palette className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none drop-shadow-md" size={24}/>
                </div>
                <span className="font-mono font-black text-xl text-slate-700 tracking-wider uppercase">
                  {color}
                </span>
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full h-[80px] bg-slate-900 text-white rounded-[2.5rem] font-black text-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:bg-amber-500 hover:text-black active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Save size={24}/> 
                    {editSlug ? '更新内容を保存' : '店舗メニューを開設'}
                  </>
                )}
              </button>
            </div>

            {status && (
              <div className={`p-6 rounded-[2rem] flex items-center gap-4 font-black border-2 animate-in fade-in slide-in-from-bottom-2 ${
                status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
              }`}>
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

/**
 * プレビュー環境での App エントリポイント
 */
export default function App() { 
  return ( 
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-slate-400" size={48}/>
      </div>
    }> 
      <SettingsForm /> 
    </Suspense> 
  ); 
}
