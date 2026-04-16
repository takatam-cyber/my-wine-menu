"use client";

import { useState, useEffect } from 'react';
import { Camera, Save, Loader2, Wine as WineIcon, Trash2, Edit3, Download, Upload, X, Plus, Minus } from 'lucide-react';

export default function AdminPage() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newWine, setNewWine] = useState({
    name_jp: '', name_en: '', country: '', region: '', grape: '', type: '赤', 
    vintage: '', price: '', cost: '', stock: '0', advice: '', image: ''
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
      setNewWine(prev => ({ ...prev, name_en: result.split(',')[0], vintage: result.match(/\d{4}/)?.[0] || '' }));
    } catch (e) { alert("スキャン失敗"); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    const id = editingId || Date.now().toString();
    await fetch('/api/wines', { method: 'POST', body: JSON.stringify({ ...newWine, id }) });
    setNewWine({ name_jp:'', name_en:'', country:'', region:'', grape:'', type:'赤', vintage:'', price:'', cost:'', stock:'0', advice:'', image:'' });
    setEditingId(null);
    fetchWines();
  };

  const exportCSV = () => {
    const headers = "ID,カタカナ名,アルファベット,国,産地,品種,タイプ,年,販売価格,仕入れ値,在庫,コメント,画像URL\n";
    const rows = wines.map((w: any) => `"${w.id}","${w.name_jp}","${w.name_en}","${w.country}","${w.region}","${w.grape}","${w.type}","${w.vintage}","${w.price}","${w.cost}","${w.stock}","${(w.advice||'').replace(/"/g,'""')}","${w.image}"`).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: 'text/csv' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "wine_inventory_master.csv";
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
        if (cols.length >= 13) {
          await fetch('/api/wines', { method: 'POST', body: JSON.stringify({ 
            id: cols[0], name_jp: cols[1], name_en: cols[2], country: cols[3], region: cols[4], 
            grape: cols[5], type: cols[6], vintage: cols[7], price: cols[8], cost: cols[9], 
            stock: cols[10], advice: cols[11], image: cols[12] 
          }) });
        }
      }
      fetchWines(); alert("CSVインポート完了");
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-slate-100 min-h-screen font-sans text-black">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black">在庫・台帳管理（プロ版）</h1>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="bg-white px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2"><Download size={16}/> CSV出力</button>
          <label className="bg-white px-4 py-2 rounded-lg font-bold shadow-sm cursor-pointer flex items-center gap-2"><Upload size={16}/> CSV取込<input type="file" onChange={importCSV} className="hidden" /></label>
          <label className="bg-black text-white px-6 py-2 rounded-lg font-bold cursor-pointer flex items-center gap-2 transition">
            {loading ? <Loader2 className="animate-spin" /> : <Camera size={18}/>} スキャン登録
            <input type="file" onChange={handleScan} className="hidden" />
          </label>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-md mb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">カタカナ名</label>
                <input type="text" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-3 bg-slate-50 rounded-lg text-black font-bold border-2 border-slate-200 outline-none focus:border-black" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">アルファベット表記</label>
                <input type="text" value={newWine.name_en} onChange={e => setNewWine({...newWine, name_en: e.target.value})} className="w-full p-3 bg-slate-50 rounded-lg text-black font-bold border-2 border-slate-200 outline-none focus:border-black" />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <input type="text" placeholder="国" value={newWine.country} onChange={e => setNewWine({...newWine, country: e.target.value})} className="p-3 bg-slate-50 rounded-lg text-black font-bold border-2 border-slate-200" />
              <input type="text" placeholder="産地" value={newWine.region} onChange={e => setNewWine({...newWine, region: e.target.value})} className="p-3 bg-slate-50 rounded-lg text-black font-bold border-2 border-slate-200" />
              <input type="text" placeholder="品種" value={newWine.grape} onChange={e => setNewWine({...newWine, grape: e.target.value})} className="p-3 bg-slate-50 rounded-lg text-black font-bold border-2 border-slate-200" />
              <select value={newWine.type} onChange={e => setNewWine({...newWine, type: e.target.value})} className="p-3 bg-slate-50 rounded-lg text-black font-bold border-2 border-slate-200">
                <option value="赤">赤</option><option value="白">白</option><option value="泡">泡</option><option value="ロゼ">ロゼ</option><option value="甘口">甘口</option>
              </select>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-600">販売価格</label>
                <input type="number" value={newWine.price} onChange={e => setNewWine({...newWine, price: e.target.value})} className="w-full p-3 bg-amber-50 rounded-lg text-black font-bold border-2 border-amber-200" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">仕入れ値 (非公開)</label>
                <input type="number" value={newWine.cost} onChange={e => setNewWine({...newWine, cost: e.target.value})} className="w-full p-3 bg-slate-50 rounded-lg text-black font-bold border-2 border-slate-200" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-green-600">在庫本数</label>
                <input type="number" value={newWine.stock} onChange={e => setNewWine({...newWine, stock: e.target.value})} className="w-full p-3 bg-green-50 rounded-lg text-black font-bold border-2 border-green-200" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">ヴィンテージ</label>
                <input type="text" value={newWine.vintage} onChange={e => setNewWine({...newWine, vintage: e.target.value})} className="w-full p-3 bg-slate-50 rounded-lg text-black font-bold border-2 border-slate-200" />
              </div>
            </div>

            <textarea placeholder="味わい ＆ オススメコメント" value={newWine.advice} onChange={e => setNewWine({...newWine, advice: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-bold h-24 border-2 border-slate-200" />
          </div>

          <div className="bg-slate-100 rounded-[2rem] border-4 border-dashed border-white flex items-center justify-center overflow-hidden shadow-inner">
            {newWine.image ? <img src={newWine.image} className="w-full h-full object-cover" /> : <WineIcon className="text-white" size={64} />}
          </div>
        </div>
        <button onClick={handleSave} className="w-full mt-8 bg-black text-white py-5 rounded-2xl font-black text-xl active:scale-[0.98] transition shadow-lg">保存して台帳を更新する</button>
      </div>

      <div className="space-y-3">
        {wines.map((wine: any) => (
          <div key={wine.id} className="bg-white p-4 rounded-2xl flex items-center gap-6 shadow-sm border border-slate-200 group">
            <img src={wine.image} className="w-14 h-14 rounded-xl object-cover" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded font-black">{wine.type}</span>
                <p className="font-bold text-slate-900">{wine.name_jp || '未設定'}</p>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">{wine.name_en} | {wine.country} {wine.region}</p>
            </div>
            <div className="text-right px-4 border-l">
              <p className="text-[10px] font-bold text-slate-400">仕入れ: ¥{Number(wine.cost).toLocaleString()}</p>
              <p className="text-sm font-black text-amber-600">売価: ¥{Number(wine.price).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <button onClick={() => updateStock(wine, -1)} className="p-1 hover:bg-white rounded shadow-sm transition"><Minus size={16}/></button>
              <span className={`font-black w-8 text-center text-lg ${parseInt(wine.stock) <= 0 ? 'text-red-500' : 'text-black'}`}>{wine.stock}</span>
              <button onClick={() => updateStock(wine, 1)} className="p-1 hover:bg-white rounded shadow-sm transition"><Plus size={16}/></button>
            </div>
            <button onClick={() => {setNewWine(wine); setEditingId(wine.id); window.scrollTo(0,0)}} className="p-2 text-slate-400 hover:text-black"><Edit3 size={20}/></button>
            <button onClick={async () => { if(confirm("削除？")) { await fetch('/api/wines', {method:'DELETE', body:JSON.stringify({id:wine.id})}); fetchWines(); } }} className="p-2 text-red-200 hover:text-red-600"><Trash2 size={20}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}
