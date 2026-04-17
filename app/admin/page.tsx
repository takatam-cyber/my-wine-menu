// app/admin/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { 
  Camera, Loader2, Wine as WineIcon, Edit3, LogOut, Save, Mail, Lock, Trash2, Settings, ChevronRight, Download, Upload, FileDown, FileUp
} from 'lucide-react';

export default function AdminPage() {
  const [auth, setAuth] = useState({ email: '', pass: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [config, setConfig] = useState({ menu_name: '' });
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // CSV A-W(23項目) + X(画像URL) = 計24列に対応
  const initialWineState = {
    id: '', name_jp: '', name_en: '', color: '赤', type: 'ミディアム',
    price_glass: '', price_bottle: '', cost: '', stock: '1', country: '',
    region: '', grape: '', vintage: '', producer: '', advice: '',
    pairing: '', sweetness: '3', body: '3', acidity: '3', tannin: '3',
    aroma: '3', memo: '', reserved: '', image: '' // imageを最後(X列相当)に配置
  };
  const [newWine, setNewWine] = useState(initialWineState);

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

  // 画像を1200px/60%画質で極限まで圧縮
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const MAX = 1200;
        if (width > height && width > MAX) { height *= MAX / width; width = MAX; }
        else if (height > MAX) { width *= MAX / height; height = MAX; }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((b) => resolve(b as Blob), 'image/jpeg', 0.6);
      };
    });
  };

  // CSVエクスポート (A-X列)
  const exportCSV = () => {
    const headers = "id,name_jp,name_en,color,type,price_glass,price_bottle,cost,stock,country,region,grape,vintage,producer,advice,pairing,sweetness,body,acidity,tannin,aroma,memo,reserved,image_url\n";
    const csvContent = wines.map((w: any) => 
      `${w.id},"${w.name_jp}","${w.name_en}",${w.color},${w.type},${w.price_glass},${w.price_bottle},${w.cost},${w.stock},"${w.country}","${w.region}","${w.grape}",${w.vintage},"${w.producer}","${(w.advice||'').replace(/"/g,'""')}","${w.pairing}",${w.sweetness},${w.body},${w.acidity},${w.tannin},${w.aroma},"${w.memo}","","${w.image}"`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `wine_list_full.csv`;
    link.click();
  };

  // CSVインポート (A-X列)
  const importCSV = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split("\n").filter(l => l.trim()).slice(1);
        const imported = rows.map(row => {
          const c = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/^"|"$/g, '').replace(/""/g, '"'));
          return {
            id: c[0] || Date.now().toString(), name_jp: c[1], name_en: c[2], color: c[3], type: c[4],
            price_glass: c[5], price_bottle: c[6], cost: c[7], stock: c[8], country: c[9],
            region: c[10], grape: c[11], vintage: c[12], producer: c[13], advice: c[14],
            pairing: c[15], sweetness: c[16], body: c[17], acidity: c[18], tannin: c[19],
            aroma: c[20], memo: c[21], reserved: c[22], image: c[23] // X列をimageとして取り込み
          };
        });
        if (confirm(`${imported.length}件を一括更新しますか？`)) {
          setLoading(true);
          await fetch('/api/wines/bulk', { method: 'POST', headers: { 'x-store-id': auth.email }, body: JSON.stringify(imported) });
          fetchWines();
        }
      } catch (err) { alert("CSV解析エラー"); } finally { setLoading(false); }
    };
    reader.readAsText(file);
  };

  const handleScan = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const compressedBlob = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressedBlob, 'wine.jpg');
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const { url } = await uploadRes.json();
      setNewWine(prev => ({ ...prev, image: url }));

      const scanRes = await fetch('/api/scan', { method: 'POST', headers: { 'x-store-id': auth.email }, body: JSON.stringify({ image: url }) });
      const scanData = await scanRes.json();
      if (scanData.result && scanData.result !== "{}") {
        const ai = JSON.parse(scanData.result);
        setNewWine(prev => ({ ...prev, name_en: ai.name_en, color: ai.color }));
      }
    } catch (err) { alert("解析失敗"); } finally { setLoading(false); }
  };

  const handleSaveWine = async () => {
    await fetch('/api/wines', { method: 'POST', headers: { 'x-store-id': auth.email }, body: JSON.stringify(newWine) });
    setNewWine(initialWineState); setEditingId(null); fetchWines();
    alert("保存完了");
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl text-black">
        <h1 className="text-3xl font-black mb-8 text-center uppercase tracking-tighter">Login</h1>
        <form onSubmit={(e:any) => { e.preventDefault(); setIsLoggedIn(true); localStorage.setItem('wine_store_email', auth.email); }} className="space-y-4">
          <input type="email" placeholder="Email" value={auth.email} onChange={e => setAuth({...auth, email: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-bold outline-none" required />
          <input type="password" placeholder="Pass" value={auth.pass} onChange={e => setAuth({...auth, pass: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-bold outline-none" required />
          <button className="w-full bg-black text-white py-5 rounded-2xl font-black">ログイン</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6 bg-slate-50 min-h-screen text-black pb-24 font-sans">
      <div className="flex justify-between items-center mb-8 px-2">
        <h1 className="text-lg font-black truncate">{auth.email}</h1>
        <button onClick={() => {localStorage.clear(); location.reload();}} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 active:text-red-500"><LogOut size={20}/></button>
      </div>

      <div className="flex gap-2 mb-8">
        <button onClick={exportCSV} className="flex-1 bg-white border-2 border-slate-200 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm active:bg-slate-50 transition-all"><FileDown size={18}/> CSV出力</button>
        <label className="flex-1 bg-white border-2 border-slate-200 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm cursor-pointer active:bg-slate-50 transition-all">
          <FileUp size={18}/> CSV読込<input type="file" accept=".csv" onChange={importCSV} className="hidden" />
        </label>
      </div>

      <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 mb-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <label className="aspect-[3/4] bg-slate-100 rounded-3xl overflow-hidden flex flex-col items-center justify-center relative cursor-pointer border-4 border-dashed group">
            {newWine.image ? <img src={newWine.image} className="w-full h-full object-cover" /> : <div className="text-center"><Camera size={48} className="mx-auto text-slate-200 mb-2"/><p className="text-[10px] font-black text-slate-300 uppercase">Select Photo</p></div>}
            {loading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="text-white animate-spin" size={48} /></div>}
            {/* captureを削除し、フォトライブラリから選択可能に */}
            <input type="file" accept="image/*" onChange={handleScan} className="hidden" />
          </label>
          <div className="space-y-3">
            <select value={newWine.color} onChange={e => setNewWine({...newWine, color: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-black">
              <option value="赤">Red</option><option value="白">White</option><option value="ロゼ">Rosé</option><option value="泡">Sparkling</option>
            </select>
            <input type="text" placeholder="名前 (日本語)" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-2" />
            <input type="text" placeholder="生産者" value={newWine.producer} onChange={e => setNewWine({...newWine, producer: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-2" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" placeholder="グラス ¥" value={newWine.price_glass} onChange={e => setNewWine({...newWine, price_glass: e.target.value})} className="p-3 bg-amber-50 rounded-xl font-bold" />
              <input type="number" placeholder="ボトル ¥" value={newWine.price_bottle} onChange={e => setNewWine({...newWine, price_bottle: e.target.value})} className="p-3 bg-amber-50 rounded-xl font-bold" />
            </div>
            <textarea placeholder="ソムリエの解説" value={newWine.advice} onChange={e => setNewWine({...newWine, advice: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold h-32 border-2 resize-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-50">
          <FlavorField label="Sweet" val={newWine.sweetness} set={(v:any) => setNewWine({...newWine, sweetness: v})} />
          <FlavorField label="Body" val={newWine.body} set={(v:any) => setNewWine({...newWine, body: v})} />
          <FlavorField label="Acidity" val={newWine.acidity} set={(v:any) => setNewWine({...newWine, acidity: v})} />
          <FlavorField label={newWine.color === '赤' ? 'Tannin' : 'Aroma'} val={newWine.color === '赤' ? newWine.tannin : newWine.aroma} set={(v:any) => setNewWine(newWine.color==='赤' ? {...newWine, tannin: v} : {...newWine, aroma: v})} />
        </div>

        <button onClick={handleSaveWine} className="w-full bg-black text-white py-6 rounded-3xl font-black text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
          <Save size={24}/>台帳に登録
        </button>
      </div>
      {/* リスト表示部分(略) */}
    </div>
  );
}

function FlavorField({ label, val, set }: any) {
  return (
    <div className="space-y-1 text-center">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{label}</label>
      <input type="number" min="1" max="5" value={val} onChange={e => set(e.target.value)} className="w-full p-2 bg-slate-100 rounded-xl font-black text-center border-2 border-transparent focus:border-amber-500 outline-none" />
    </div>
  );
}
