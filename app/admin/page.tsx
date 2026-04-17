// app/admin/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { 
  Camera, Loader2, Wine as WineIcon, Edit3, LogOut, Save, Mail, Lock, Trash2, Settings, ChevronRight, Download, Upload, ExternalLink, FileDown, FileUp
} from 'lucide-react';

export default function AdminPage() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [auth, setAuth] = useState({ email: '', pass: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [config, setConfig] = useState({ menu_name: '' });
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialWineState = {
    id: '', name_jp: '', name_en: '', country: '', region: '', grape: '',
    color: '赤', type: 'フルボディ', vintage: '', price: '', cost: '', stock: '1',
    advice: '', aroma: '3', pairing: '', sweetness: '3', body: '3', acidity: '3', tannin: '3', image: ''
  };
  const [newWine, setNewWine] = useState(initialWineState);

  const currentStoreId = auth.email;

  useEffect(() => {
    const savedEmail = localStorage.getItem('wine_store_email');
    if (savedEmail) { setAuth(prev => ({ ...prev, email: savedEmail })); setIsLoggedIn(true); }
  }, []);

  useEffect(() => { 
    if (isLoggedIn && auth.email) {
      fetchWines();
      fetch(`/api/config`, { headers: { 'x-store-id': auth.email } }).then(res => res.json()).then(data => setConfig(data));
    }
  }, [isLoggedIn, auth.email]);

  const fetchWines = async () => {
    const res = await fetch(`/api/wines`, { headers: { 'x-store-id': auth.email } });
    const data = await res.json();
    setWines(Array.isArray(data) ? data : []);
  };

  // 画像を解像度を維持したまま極限まで圧縮する関数
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1200; // 解析に十分な解像度
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => resolve(blob as Blob), 'image/jpeg', 0.6); // 圧縮率60%
        };
      };
    });
  };

  const handleScan = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      // 1. 画像をブラウザで圧縮
      const compressedBlob = await compressImage(file);
      
      // 2. アップロード
      const formData = new FormData();
      formData.append('file', compressedBlob, file.name);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const { url } = await uploadRes.json();
      
      // 3. 画像を先に表示（解析失敗でも残るように）
      setNewWine(prev => ({ ...prev, image: url }));

      // 4. AI解析
      const scanRes = await fetch('/api/scan', { method: 'POST', headers: { 'x-store-id': auth.email }, body: JSON.stringify({ image: url }) });
      const scanData = await scanRes.json();
      
      if (scanData.result && scanData.result !== "{}") {
        setNewWine(prev => ({ ...prev, ...JSON.parse(scanData.result), image: url }));
      } else {
        alert("画像は取り込みましたが、文字情報の解析に失敗しました。手動で入力してください。");
      }
    } catch (err: any) { alert("エラーが発生しましたが画像は保持されました。"); } finally { setLoading(false); }
  };

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

  const exportCSV = () => {
    const headers = "id,name_jp,name_en,country,region,grape,color,type,vintage,price,cost,stock,advice,pairing,sweetness,body,acidity,tannin,aroma,image\n";
    const rows = wines.map((w: any) => 
      `"${w.id}","${w.name_jp}","${w.name_en}","${w.country}","${w.region}","${w.grape}","${w.color}","${w.type}","${w.vintage}","${w.price}","${w.cost}","${w.stock}","${(w.advice||'').replace(/"/g,'""')}","${w.pairing}","${w.sweetness}","${w.body}","${w.acidity}","${w.tannin}","${w.aroma}","${w.image}"`
    ).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `wine_list.csv`;
    link.click();
  };

  const importCSV = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter(l => l.trim()).slice(1);
        const imported = lines.map(line => {
          const c = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/^"|"$/g, '').replace(/""/g, '"'));
          return {
            id: c[0] || Date.now().toString(), name_jp: c[1], name_en: c[2], country: c[3], region: c[4],
            grape: c[5], color: c[6], type: c[7], vintage: c[8], price: c[9], cost: c[10], stock: c[11],
            advice: c[12], pairing: c[13], sweetness: c[14], body: c[15], acidity: c[16], tannin: c[17], aroma: c[18], image: c[19]
          };
        });
        if (confirm(`${imported.length}件を一括登録・更新しますか？`)) {
          await fetch('/api/wines/bulk', { method: 'POST', headers: { 'x-store-id': auth.email }, body: JSON.stringify(imported) });
          fetchWines();
          alert("インポート完了");
        }
      } catch (err) { alert("CSVの解析に失敗しました"); }
    };
    reader.readAsText(file);
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
          <h1 className="text-2xl font-black uppercase tracking-tighter">{mode === 'login' ? 'Login' : mode === 'register' ? 'Register' : 'Recovery'}</h1>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder="メールアドレス" value={auth.email} onChange={e => setAuth({...auth, email: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" required />
          {mode === 'login' && <input type="password" placeholder="パスワード" value={auth.pass} onChange={e => setAuth({...auth, pass: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" required />}
          <button disabled={loading} className="w-full bg-black text-white py-5 rounded-2xl font-black">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : mode === 'login' ? 'ログイン' : 'メールを送信'}
          </button>
        </form>
        <div className="mt-8 pt-6 border-t text-center space-y-4">
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-sm font-bold text-amber-600 block w-full">{mode === 'login' ? '新規店舗登録はこちら' : 'ログインに戻る'}</button>
          {mode === 'login' && <button onClick={() => setMode('forgot')} className="text-xs text-slate-400">パスワードを忘れましたか？</button>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6 bg-slate-50 min-h-screen text-black pb-24 font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-lg font-black truncate max-w-[200px]">{auth.email}</h1>
        <button onClick={() => {localStorage.clear(); location.reload();}} className="p-3 bg-white border rounded-2xl text-slate-400"><LogOut size={20}/></button>
      </div>

      <div className="flex gap-2 mb-8">
        <button onClick={exportCSV} className="flex-1 bg-white border-2 border-slate-200 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"><Download size={16}/> CSV出力</button>
        <label className="flex-1 bg-white border-2 border-slate-200 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-slate-50 cursor-pointer">
          <Upload size={16}/> CSV取込<input type="file" accept=".csv" onChange={importCSV} className="hidden" />
        </label>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl mb-8 border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 mb-2 text-slate-400 font-black text-[10px] uppercase tracking-widest"><Settings size={14}/> Store Name Settings</div>
        <input type="text" value={config.menu_name} onChange={e => setConfig({...config, menu_name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border-2 font-bold" placeholder="店舗名を入力" />
        <button onClick={async () => { await fetch('/api/config', { method: 'POST', headers: { 'x-store-id': auth.email }, body: JSON.stringify(config) }); alert("保存完了"); }} className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black shadow-lg">店舗名を保存</button>
      </div>

      <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 mb-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <label className="aspect-[3/4] bg-slate-50 rounded-3xl overflow-hidden flex flex-col items-center justify-center relative cursor-pointer border-4 border-dashed border-slate-100 group">
            {newWine.image ? <img src={newWine.image} className="w-full h-full object-cover" /> : <div className="text-center"><Camera size={48} className="mx-auto text-slate-200 mb-2"/><p className="text-[10px] font-black text-slate-300 uppercase">Scan Label</p></div>}
            {loading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="text-white animate-spin" size={48} /></div>}
            {/* スマホでライブラリ・カメラ両方対応 */}
            <input type="file" accept="image/*" onChange={handleScan} className="hidden" />
          </label>
          <div className="space-y-3">
            <select value={newWine.color} onChange={e => setNewWine({...newWine, color: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-black border-none">
              <option value="赤">Red</option><option value="白">White</option><option value="ロゼ">Rosé</option><option value="泡">Sparkling</option>
            </select>
            <input type="text" placeholder="名前 (日)" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-2" />
            <input type="text" placeholder="Name (English)" value={newWine.name_en} onChange={e => setNewWine({...newWine, name_en: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-2" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="国" value={newWine.country} onChange={e => setNewWine({...newWine, country: e.target.value})} className="p-3 bg-slate-50 rounded-xl border-2" />
              <input type="text" placeholder="産地" value={newWine.region} onChange={e => setNewWine({...newWine, region: e.target.value})} className="p-3 bg-slate-50 rounded-xl border-2" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="品種" value={newWine.grape} onChange={e => setNewWine({...newWine, grape: e.target.value})} className="p-3 bg-slate-50 rounded-xl border-2" />
              <input type="text" placeholder="年 (Vintage)" value={newWine.vintage} onChange={e => setNewWine({...newWine, vintage: e.target.value})} className="p-3 bg-slate-50 rounded-xl border-2" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" placeholder="売価 ¥" value={newWine.price} onChange={e => setNewWine({...newWine, price: e.target.value})} className="p-3 bg-amber-50 rounded-xl font-bold" />
              <input type="number" placeholder="仕入 ¥" value={newWine.cost} onChange={e => setNewWine({...newWine, cost: e.target.value})} className="p-3 bg-slate-100 rounded-xl font-bold" />
              <input type="number" placeholder="在庫" value={newWine.stock} onChange={e => setNewWine({...newWine, stock: e.target.value})} className="p-3 bg-green-50 rounded-xl font-bold" />
            </div>
            <input type="text" placeholder="タイプ (例: フルボディ)" value={newWine.type} onChange={e => setNewWine({...newWine, type: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-50">
          <FlavorField label="甘味" val={newWine.sweetness} set={(v:any) => setNewWine({...newWine, sweetness: v})} />
          <FlavorField label="ボディ" val={newWine.body} set={(v:any) => setNewWine({...newWine, body: v})} />
          <FlavorField label="酸味" val={newWine.acidity} set={(v:any) => setNewWine({...newWine, acidity: v})} />
          {newWine.color === '赤' ? (
            <FlavorField label="渋み" val={newWine.tannin} set={(v:any) => setNewWine({...newWine, tannin: v})} />
          ) : (
            <FlavorField label="香りの強さ" val={newWine.aroma} set={(v:any) => setNewWine({...newWine, aroma: v})} />
          )}
        </div>

        <input type="text" placeholder="ペアリング料理 (例: ステーキなど)" value={newWine.pairing} onChange={e => setNewWine({...newWine, pairing: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border-2" />
        <textarea placeholder="ソムリエの解説" value={newWine.advice} onChange={e => setNewWine({...newWine, advice: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold h-32 border-2 resize-none" />
        <button onClick={handleSaveWine} className="w-full bg-black text-white py-6 rounded-3xl font-black text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
          <Save size={24}/> {editingId ? 'Update Wine' : 'Add to Collection'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {wines.map((wine: any) => (
          <div key={wine.id} className="bg-white p-5 rounded-[2.5rem] flex items-center gap-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
            <img src={wine.image} className="w-20 h-24 rounded-2xl object-cover shadow-sm bg-slate-50" />
            <div className="flex-1 min-w-0">
              <p className="font-black text-lg truncate text-black leading-tight mb-1">{wine.name_jp}</p>
              <p className="font-bold text-amber-600 text-sm italic">¥{Number(wine.price).toLocaleString()} <span className="text-slate-300 ml-2 font-medium italic">Stock: {wine.stock}</span></p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => {setNewWine(wine); setEditingId(wine.id); window.scrollTo({top: 450, behavior:'smooth'});}} className="p-4 bg-slate-50 rounded-2xl text-slate-300 hover:text-black transition-all"><Edit3 size={20}/></button>
              <button onClick={async () => { if(confirm("削除しますか？")) { await fetch('/api/wines', { method: 'DELETE', headers: { 'x-store-id': auth.email }, body: JSON.stringify({ id: wine.id }) }); fetchWines(); } }} className="p-4 bg-red-50 rounded-2xl text-red-200 hover:text-red-500 transition-all"><Trash2 size={20}/></button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 p-10 bg-slate-900 text-white rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
        <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.4em] mb-4">Wine Menu Public URL</p>
        <p className="text-lg font-mono font-bold text-[#c5a059] italic mb-8">/{auth.email}</p>
        <a href={`/${encodeURIComponent(auth.email)}`} target="_blank" className="inline-flex items-center gap-3 bg-[#c5a059] text-black px-10 py-5 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase active:scale-95 transition-all shadow-xl">
          Preview Menu <ChevronRight size={16}/>
        </a>
      </div>
    </div>
  );
}

function FlavorField({ label, val, set }: any) {
  return (
    <div className="space-y-1 text-center group">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-amber-500 transition-colors">{label}</label>
      <input type="number" min="1" max="5" value={val} onChange={e => set(e.target.value)} className="w-full p-2 bg-slate-100 rounded-xl font-black text-center border-2 border-transparent focus:border-amber-500 outline-none" />
    </div>
  );
}
