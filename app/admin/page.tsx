"use client";

import { useState, useEffect } from 'react';
import { Camera, Save, Loader2, Wine as WineIcon, Trash2, Edit3, Download, Upload, X, Plus, Minus, Sparkles } from 'lucide-react';

export default function AdminPage() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newWine, setNewWine] = useState({
    name_jp: '', vintage: '', price: '', stock: '0', advice: '', image: ''
  });

  useEffect(() => { fetchWines(); }, []);

  const fetchWines = async () => {
    const res = await fetch('/api/wines');
    const data = await res.json();
    setWines(Array.isArray(data) ? data : []);
  };

  const updateStock = async (wine: any, delta: number) => {
    const updated = { ...wine, stock: String(Math.max(0, (parseInt(wine.stock) || 0) + delta)) };
    await fetch('/api/wines', { method: 'POST', body: JSON.stringify(updated) });
    fetchWines();
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { url } = await (await fetch('/api/upload', { method: 'POST', body: formData })).json();
      setNewWine(prev => ({ ...prev, image: url }));

      const { result } = await (await fetch('/api/scan', { method: 'POST', body: JSON.stringify({ image: url }) })).json();
      setNewWine(prev => ({ ...prev, name_jp: result.split('\n')[0], vintage: result.match(/\d{4}/)?.[0] || '' }));
    } catch (e) { alert("スキャン失敗"); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    const id = editingId || Date.now().toString();
    await fetch('/api/wines', { method: 'POST', body: JSON.stringify({ ...newWine, id }) });
    setNewWine({ name_jp:'', vintage:'', price:'', stock:'0', advice:'', image:'' });
    setEditingId(null);
    fetchWines();
  };

  const exportCSV = () => {
    const headers = "ID,名前,年,価格,在庫,ソムリエアドバイス,画像URL\n";
    const rows = wines.map((w: any) => `"${w.id}","${w.name_jp}","${w.vintage}","${w.price}","${w.stock}","${(w.advice||'').replace(/"/g,'""')}","${w.image}"`).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\ufeff" + headers + rows], { type: 'text/csv' }));
    link.download = "wine_inventory.csv";
    link.click();
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rows = (event.target?.result as string).split("\n").slice(1);
      for (let row of rows) {
        const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(c => c.replace(/^"|"$/g, '')) || [];
        if (cols.length >= 7) {
          await fetch('/api/wines', { method: 'POST', body: JSON.stringify({ id: cols[0], name_jp: cols[1], vintage: cols[2], price: cols[3], stock: cols[4], advice: cols[5], image: cols[6] }) });
        }
      }
      fetchWines();
      alert("CSV同期完了");
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white min-h-screen font-sans">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-bold tracking-tighter">在庫・台帳管理</h1>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="border px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Download size={16}/> 出力</button>
          <label className="border px-4 py-2 rounded-lg text-sm font-bold cursor-pointer flex items-center gap-2">
            <Upload size={16}/> 取込 <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
          </label>
          <label className="bg-black text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 cursor-pointer transition">
            {loading ? <Loader2 className="animate-spin" /> : <Camera size={18}/>} スキャン登録
            <input type="file" accept="image/*" onChange={handleScan} className="hidden" />
          </label>
        </div>
      </div>

      <div className="bg-slate-50 p-8 rounded-3xl mb-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <input type="text" placeholder="ワイン名" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-4 rounded-xl border-none font-bold text-lg shadow-sm" />
          <div className="grid grid-cols-3 gap-4">
            <input type="text" placeholder="価格" value={newWine.price} onChange={e => setNewWine({...newWine, price: e.target.value})} className="p-4 rounded-xl border-none font-bold shadow-sm" />
            <input type="number" placeholder="在庫" value={newWine.stock} onChange={e => setNewWine({...newWine, stock: e.target.value})} className="p-4 rounded-xl border-none font-bold shadow-sm" />
            <input type="text" placeholder="年" value={newWine.vintage} onChange={e => setNewWine({...newWine, vintage: e.target.value})} className="p-4 rounded-xl border-none font-bold shadow-sm" />
          </div>
          <textarea placeholder="ソムリエのアドバイス（お客様向け）" value={newWine.advice} onChange={e => setNewWine({...newWine, advice: e.target.value})} className="w-full p-4 rounded-xl border-none font-bold h-24 shadow-sm" />
        </div>
        <div className="bg-white rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden">
          {newWine.image ? <img src={newWine.image} className="w-full h-full object-cover" /> : <WineIcon className="text-slate-200" size={48} />}
        </div>
        <button onClick={handleSave} className="md:col-span-3 bg-black text-white py-4 rounded-xl font-bold text-lg">保存する</button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {wines.map((wine: any) => (
          <div key={wine.id} className="bg-white p-4 border rounded-2xl flex items-center gap-6 shadow-sm">
            <img src={wine.image} className="w-16 h-16 rounded-lg object-cover" />
            <div className="flex-1">
              <p className="font-bold text-slate-800">{wine.name_jp}</p>
              <p className="text-sm text-slate-400 font-bold uppercase">Vintage: {wine.vintage} / ¥{Number(wine.price).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-xl">
              <button onClick={() => updateStock(wine, -1)} className="p-1 hover:bg-white rounded shadow-sm"><Minus size={16}/></button>
              <span className="font-black w-8 text-center">{wine.stock}</span>
              <button onClick={() => updateStock(wine, 1)} className="p-1 hover:bg-white rounded shadow-sm"><Plus size={16}/></button>
            </div>
            <button onClick={() => {setNewWine(wine); setEditingId(wine.id); window.scrollTo(0,0)}} className="p-2 text-slate-400 hover:text-black"><Edit3 size={20}/></button>
            <button onClick={async () => { if(confirm("削除？")) { await fetch('/api/wines', {method:'DELETE', body:JSON.stringify({id:wine.id})}); fetchWines(); } }} className="p-2 text-red-300 hover:text-red-600"><Trash2 size={20}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}
