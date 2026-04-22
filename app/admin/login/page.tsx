"use client";
export const runtime = 'edge';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, LogIn, Loader2 } from 'lucide-react';

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
    else setError('認証に失敗しました。');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-amber-500 rounded-2xl text-white shadow-lg"><Lock size={32}/></div>
        </div>
        <h1 className="text-2xl font-black text-center text-slate-900 mb-8">Admin Access</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" className="w-full p-4 bg-slate-100 rounded-xl font-bold" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="w-full p-4 bg-slate-100 rounded-xl font-bold" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <><LogIn size={18}/> ログイン</>}
          </button>
        </form>
        {error && <p className="text-red-500 text-center mt-4 font-bold text-xs">{error}</p>}
      </div>
    </div>
  );
}
