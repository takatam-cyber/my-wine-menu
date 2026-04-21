"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Wine, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();

      if (res.ok) {
        // ログイン成功
        router.push('/admin/master');
      } else {
        alert(data.error || 'ログインに失敗しました。');
      }
    } catch (err) {
      alert('通信エラーが発生しました。インターネット接続を確認してください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl text-center space-y-8">
        <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
          <Wine size={32} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Admin Login</h1>
          <p className="text-slate-400 text-xs font-bold mt-1 tracking-widest uppercase">Wine Menu Management</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Email</label>
            <input 
              type="email" required
              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-amber-500 focus:bg-white text-slate-900 font-bold outline-none transition-all"
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Password</label>
            <input 
              type="password" required
              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-amber-500 focus:bg-white text-slate-900 font-bold outline-none transition-all"
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Lock size={16}/> Enter System</>}
          </button>
        </form>
      </div>
    </div>
  );
}
