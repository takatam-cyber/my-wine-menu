"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wine, LayoutDashboard, Database, Settings, ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 本来はクッキーで判定しますが、簡易的に管理
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) setIsLoggedIn(true);
    else alert("ログイン失敗");
  };

  // ログイン前：ログインフォーム
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-left">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Wine size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Admin Login</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-amber-500 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-amber-500 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all">ENTER SYSTEM</button>
          </form>
        </div>
      </div>
    );
  }

  // ログイン後：ダッシュボード（メニュー選択）
  return (
    <div className="min-h-screen bg-slate-50 p-8 text-left font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4 mb-12">
          <div className="p-4 bg-slate-900 rounded-3xl text-white shadow-xl">
            <LayoutDashboard size={32}/>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Console</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">管理メニューを選択してください</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* 店舗登録へのリンク */}
          <button onClick={() => router.push('/admin/settings')} className="group bg-white p-8 rounded-[2.5rem] shadow-sm border-2 border-transparent hover:border-amber-500 transition-all flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Settings size={24}/>
              </div>
              <div className="text-left">
                <h3 className="text-lg font-black text-slate-900">1. 店舗基本設定</h3>
                <p className="text-sm text-slate-400 font-bold">店名とURL（Slug）を登録します</p>
              </div>
            </div>
            <ArrowRight className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-2 transition-all" />
          </button>

          {/* CSVインポートへのリンク */}
          <button onClick={() => router.push('/admin/master')} className="group bg-white p-8 rounded-[2.5rem] shadow-sm border-2 border-transparent hover:border-amber-500 transition-all flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <Database size={24}/>
              </div>
              <div className="text-left">
                <h3 className="text-lg font-black text-slate-900">2. ワインデータ登録</h3>
                <p className="text-sm text-slate-400 font-bold">CSVからワインリストを一括更新します</p>
              </div>
            </div>
            <ArrowRight className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-2 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
}
