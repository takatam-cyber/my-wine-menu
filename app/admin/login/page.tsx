// app/admin/login/page.tsx 全文上書き
"use client";
export const runtime = 'edge';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, LogIn, Loader2, UserPlus } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) router.push('/admin');
    else setError('認証に失敗しました。正しい権印が必要です。');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-slate-200">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-slate-900 rounded-2xl text-amber-500 shadow-lg -rotate-3"><Lock size={32}/></div>
        </div>
        <h1 className="text-2xl font-black text-center text-slate-900 mb-2">Staff Login</h1>
        <p className="text-center text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8">管理システムへアクセス</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email (@pieroth.jp)" className="w-full h-16 px-6 bg-slate-100 rounded-2xl font-bold outline-none focus:ring-2 ring-amber-500 transition-all" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="w-full h-16 px-6 bg-slate-100 rounded-2xl font-bold outline-none focus:ring-2 ring-amber-500 transition-all" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading} className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-amber-500 hover:text-black transition-all">
            {loading ? <Loader2 className="animate-spin" /> : <><LogIn size={20}/> ログイン</>}
          </button>
        </form>

        {error && <p className="text-red-500 text-center mt-4 font-black text-xs bg-red-50 p-3 rounded-xl">{error}</p>}

        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <button onClick={() => router.push('/admin/register')} className="flex items-center justify-center gap-2 w-full text-slate-400 hover:text-slate-900 font-black text-xs uppercase tracking-widest transition-colors">
            <UserPlus size={16}/> 初めての方（有効化）はこちら
          </button>
        </div>
      </div>
    </div>
  );
}
