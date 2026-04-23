// app/admin/register/page.tsx
"use client";
export const runtime = 'edge';
import React, { useState } from 'react';
import { KeyRound, Mail, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{type: 'info' | 'error', text: string} | null>(null);

  const handleGoToLogin = () => {
    if (typeof window !== 'undefined') window.location.href = '/admin/login';
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    if (!email.toLowerCase().endsWith("@pieroth.jp")) {
      setMsg({ type: 'error', text: 'ピーロート・ジャパン社員専用ドメイン（@pieroth.jp）のみ有効化できます。' });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', { 
        method: 'POST', 
        body: JSON.stringify({ email: email.toLowerCase().trim() }) 
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'info', text: '仮パスワードをメールで送信しました。' });
      } else {
        setMsg({ type: 'error', text: data.error || '失敗しました。' });
      }
    } catch { setMsg({ type: 'error', text: '通信エラー' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-sans">
      <div className="max-w-md w-full space-y-8 bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl border border-white/5">
        <div className="text-center">
          <div className="bg-amber-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"><ShieldCheck size={32} className="text-slate-950" /></div>
          <h1 className="text-2xl font-black">Staff Activation</h1>
          <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">アクセス権の有効化</p>
        </div>
        <form onSubmit={handleRequest} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input type="email" required placeholder="yourname@pieroth.jp" className="w-full p-5 pl-12 bg-slate-800 rounded-2xl border border-white/5 focus:border-amber-500 outline-none font-bold text-sm" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-amber-500 transition-all disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={24} /> : "仮パスワードを発行する"}
          </button>
        </form>
        {msg && <div className={`p-5 rounded-2xl text-center text-xs font-bold border ${msg.type === 'info' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{msg.text}</div>}
        <div className="text-center pt-4"><button onClick={handleGoToLogin} className="text-slate-500 hover:text-white text-xs font-bold flex items-center justify-center gap-2 mx-auto transition-colors"><ArrowLeft size={14}/> ログインに戻る</button></div>
      </div>
    </div>
  );
}

export const App = RegisterPage;
