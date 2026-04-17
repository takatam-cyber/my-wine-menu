// app/admin/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { 
  Camera, Loader2, Wine as WineIcon, Edit3, Download, Upload, LogOut, Save, Mail, Lock, Key, Trash2, Settings, Globe
} from 'lucide-react';

export default function AdminPage() {
  const [auth, setAuth] = useState({ email: '', pass: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [config, setConfig] = useState({ menu_name: '', slug: '', gemini_key: '' });
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
        .then(res => res.json()).then(data => setConfig(data));
    }
  }, [isLoggedIn, auth.email]);

  const fetchWines = async () => {
    const res = await fetch(`/api/wines`, { headers: { 'x-store-id': auth.email } });
    const data = await res.json();
    setWines(Array.isArray(data) ? data : []);
  };

  const saveConfig = async () => {
    await fetch('/api/config', { 
      method: 'POST', headers: { 'x-store-id': auth.email }, 
      body: JSON.stringify(config) 
    });
    alert("設定を保存しました。");
  };

  const deleteWine = async (id: string) => {
    if (!confirm("このワインを削除してもよろしいですか？")) return;
    await fetch('/api/wines', { 
      method: 'DELETE', headers: { 'x-store-id': auth.email }, 
      body: JSON.stringify({ id }) 
    });
    fetchWines();
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
      const scanRes = await fetch('/api/scan', { method: 'POST', headers: { 'x-store-id': auth.email }, body: JSON.stringify({ image: url }) });
      const { result } = await scanRes.json();
      setNewWine({ ...newWine, ...JSON.parse(result), image: url });
    } catch (err) { alert("解析失敗。"); } finally { setLoading(false); }
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6 text-black">
      <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl">
        <h1 className="text-3xl font-black mb-8 text-center">LOGIN</h1>
        <form onSubmit={(e:any) => { e.preventDefault(); setIsLoggedIn(true); localStorage.setItem('wine_store_email', auth.email); }} className="space-y-4">
          <input type="email" placeholder="メールアドレス" value={auth.email} onChange={e => setAuth({...auth, email: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-bold" required />
          <input type="password" placeholder="パスワード" value={auth.pass} onChange={e => setAuth({...auth, pass: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-bold" required />
          <button className="w-full bg-black text-white py-5 rounded-2xl font-black">ログイン</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6 bg-slate-50 min-h-screen text-black pb-24 font-sans">
      {/* 店舗設定セクション */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl mb-8 border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 mb-4 text-slate-400 font-black text-xs uppercase tracking-widest"><Settings size={16}/> Initial Settings</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black ml-2">メニュー名 (例: Bistro Wine Lab)</label>
            <input type="text" value={config.menu_name} onChange={e => setConfig({...config, menu_name: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-100 font-bold" placeholder="店舗名を入力" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black ml-2">URLスラッグ (例: bistro-lab)</label>
            <div className="flex items-center bg-slate-50 rounded-xl border-2 border-slate-100 px-3">
              <span className="text-xs text-slate-400">/</span>
              <input type="text" value={config.slug} onChange={e => setConfig({...config, slug: e.target.value})} className="flex-1 p-3 bg-transparent font-bold outline-none" placeholder="英数字のみ" />
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black ml-2">Gemini API Key (空にすると無料モードに戻ります)</label>
          <div className="flex gap-2">
            <input type="password" value={config.gemini_key} onChange={e => setConfig({...config, gemini_key: e.target.value})} className="flex-1 p-3 bg-slate-50 rounded-xl border-2 border-slate-100 font-mono text-xs" placeholder="AI Studioのキーを入力" />
            {config.gemini_key && <button onClick={() => setConfig({...config, gemini_key: ''})} className="px-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 size={16}/></button>}
          </div>
        </div>
        <button onClick={saveConfig} className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-amber-200 active:scale-95 transition-all">店舗情報を更新・URLを確定</button>
      </div>

      {/* ワイン入力セクション */}
      <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 mb-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <label className="aspect-[3/4] bg-slate-100 rounded-3xl overflow-hidden flex flex-col items-center justify-center relative cursor-pointer border-2 border-dashed border-slate-200">
            {newWine.image ? <img src={newWine.image} className="w-full h-full object-cover" /> : <div className="text-center p-4"><Camera size={48} className="mx-auto mb-2 text-slate-300"/><p className="text-[10px] font-black text-slate-400">ボトルを撮影してAI分析</p></div>}
            {loading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="text-white animate-spin" size={48} /></div>}
            <input type="file" accept="image/*" capture="environment" onChange={handleScan} className="hidden" />
          </label>
          <div className="space-y-3">
            <select value={newWine.color} onChange={e => setNewWine({...newWine, color: e.target.value})} className="w-full p-3 bg-slate-100 rounded-xl font-black">
              <option value="赤">赤ワイン</option><option value="白">白ワイン</option><option value="ロゼ">ロゼ</option><option value="泡">スパークリング</option>
            </select>
            <input type="text" placeholder="名前 (日本語)" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-slate-100" />
            <input type="text" placeholder="Name (English)" value={newWine.name_en} onChange={e => setNewWine({...newWine, name_en: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-slate-100" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="国" value={newWine.country} onChange={e => setNewWine({...newWine, country: e.target.value})} className="p-3 bg-slate-50 rounded-xl font-bold border-2 border-slate-100" />
              <input type="text" placeholder="産地" value={newWine.region} onChange={e => setNewWine({...newWine, region: e.target.value})} className="p-3 bg-slate-50 rounded-xl font-bold border-2 border-slate-100" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" placeholder="売価" value={newWine.price} onChange={e => setNewWine({...newWine, price: e.target.value})} className="p-3 bg-amber-50 rounded-xl font-bold" />
              <input type="number" placeholder="仕入" value={newWine.cost} onChange={e => setNewWine({...newWine, cost: e.target.value})} className="p-3 bg-slate-100 rounded-xl font-bold" />
              <input type="number" placeholder="在庫" value={newWine.stock} onChange={e => setNewWine({...newWine, stock: e.target.value})} className="p-3 bg-green-50 rounded-xl font-bold" />
            </div>
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

        <input type="text" placeholder="ペアリング (合う料理)" value={newWine.pairing} onChange={e => setNewWine({...newWine, pairing: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-slate-100" />
        <textarea placeholder="ソムリエ解説" value={newWine.advice} onChange={e => setNewWine({...newWine, advice: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold h-24 border-2 border-slate-100" />
        <button onClick={handleSave} className="w-full bg-black text-white py-6 rounded-3xl font-black text-xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"><Save size={24}/> {editingId ? 'ワイン情報を更新' : '台帳に登録する'}</button>
      </div>

      {/* ワインリスト */}
      <div className="grid grid-cols-1 gap-4">
        {wines.map((wine: any) => (
          <div key={wine.id} className="bg-white p-5 rounded-[2rem] flex items-center gap-6 shadow-md border border-slate-100 group">
            <img src={wine.image} className="w-20 h-24 rounded-2xl object-cover shadow-sm bg-slate-50" />
            <div className="flex-1 min-w-0">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${wine.color === '赤' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{wine.color}</span>
              <p className="font-black text-lg truncate text-black">{wine.name_jp}</p>
              <p className="font-bold text-amber-600 text-sm">¥{Number(wine.price).toLocaleString()} <span className="text-slate-300 ml-2 font-medium">在庫: {wine.stock}</span></p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => {setNewWine(wine); setEditingId(wine.id); window.scrollTo({top: 400, behavior:'smooth'});}} className="p-4 bg-slate-50 rounded-2xl text-slate-300 hover:text-black hover:bg-slate-100 transition-all"><Edit3 size={20}/></button>
              <button onClick={() => deleteWine(wine.id)} className="p-4 bg-red-50 rounded-2xl text-red-300 hover:text-red-500 hover:bg-red-100 transition-all"><Trash2 size={20}/></button>
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
      <input type="number" min="1" max="5" value={val} onChange={e => set(e.target.value)} className="w-full p-2 bg-slate-50 rounded-xl font-black text-center border-2 border-slate-100 outline-none focus:border-amber-500" />
    </div>
  );
}
