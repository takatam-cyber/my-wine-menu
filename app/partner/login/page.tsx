// app/partner/login/page.tsx
"use client";

export const runtime = 'edge';

import React, { useState } from 'react';
import { Lock, LogIn, Loader2, Store, ArrowLeft } from 'lucide-react';

export default function PartnerLogin() {
  const [slug, setSlug] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slug.trim().toLowerCase(), password }),
      });

      if (res.ok) {
        window.location.href = '/partner';
      } else {
        const data = await res.json();
        setError(data.error || '認証に失敗しました。');
      }
    } catch (err) {
      setError('通信エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl w-full max-w-md border border-slate-200">
        <div className="flex justify-center mb-8">
          <div className="p-5 bg-slate-900 text-amber-500 rounded-3xl shadow-xl -rotate-3">
            <Store size={40}/>
          </div>
        </div>
        
        <div className="text-center mb-10">
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Partner Portal</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">店舗様専用管理システム</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4">店舗ID (URLスラッグ)</label>
            <input 
              type="text" 
              placeholder="例: pieroth-hibiya" 
              className="w-full h-16 px-6 bg-slate-100 text-slate-900 rounded-2xl font-bold outline-none focus:ring-2 ring-amber-500 transition-all"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              required 
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4">アクセスパスワード</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full h-16 px-6 bg-slate-100 text-slate-900 rounded-2xl font-bold outline-none focus:ring-2 ring-amber-500 transition-all"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-amber-500 hover:text-slate-950 transition-all shadow-xl active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <LogIn size={20}/>}
            ログイン
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold text-center border border-red-100 animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-slate-100">
          <p className="text-center text-[10px] text-slate-400 font-bold leading-relaxed">
            ※IDやパスワードをお忘れの場合は、<br/>担当のピーロート営業スタッフまでお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  );
}
