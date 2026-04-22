"use client";
export const runtime = 'edge';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail, Loader2, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const router = useRouter();

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ email }) });
      const data = await res.json();
      setMsg(data.message || data.error);
    } catch { setMsg('通信エラーが発生しました'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-sans">
      <div className="max-w-md w-full space-y-8 bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl border border-white/5">
        <div className="text-center">
          <div className="bg-amber-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"><KeyRound size={32} className="text-slate-950" /></div>
          <h1 className="text-2xl font-black">Staff Activation</h1>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">仮パスワードの発行</p>
        </div>
        <form onSubmit={handleRequest} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input type="email" required placeholder="takatam@pieroth.jp" className="w-full p-4 pl-12 bg-slate-800 rounded-xl border border-white/5 focus:border-amber-500 outline-none font-bold" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 bg-white text-slate-950 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-amber-500 transition-all">
            {loading ? <Loader2 className="animate-spin" /> : "パスワードを発行する"}
          </button>
        </form>
        {msg && <div className="p-4 bg-slate-800 rounded-xl text-center text-xs font-bold border border-white/5 text-amber-500">{msg}</div>}
        <div className="text-center pt-4"><button onClick={() => router.push('/admin/login')} className="text-slate-500 hover:text-white text-xs font-bold flex items-center justify-center gap-2"><ArrowLeft size={14}/> ログイン画面に戻る</button></div>
      </div>
    </div>
  );
}
