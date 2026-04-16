"use client";

import { useState, useEffect } from 'react';
import { Camera, Save, Loader2, Wine as WineIcon, Trash2, Edit3, Download, Upload, X, Plus, Minus, LogOut } from 'lucide-react';

export default function AdminPage() {
  const [auth, setAuth] = useState({ id: '', pass: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newWine, setNewWine] = useState({
    id: '', name_jp: '', name_en: '', country: '', region: '', grape: '', type: '赤', 
    vintage: '', price: '', cost: '', stock: '0', advice: '', image: ''
  });

  // ブラウザにログイン情報を保存
  useEffect(() => {
    const savedId = localStorage.getItem('wine_store_id');
    const savedPass = localStorage.getItem('wine_store_pass');
    if (savedId && savedPass) {
      setAuth({ id: savedId, pass: savedPass });
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => { if (isLoggedIn) fetchWines(); }, [isLoggedIn]);

  const fetchWines = async () => {
    const res = await fetch(`/api/wines`, {
      headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass }
    });
    if (res.ok) setWines(await res.json());
  };

  const handleLogin = (e: any) => {
    e.preventDefault();
    localStorage.setItem('wine_store_id', auth.id);
    localStorage.setItem('wine_store_pass', auth.pass);
    setIsLoggedIn(true);
  };

  const handleSave = async () => {
    await fetch('/api/wines', {
      method: 'POST',
      headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass },
      body: JSON.stringify(newWine)
    });
    setNewWine({ id:'', name_jp:'', name_en:'', country:'', region:'', grape:'', type:'赤', vintage:'', price:'', cost:'', stock:'0', advice:'', image:'' });
    setEditingId(null);
    fetchWines();
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0e12] p-6 font-sans">
        <div className="bg-white p-10 rounded-[3rem] w-full max-w-sm shadow-2xl">
          <h1 className="text-3xl font-black mb-2 text-center text-black">STORE LOGIN</h1>
          <p className="text-center text-slate-400 text-xs mb-8 uppercase tracking-widest font-bold">Wine Management System</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="店舗ID (英数字)" value={auth.id} onChange={e => setAuth({...auth, id: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-bold border-2 focus:border-black outline-none text-black" required />
            <input type="password" placeholder="パスワード" value={auth.pass} onChange={e => setAuth({...auth, pass: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-bold border-2 focus:border-black outline-none text-black" required />
            <button className="w-full bg-black text-white py-5 rounded-2xl font-black text-lg active:scale-95 transition">ログイン / 新規作成</button>
          </form>
          <p className="text-[10px] text-slate-400 mt-6 leading-relaxed">※初めて入力する店舗IDとパスワードの場合、自動的に新規アカウントとして登録されます。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-slate-50 min-h-screen text-black pb-24 font-sans">
      <div className="flex justify-between items-center py-4 px-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Store Admin</span>
          <h1 className="text-xl font-black">ID: {auth.id}</h1>
        </div>
        <button onClick={() => { localStorage.clear(); location.reload(); }} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400"><LogOut size={20}/></button>
      </div>

      {/* --- 以降は、以前のAdminPage（カメラボタン・フォーム・リスト）と同じ --- */}
      {/* 以前のAdminPageコードをここに結合します */}
      
      <div className="mt-8 p-4 bg-indigo-900 text-white rounded-3xl">
        <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-1">Your Public Menu URL</p>
        <p className="text-sm font-mono break-all font-bold">my-wine-app.dev/{auth.id}</p>
      </div>
    </div>
  );
}
