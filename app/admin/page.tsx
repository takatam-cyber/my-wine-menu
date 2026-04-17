// app/admin/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { 
  Camera, Loader2, Wine as WineIcon, Edit3, LogOut, Save, Mail, Lock, Trash2, Settings, Globe, ChevronRight, UserPlus
} from 'lucide-react';

export default function AdminPage() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [auth, setAuth] = useState({ email: '', pass: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [config, setConfig] = useState({ menu_name: '', slug: '' });
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
      fetch(`/api/config`, { headers: { 'x-store-id': auth.email } }).then(res => res.json()).then(data => setConfig(data));
    }
  }, [isLoggedIn, auth.email]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth', { method: 'POST', body: JSON.stringify({ action: mode, email: auth.email, password: auth.pass }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (mode === 'login') {
        localStorage.setItem('wine_store_email', auth.email);
        setIsLoggedIn(true);
      } else {
        alert("メールを送信しました。届いたパスワードを確認してください。");
        setMode('login');
      }
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const fetchWines = async () => {
    const res = await fetch(`/api/wines`, { headers: { 'x-store-id': auth.email } });
    const data = await res.json();
    setWines(Array.isArray(data) ? data : []);
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
      const scanRes = await fetch('/api/scan', { method: 'POST', body: JSON.stringify({ image: url }) });
      const scanData = await scanRes.json();
      setNewWine({ ...newWine, ...JSON.parse(scanData.result), image: url });
    } catch (err: any) { alert("解析失敗。"); } finally { setLoading(false); }
  };

  const handleSaveWine = async () => {
    await fetch('/api/wines', { method: 'POST', headers: { 'x-store-id': auth.email }, body: JSON.stringify(newWine) });
    setNewWine(initialWineState); setEditingId(null); fetchWines();
    alert("保存完了");
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl">
        <div className="text-center mb-8">
          <WineIcon className="mx-auto text-amber-500 mb-2" size={40}/>
          <h1 className="text-2xl font-black uppercase tracking-tighter">
            {mode === 'login' ? 'Login' : mode === 'register' ? 'Registration' : 'Pass Recovery'}
          </h1>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder="メールアドレス" value={auth.email} onChange={e => setAuth({...auth, email: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" required />
          {(mode === 'login') && <input type="password" placeholder="パスワード" value={auth.pass} onChange={e => setAuth({...auth, pass: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" required />}
          <button disabled={loading} className="w-full bg-black text-white py-5 rounded-2xl font-black shadow-xl active:scale-95 transition-all">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : mode === 'login' ? 'ログイン' : mode === 'register' ? 'パスワードをメールで受取' : '再送メールを送信'}
          </button>
        </form>
        <div className="mt-8 pt-6 border-t text-center space-y-4">
          {mode === 'login' ? (
            <>
              <button onClick={() => setMode('register')} className="text-sm font-bold text-amber-600 block w-full">新規店舗登録はこちら</button>
              <button onClick={() => setMode('forgot')} className="text-xs text-slate-400">パスワードを忘れましたか？</button>
            </>
          ) : (
            <button onClick={() => setMode('login')} className="text-sm font-bold text-slate-400">ログイン画面に戻る</button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6 bg-slate-50 min-h-screen text-black pb-24 font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-lg font-black truncate max-w-[200px]">{auth.email}</h1>
        <button onClick={() => {localStorage.clear(); location.reload();}} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400"><LogOut size={20}/></button>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl mb-8 border border-slate-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" value={config.menu_name} onChange={e => setConfig({...config, menu_name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border-2 font-bold" placeholder="メニュー名" />
          <input type="text" value={config.slug} onChange={e => setConfig({...config, slug: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border-2 font-bold" placeholder="URLスラッグ" />
        </div>
        <button onClick={async () => { await fetch('/api/config', { method: 'POST', headers: { 'x-store-id': auth.email }, body: JSON.stringify(config) }); alert("保存完了"); }} className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black shadow-lg">店舗設定を保存</button>
      </div>

      <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 mb-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <label className="aspect-[3/4] bg-slate-100 rounded-3xl overflow-hidden flex flex-col items-center justify-center relative cursor-pointer border-4 border-dashed group">
            {newWine.image ? <img src={newWine.image} className="w-full h-full object-cover" /> : <div className="text-center"><Camera size={48} className="mx-auto text-slate-200 mb-2"/><p className="text-[10px] font-black text-slate-300">Scan Bottle</p></div>}
            {loading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="text-white animate-spin" size={48} /></div>}
            <input type="file" accept="image/*" capture="environment" onChange={handleScan} className="hidden" />
          </label>
          <div className="space-y-3">
            <select value={newWine.color} onChange={e => setNewWine({...newWine, color: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-black">
              <option value="赤">Red</option><option value="白">White</option><option value="ロゼ">Rosé</option><option value="泡">Sparkling</option>
            </select>
            <input type="text" placeholder="名前 (日)" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-2" />
            <input type="text" placeholder="English Name" value={newWine.name_en} onChange={e => setNewWine({...newWine, name_en: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-2" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="国" value={newWine.country} onChange={e => setNewWine({...newWine, country: e.target.value})} className="p-3 bg-slate-50 rounded-xl border-2" />
              <input type="text" placeholder="産地" value={newWine.region} onChange={e => setNewWine({...newWine, region: e.target.value})} className="p-3 bg-slate-50 rounded-xl border-2" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="品種" value={newWine.grape} onChange={e => setNewWine({...newWine, grape: e.target.value})} className="p-3 bg-slate-50 rounded-xl border-2" />
              <input type="text" placeholder="年 (Vintage)" value={newWine.vintage} onChange={e => setNewWine({...newWine, vintage: e.target.value})} className="p-3 bg-slate-50 rounded-xl border-2" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" placeholder="売価" value={newWine.price} onChange={e => setNewWine({...newWine, price: e.target.value})} className="p-3 bg-amber-50 rounded-xl font-bold" />
              <input type="number" placeholder="仕入" value={newWine.cost} onChange={e => setNewWine({...newWine, cost: e.target.value})} className="p-3 bg-slate-100 rounded-xl font-bold" />
              <input type="number" placeholder="在庫" value={newWine.stock} onChange={e => setNewWine({...newWine, stock: e.target.value})} className="p-3 bg-green-50 rounded-xl font-bold" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t">
          <FlavorField label="甘味" val={newWine.sweetness} set={(v:any) => setNewWine({...newWine, sweetness: v})} />
          <FlavorField label="ボディ" val={newWine.body} set={(v:any) => setNewWine({...newWine, body: v})} />
          <FlavorField label="酸味" val={newWine.acidity} set={(v:any) => setNewWine({...newWine, acidity: v})} />
          {newWine.color === '赤' ? (
            <FlavorField label="渋み" val={newWine.tannin} set={(v:any) => setNewWine({...newWine, tannin: v})} />
          ) : (
            <FlavorField label="香り" val={newWine.aroma} set={(v:any) => setNewWine({...newWine, aroma: v})} />
          )}
        </div>

        <textarea placeholder="ソムリエのオススメ解説" value={newWine.advice} onChange={e => setNewWine({...newWine, advice: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold h-32 border-2" />
        <button onClick={handleSaveWine} className="w-full bg-black text-white py-6 rounded-3xl font-black text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
          <Save size={24}/> {editingId ? 'ワインを更新' : '台帳に登録'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {wines.map((wine: any) => (
          <div key={wine.id} className="bg-white p-5 rounded-[2.5rem] flex items-center gap-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
            <img src={wine.image} className="w-20 h-24 rounded-2xl object-cover shadow-sm bg-slate-50" />
            <div className="flex-1 min-w-0">
              <p className="font-black text-lg truncate text-black">{wine.name_jp}</p>
              <p className="font-bold text-amber-600 text-sm italic">¥{Number(wine.price).toLocaleString()} <span className="text-slate-300 ml-2 font-medium italic">Stock: {wine.stock}</span></p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => {setNewWine(wine); setEditingId(wine.id); window.scrollTo({top: 450, behavior:'smooth'});}} className="p-4 bg-slate-50 rounded-2xl text-slate-300 hover:text-black transition-all"><Edit3 size={20}/></button>
              <button onClick={async () => { if(confirm("削除しますか？")) { await fetch('/api/wines', { method: 'DELETE', headers: { 'x-store-id': auth.email }, body: JSON.stringify({ id: wine.id }) }); fetchWines(); } }} className="p-4 bg-red-50 rounded-2xl text-red-200 hover:text-red-500 transition-all"><Trash2 size={20}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlavorField({ label, val, set }: any) {
  return (
    <div className="space-y-1 text-center">
      <label className="text-[10px] font-black text-slate-400 uppercase">{label}</label>
      <input type="number" min="1" max="5" value={val} onChange={e => set(e.target.value)} className="w-full p-2 bg-slate-50 rounded-xl font-black text-center border-2 border-transparent focus:border-amber-500 outline-none" />
    </div>
  );
}
