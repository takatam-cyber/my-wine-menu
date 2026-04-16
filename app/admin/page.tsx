"use client";

import { useState, useEffect } from 'react';
import { Camera, Save, Loader2, Wine as WineIcon, Trash2, Edit3, Download, Upload, X, Plus, Minus } from 'lucide-react';

export default function AdminPage() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newWine, setNewWine] = useState({
    id: '', name_jp: '', name_en: '', country: '', region: '', grape: '', type: '赤', 
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
      // ラベル文字をそのまま英語名に入れる（余計な文字を削除）
      setNewWine(prev => ({ ...prev, name_en: result.replace(/Producer Name:|Vintage:/gi, '').trim(), vintage: result.match(/\d{4}/)?.[0] || '' }));
    } catch (e) { alert("スキャン失敗"); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    const res = await fetch('/api/wines', { method: 'POST', body: JSON.stringify(newWine) });
    setNewWine({ id:'', name_jp:'', name_en:'', country:'', region:'', grape:'', type:'赤', vintage:'', price:'', cost:'', stock:'0', advice:'', image:'' });
    setEditingId(null);
    fetchWines();
  };

  const exportCSV = () => {
    const headers = "番号,カタカナ名,アルファベット,国,産地,品種,タイプ,年,販売価格,仕入れ値,在庫,オススメ解説,画像URL\n";
    const rows = wines.map((w: any) => `"${w.id}","${w.name_jp}","${w.name_en}","${w.country}","${w.region}","${w.grape}","${w.type}","${w.vintage}","${w.price}","${w.cost}","${w.stock}","${(w.advice||'').replace(/"/g,'""')}","${w.image}"`).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "wine_list.csv";
    link.click();
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rows = (event.target?.result as string).split("\n").slice(1);
      for (let row of rows) {
        const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"')) || [];
        if (cols.length >= 13) {
          await fetch('/api/wines', { method: 'POST', body: JSON.stringify({ 
            id: cols[0], name_jp: cols[1], name_en: cols[2], country: cols[3], region: cols[4], 
            grape: cols[5], type: cols[6], vintage: cols[7], price: cols[8], cost: cols[9], 
            stock: cols[10], advice: cols[11], image: cols[12] 
          }) });
        }
      }
      fetchWines(); alert("台帳を更新しました");
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-slate-50 min-h-screen font-sans text-black pb-24">
      {/* 撮影ボタン */}
      <div className="sticky top-0 z-30 py-4">
        <label className="bg-black text-white w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
          {loading ? <Loader2 className="animate-spin" /> : <Camera size={24}/>}
          <span className="text-lg">ラベルを撮る</span>
          <input type="file" accept="image/*" capture="environment" onChange={handleScan} className="hidden" />
        </label>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mb-8 space-y-6">
        <div className="flex justify-between items-center">
           <span className="text-slate-400 font-black">ID: {newWine.id ? `#${newWine.id}` : '新規発行'}</span>
           {editingId && <button onClick={() => {setEditingId(null); setNewWine({id:'',name_jp:'',name_en:'',country:'',region:'',grape:'',type:'赤',vintage:'',price:'',cost:'',stock:'0',advice:'',image:''})}} className="text-slate-400"><X size={20}/></button>}
        </div>

        <div className="aspect-[3/4] bg-slate-100 rounded-3xl overflow-hidden shadow-inner">
          {newWine.image ? <img src={newWine.image} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center justify-center h-full text-slate-300"><WineIcon size={48}/><p className="text-[10px] font-bold mt-2 tracking-widest uppercase">No Image</p></div>}
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">カタカナ名</label>
            <input type="text" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-bold text-lg border-2 border-slate-100 outline-none focus:border-black" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alphabet Name</label>
            <input type="text" value={newWine.name_en} onChange={e => setNewWine({...newWine, name_en: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-bold border-2 border-slate-100 outline-none" />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="国" value={newWine.country} onChange={e => setNewWine({...newWine, country: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-bold border-2 border-slate-100 outline-none" />
            <input type="text" placeholder="産地" value={newWine.region} onChange={e => setNewWine({...newWine, region: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-bold border-2 border-slate-100 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="品種" value={newWine.grape} onChange={e => setNewWine({...newWine, grape: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-bold border-2 border-slate-100 outline-none" />
            <select value={newWine.type} onChange={e => setNewWine({...newWine, type: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-bold border-2 border-slate-100 outline-none">
              <option value="赤">赤</option><option value="白">白</option><option value="泡">泡</option><option value="ロゼ">ロゼ</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-amber-600 ml-1">販売価格 (¥)</label>
              <input type="number" value={newWine.price} onChange={e => setNewWine({...newWine, price: e.target.value})} className="w-full p-4 bg-amber-50 rounded-xl text-black font-black border-2 border-amber-100" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 ml-1">仕入れ値 (¥)</label>
              <input type="number" value={newWine.cost} onChange={e => setNewWine({...newWine, cost: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-bold border-2 border-slate-100" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-green-600 ml-1">在庫本数</label>
              <input type="number" value={newWine.stock} onChange={e => setNewWine({...newWine, stock: e.target.value})} className="w-full p-4 bg-green-50 rounded-xl text-black font-black border-2 border-green-100" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 ml-1">Vintage</label>
              <input type="text" value={newWine.vintage} onChange={e => setNewWine({...newWine, vintage: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-bold border-2 border-slate-100" />
            </div>
          </div>

          <textarea placeholder="ソムリエの解説コメント" value={newWine.advice} onChange={e => setNewWine({...newWine, advice: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-bold h-24 border-2 border-slate-100 outline-none" />
        </div>

        <button onClick={handleSave} className="w-full bg-black text-white py-5 rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all">保存する</button>
      </div>

      <div className="flex gap-2 mb-10">
        <button onClick={exportCSV} className="flex-1 bg-white border border-slate-200 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2"><Download size={14}/> CSV出力</button>
        <label className="flex-1 bg-white border border-slate-200 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer">
          <Upload size={14}/> CSV取込 <input type="file" onChange={importCSV} className="hidden" />
        </label>
      </div>

      <div className="space-y-3">
        {wines.map((wine: any) => (
          <div key={wine.id} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm border border-slate-200">
            <img src={wine.image} className="w-16 h-16 rounded-2xl object-cover" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">#{wine.id} {wine.name_jp || '名称未設定'}</p>
              <p className="text-[10px] font-bold text-amber-600">¥{Number(wine.price).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl">
              <button onClick={() => updateStock(wine, -1)} className="p-1"><Minus size={18}/></button>
              <span className={`font-black text-lg w-6 text-center ${parseInt(wine.stock) <= 0 ? 'text-red-500' : 'text-black'}`}>{wine.stock}</span>
              <button onClick={() => updateStock(wine, 1)} className="p-1"><Plus size={18}/></button>
            </div>
            <button onClick={() => {setNewWine(wine); setEditingId(wine.id); window.scrollTo(0,0)}} className="p-1 text-slate-300"><Edit3 size={20}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}
