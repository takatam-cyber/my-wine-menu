// app/admin/login/page.tsx
"use client";

import React, { useState } from 'react';
import { 
  Lock, Mail, Eye, EyeOff, Loader2, 
  ChevronRight, LayoutGrid, ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

/**
 * ユーティリティ: 安全なURL生成
 */
const getSafeUrl = (path: string) => {
  if (typeof window === 'undefined') return path;
  return path.startsWith('/') ? path : `/${path}`;
};

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 実際の運用ではここで /api/auth/login を叩く
    try {
      // シミュレーション
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // デモ用ログインロジック
      if (email.includes('@pieroth.jp')) {
        window.location.href = getSafeUrl('/admin');
      } else {
        setError('許可されていないドメインです。@pieroth.jpのアカウントを使用してください。');
      }
    } catch (err) {
      setError('ログインに失敗しました。通信状況を確認してください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* 背景装飾 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-10">
        {/* ロゴエリア */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-700 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/20 rotate-3">
            <LayoutGrid size={32} className="text-black" strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Pieroth MS</h1>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mt-2">Management System login</p>
          </div>
        </div>

        {/* ログインフォーム */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 ml-4 uppercase tracking-widest">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@pieroth.jp"
                  className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 font-bold outline-none focus:ring-4 ring-amber-500/10 focus:border-amber-500/50 transition-all placeholder:text-white/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 ml-4 uppercase tracking-widest">Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-14 pr-14 font-bold outline-none focus:ring-4 ring-amber-500/10 focus:border-amber-500/50 transition-all placeholder:text-white/10"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="text-red-500 shrink-0" size={18} />
                <p className="text-xs font-bold text-red-200 leading-tight">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-18 bg-amber-500 text-black rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>LOGIN <ChevronRight size={18} strokeWidth={3} /></>
              )}
            </button>
          </form>
        </div>

        {/* フッター情報 */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-white/20">
            <ShieldCheck size={14} />
            <p className="text-[10px] font-black uppercase tracking-widest">Authorized Staff Only</p>
          </div>
          <p className="text-[9px] text-white/10 font-medium">
            © {new Date().getFullYear()} Pieroth Japan K.K. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
