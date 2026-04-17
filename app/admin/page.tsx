// app/admin/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { 
  Camera, Loader2, Wine as WineIcon, Edit3, Download, Upload, LogOut, Save, Mail, Lock, Key
} from 'lucide-react';

export default function AdminPage() {
  const [auth, setAuth] = useState({ email: '', pass: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialWineState = {
    id: '', name_jp: '', name_en: '', country: '', region: '', grape: '',
    color: '赤', type: 'フルボディ', vintage: '', price: '', cost: '', stock: '0',
    advice: '', aroma: '3', pairing: '', sweetness: '3', body: '3', acidity: '3', tannin: '3', image: ''
  };
  const [newWine, setNewWine] = useState(initialWineState);

  useEffect(() => {
    const savedEmail = localStorage.getItem('wine_store_email');
    if (savedEmail) { setAuth(prev => ({ ...prev, email: savedEmail })); setIsLoggedIn(true); }
  }, []);

  useEffect(() => { 
    if (isLoggedIn) {
      fetchWines();
      fetch(`/api/config`, { headers: { 'x-store-id': auth.email } })
        .then(res => res.json()).then(data => setGeminiKey(data.gemini_key || ''));
    }
  }, [isLoggedIn]);

  const fetchWines = async () => {
    const res = await fetch(`/api/wines`, { headers: { 'x-store-id': auth.email } });
    const data = await res.json();
    setWines(Array.isArray(data) ? data : []);
  };

  const saveConfig = async () => {
    await fetch('/api/config', { 
      method: 'POST', headers: { 'x-store-id': auth.email }, 
      body: JSON.stringify({ gemini_key: geminiKey }) 
    });
    alert("APIキー設定を保存しました。今後は店舗専用キーで解析されます。");
  };

  const handleScan = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const { url } = await uploadRes.json();
      const scanRes = await fetch('/api/scan', { 
        method: 'POST', headers: { 'x-store-id': auth.email }, body: JSON.stringify({ image: url }) 
      });
      const { result } = await scanRes.json();
      setNewWine({ ...newWine, ...JSON.parse(result), image: url });
    } catch (err) { alert("解析に失敗しました。画像を変えて試してください。"); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    await fetch('/api/wines', { 
      method: 'POST', headers: { 'x-store-id': auth.email }, body: JSON.stringify(newWine) 
    });
    setNewWine(initialWineState); setEditingId(null); fetchWines();
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0e12] p-6 text-black">
      <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl">
        <h1 className="text-3xl font-black mb-8 text-center tracking-tighter">{isForgotMode ? "RESET" : "LOGIN"}</h1>
        <form onSubmit={(e:any) => { e.preventDefault(); setIsLoggedIn(true); localStorage.setItem('wine_store_email', auth.email); }} className="space-y-4">
          <div className="relative"><Mail className="absolute left-4 top-4 text-slate-400" size={20}/><input type="email" placeholder="メールアドレス" value={auth.email} onChange={e => setAuth({...auth, email: e.target.value})} className="w-full p-4 pl-12 bg-slate-100 rounded-2xl font-bold outline-none focus:ring-2 ring-amber-500" required /></div>
          {!isForgotMode && <div className="relative"><Lock className="absolute left-4 top-4 text-slate-400" size={20}/><input type="password" placeholder="パスワード" value={auth.pass} onChange={e => setAuth({...auth, pass: e.target.value})} className="w-full p-4 pl-12 bg-slate-100 rounded-2xl font-bold outline-none focus:ring-2 ring-amber-500" required /></div>}
          <button className="w-full bg-black text-white py-5 rounded-2xl font-black text-lg shadow-xl">{isForgotMode ? "リセット案内を送信" : "ログイン"}</button>
        </form>
        <button onClick={() => setIsForgotMode(!isForgotMode)} className="w-full mt-6 text-sm font-bold text-slate-400">{isForgotMode ? "ログインへ" : "パスワードを忘れた場合"}</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6 bg-slate-50 min-h-screen text-black pb-24 font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-black truncate">{auth.email}</h1>
        <button onClick={() => {localStorage.clear(); location.reload();}} className="p-3 bg-white border rounded-2xl text-slate-400 shadow-sm"><LogOut size={20}/></button>
      </div>

      <div className="bg-amber-50 p-6 rounded-3xl mb-8 border border-amber-100 flex gap-3 items-center">
        <Key className="text-amber-500" />
        <input type="password" placeholder="Gemini API Key (未入力なら無料Llamaを使用)" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} className="flex-1 bg-white p-3 rounded-xl text-xs font-mono outline-none" />
        <button onClick={saveConfig} className="bg-amber-500 text-white px-4 py-3 rounded-xl font-black text-xs">保存</button>
      </div>

      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 mb-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <label className="aspect-[3/4] bg-slate-100 rounded-3xl overflow-hidden flex flex-col items-center justify-center relative cursor-pointer border-2 border-dashed border-slate-200">
            {newWine.image ? <img src={newWine.image} className="w-full h-full object-cover" /> : <div className="text-center p-4"><Camera size={48} className="mx-auto mb-2 text-slate-300"/><p className="text-[10px] font-black text-slate-400">ボトルを撮影</p></div>}
            {loading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="text-white animate-spin" size={48} /></div>}
            <input type="file" accept="image/*" capture="environment" onChange={handleScan} className="hidden" />
          </label>
          <div className="space-y-3">
            <select value={newWine.color} onChange={e => setNewWine({...newWine, color: e.target.value})} className="w-full p-3 bg-slate-100 rounded-xl font-black text-black">
              <option value="赤">赤ワイン</option><option value="白">白ワイン</option><option value="泡">泡</option>
            </select>
            <input type="text" placeholder="名前" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-slate-100 text-black" />
            <div className="grid grid-cols-2 gap-2"><input type="number" placeholder="売価" value={newWine.price} onChange={e => setNewWine({...newWine, price: e.target.value})} className="p-3 bg-amber-50 rounded-xl font-bold border-2 border-amber-100 text-black" /><input type="number" placeholder="在庫" value={newWine.stock} onChange={e => setNewWine({...newWine, stock: e.target.value})} className="p-3 bg-green-50 rounded-xl font-bold border-2 border-green-100 text-black" /></div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-slate-100">
          <FlavorField label="甘味" val={newWine.sweetness} set={(v:any) => setNewWine({...newWine, sweetness: v})} />
          <FlavorField label="ボディ" val={newWine.body} set={(v:any) => setNewWine({...newWine, body: v})} />
          <FlavorField label="酸味" val={newWine.acidity} set={(v:any) => setNewWine({...newWine, acidity: v})} />
          {newWine.color === '赤' ? (
            <FlavorField label="渋み" val={newWine.tannin} set={(v:any) => setNewWine({...newWine, tannin: v})} />
          ) : (
            <FlavorField label="フルーティ" val={newWine.aroma} set={(v:any) => setNewWine({...newWine, aroma: v})} />
          )}
        </div>

        <textarea placeholder="ソムリエ解説" value={newWine.advice} onChange={e => setNewWine({...newWine, advice: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold h-24 border-2 border-slate-100 text-black" />
        <button onClick={handleSave} className="w-full bg-black text-white py-6 rounded-3xl font-black text-xl active:scale-95 transition-all"><Save size={24}/> {editingId ? '更新' : '登録'}</button>
      </div>
    </div>
  );
}

function FlavorField({ label, val, set }: any) {
  return (
    <div className="space-y-1 text-center"><label className="text-[10px] font-black text-slate-400 uppercase">{label}</label><input type="number" min="1" max="5" value={val} onChange={e => set(e.target.value)} className="w-full p-2 bg-slate-50 rounded-xl font-black text-center border-2 border-slate-100 text-black" /></div>
  );
}
