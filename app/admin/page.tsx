// app/admin/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { 
  Camera, Loader2, Wine as WineIcon, Edit3, Download, Upload, LogOut, Save, ExternalLink, Plus, Minus, Trash2
} from 'lucide-react';

export default function AdminPage() {
  const [auth, setAuth] = useState({ id: '', pass: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialWineState = {
    id: '', name_jp: '', name_en: '', country: '', region: '', grape: '',
    color: '赤', type: 'フルボディ', vintage: '', price: '', cost: '', stock: '0',
    advice: '', aroma: '', pairing: '', sweetness: '3', body: '3', acidity: '3', tannin: '3', image: ''
  };

  const [newWine, setNewWine] = useState(initialWineState);

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
    const res = await fetch(`/api/wines`, { headers: { 'x-store-id': auth.id } });
    const data = await res.json();
    setWines(Array.isArray(data) ? data : []);
  };

  // CSVエクスポート
  const exportCSV = () => {
    const headers = "番号,カタカナ名,アルファベット,国,産地,品種,color,タイプ,年,販売価格,仕入れ値,在庫,オススメ解説,aroma,pairing,甘味,ボディ,酸味,タンニン,画像URL\n";
    const rows = wines.map((w: any) => 
      `"${w.id}","${w.name_jp}","${w.name_en}","${w.country}","${w.region}","${w.grape}","${w.color}","${w.type}","${w.vintage}","${w.price}","${w.cost}","${w.stock}","${(w.advice||'').replace(/"/g,'""')}","${w.aroma}","${w.pairing}","${w.sweetness}","${w.body}","${w.acidity}","${w.tannin}","${w.image}"`
    ).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `wine_list.csv`;
    link.click();
  };

  // CSVインポート
  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      const imported = lines.slice(1).map(line => {
        const c = line.split('","').map(s => s.replace(/"/g, ''));
        return {
          id: c[0] || Date.now().toString(), name_jp: c[1], name_en: c[2], country: c[3], region: c[4],
          grape: c[5], color: c[6], type: c[7], vintage: c[8], price: c[9], cost: c[10], stock: c[11],
          advice: c[12], aroma: c[13], pairing: c[14], sweetness: c[15], body: c[16], acidity: c[17], tannin: c[18], image: c[19]
        };
      });
      await fetch('/api/wines/bulk', { 
        method: 'POST', 
        headers: { 'x-store-id': auth.id }, 
        body: JSON.stringify(imported) 
      });
      fetchWines();
      alert("インポート完了");
    };
    reader.readAsText(file);
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
        method: 'POST', 
        body: JSON.stringify({ image: url }) 
      });
      const { result } = await scanRes.json();
      const ai = JSON.parse(result);
      setNewWine({ ...newWine, ...ai, image: url });
    } catch (err) { alert("解析失敗"); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    const res = await fetch('/api/wines', { 
      method: 'POST', 
      headers: { 'x-store-id': auth.id }, 
      body: JSON.stringify(newWine) 
    });
    if (res.ok) { setNewWine(initialWineState); setEditingId(null); fetchWines(); }
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <form onSubmit={(e:any) => { e.preventDefault(); setIsLoggedIn(true); localStorage.setItem('wine_store_id', auth.id); }} className="bg-white p-10 rounded-3xl w-full max-w-sm">
        <h1 className="text-2xl font-black mb-6 text-center text-black">ADMIN LOGIN</h1>
        <input type="text" placeholder="店舗ID" value={auth.id} onChange={e => setAuth({...auth, id: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl mb-4 text-black font-bold" />
        <button className="w-full bg-black text-white py-4 rounded-xl font-black">ログイン</button>
      </form>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6 bg-slate-50 min-h-screen text-black pb-24 font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black italic underline decoration-amber-500">STORE #{auth.id}</h1>
        <button onClick={() => {localStorage.clear(); location.reload();}} className="p-2 bg-white border rounded-xl shadow-sm text-slate-400"><LogOut size={20}/></button>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 mb-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <label className="aspect-[3/4] bg-slate-100 rounded-3xl overflow-hidden flex flex-col items-center justify-center relative cursor-pointer border-2 border-dashed border-slate-200 hover:border-black transition-all">
            {newWine.image ? <img src={newWine.image} className="w-full h-full object-cover" /> : <div className="text-center p-4"><Camera size={48} className="mx-auto mb-2 text-slate-300"/><p className="text-xs font-black text-slate-400">ラベルを撮影してAI分析</p></div>}
            {loading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="text-white animate-spin" size={48} /></div>}
            <input type="file" accept="image/*" capture="environment" onChange={handleScan} className="hidden" />
          </label>

          <div className="space-y-3">
            <input type="text" placeholder="ワイン名（日本語）" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-slate-100" />
            <input type="text" placeholder="Name (English)" value={newWine.name_en} onChange={e => setNewWine({...newWine, name_en: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-slate-100" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="国" value={newWine.country} onChange={e => setNewWine({...newWine, country: e.target.value})} className="p-3 bg-slate-50 rounded-xl font-bold border-2 border-slate-100" />
              <input type="text" placeholder="産地" value={newWine.region} onChange={e => setNewWine({...newWine, region: e.target.value})} className="p-3 bg-slate-50 rounded-xl font-bold border-2 border-slate-100" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="色（赤/白など）" value={newWine.color} onChange={e => setNewWine({...newWine, color: e.target.value})} className="p-3 bg-slate-50 rounded-xl font-bold border-2 border-slate-100" />
              <input type="text" placeholder="タイプ（重口など）" value={newWine.type} onChange={e => setNewWine({...newWine, type: e.target.value})} className="p-3 bg-slate-50 rounded-xl font-bold border-2 border-slate-100" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" placeholder="売価" value={newWine.price} onChange={e => setNewWine({...newWine, price: e.target.value})} className="p-3 bg-amber-50 rounded-xl font-bold border-2 border-amber-100" />
              <input type="number" placeholder="仕入" value={newWine.cost} onChange={e => setNewWine({...newWine, cost: e.target.value})} className="p-3 bg-slate-50 rounded-xl font-bold border-2 border-slate-100" />
              <input type="number" placeholder="在庫" value={newWine.stock} onChange={e => setNewWine({...newWine, stock: e.target.value})} className="p-3 bg-green-50 rounded-xl font-bold border-2 border-green-100" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-slate-100">
          {['sweetness', 'body', 'acidity', 'tannin'].map((key) => (
            <div key={key} className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">{key}</label>
              <input type="number" min="1" max="5" value={newWine[key as keyof typeof newWine]} onChange={e => setNewWine({...newWine, [key]: e.target.value})} className="w-full p-2 bg-slate-50 rounded-lg font-bold border border-slate-200" />
            </div>
          ))}
        </div>

        <textarea placeholder="ソムリエの解説" value={newWine.advice} onChange={e => setNewWine({...newWine, advice: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold h-24 border-2 border-slate-100" />
        
        <button onClick={handleSave} className="w-full bg-black text-white py-6 rounded-3xl font-black text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
          <Save size={24}/> {editingId ? '台帳を更新' : '新しく登録'}
        </button>
      </div>

      <div className="flex gap-2 mb-12">
        <button onClick={exportCSV} className="flex-1 bg-white border-2 border-slate-200 py-4 rounded-2xl font-black text-xs shadow-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"><Download size={16}/> CSV出力</button>
        <label className="flex-1 bg-white border-2 border-slate-200 py-4 rounded-2xl font-black text-xs shadow-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer">
          <Upload size={16}/> CSV取込
          <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {wines.map((wine: any) => (
          <div key={wine.id} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-md border border-slate-100 hover:border-amber-200 transition-all">
            <img src={wine.image} className="w-16 h-20 rounded-xl object-cover shadow-sm bg-slate-50" />
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm truncate">{wine.name_jp}</p>
              <p className="text-[10px] font-bold text-amber-600">¥{Number(wine.price).toLocaleString()} <span className="text-slate-300 ml-2">在庫: {wine.stock}</span></p>
            </div>
            <button onClick={() => {setNewWine(wine); setEditingId(wine.id); window.scrollTo({top:0, behavior:'smooth'});}} className="p-3 bg-slate-50 rounded-2xl text-slate-300 hover:text-black transition-colors"><Edit3 size={20}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}
