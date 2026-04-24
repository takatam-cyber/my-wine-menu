// app/partner/login/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { 
  Store, Lock, Loader2, ArrowRight, 
  HelpCircle, CheckCircle2, AlertCircle,
  Wine, LayoutGrid
} from 'lucide-react';

/**
 * ユーティリティ: 安全なURL生成
 */
const getSafeUrl = (path: string) => {
  if (typeof window === 'undefined') return path;
  return path.startsWith('/') ? path : `/${path}`;
};

export default function PartnerLogin() {
  const [slug, setSlug] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // URLから自動的にスラグを取得（例: ?slug=pieroth-hibiya）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('slug');
    if (s) setSlug(s);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // モック認証ロジック
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      if (password === 'pass' || password === 'admin') {
        window.location.href = getSafeUrl('/partner');
      } else {
        setError('パスワードが正しくありません。');
      }
    } catch (err) {
      setError('サーバーとの通信に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans antialiased">
      <div className="w-full max-w-sm space-y-8">
        
        {/* ヘッダーロゴ */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-amber-500 mx-auto shadow-xl">
            <Store size={28} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">飲食店様ログイン</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Partner Portal Access</p>
          </div>
        </div>

        {/* ログインカード */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 border border-slate-100">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-[0.2em]">店舗ID (URLスラグ)</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  placeholder="店舗IDを入力"
                  className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 font-bold outline-none focus:ring-4 ring-slate-500/5 focus:border-slate-900 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-[0.2em]">パスワード</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 font-bold outline-none focus:ring-4 ring-slate-500/5 focus:border-slate-900 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={16} />
                <p className="text-[11px] font-bold">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-slate-900/20 transition-all"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>ログインする <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>

        {/* ログインできない場合のアシスト */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-4">
          <HelpCircle className="text-amber-600 shrink-0" size={20} />
          <div className="space-y-1">
            <h4 className="text-[11px] font-black text-amber-900 uppercase">ログインできない場合</h4>
            <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
              店舗IDまたはパスワードが不明な場合は、ピーロートの担当営業スタッフまでお問い合わせください。
            </p>
          </div>
        </div>

        {/* フッター */}
        <div className="text-center">
          <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">
            Provided by Pieroth Japan
          </p>
        </div>
      </div>
    </div>
  );
}
