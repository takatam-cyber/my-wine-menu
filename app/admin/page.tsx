"use client";

import { useState, useEffect } from 'react';
import { Camera, Save, Loader2, Wine as WineIcon, Trash2, Edit3, Download, Upload, X, Plus, Minus, Sparkles } from 'lucide-react';

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
      const extractedName = result.replace(/Producer Name:|Vintage:/gi, '').trim();
      const extractedYear = result.match(/\d{4}/)?.[0] || '';
      setNewWine(prev => ({ ...prev, name_en: extractedName, vintage: extractedYear }));
    } catch (e) { alert("スキャン失敗"); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    const res = await fetch('/api/wines', { method: 'POST', body: JSON.stringify(newWine) });
    setNewWine({ id:'', name_jp:'', name_en:'', country:'', region:'', grape:'', type:'赤', vintage:'', price:'', cost:'', stock:'0', advice:'', image:'' });
    setEditingId(null);
    fetchWines();
    alert("台帳に保存しました");
  };

  const exportCSV = () => {
    const headers = "番号,カタカナ名,アルファベット,国,産地,品種,タイプ,年,販売価格,仕入れ値,在庫,オススメ解説,画像URL\n";
    const rows = wines.map((w: any) => `"${w.id}","${w.name_jp}","${w.name_en}","${w.country}","${w.region}","${w.grape}","${w.type}","${w.vintage}","${w.price}","${w.cost}","${w.stock}","${(w.advice||'').replace(/"/g,'""')}","${w.image}"`).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "wine_list_inventory.csv";
    link.click();
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split(/\r?\n/).slice(1);
      for (let row of rows) {
        if (!row.trim()) continue;
        const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"')) || [];
        if (cols.length >= 12) {
          await fetch('/api/wines', { method: 'POST', body: JSON.stringify({ 
            id: cols[0], name_jp: cols[1], name_en: cols[2], country: cols[3], region: cols[4], 
            grape: cols[5], type: cols[6], vintage: cols[7], price: cols[8], cost: cols[9], 
            stock: cols[10], advice: cols[11], image: cols[12] || ''
          }) });
        }
      }
      fetchWines();
      alert("CSV同期を完了しました");
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-slate-50 min-h-screen text-black pb-24 font-sans">
      {/* メインアクション：撮影ボタン */}
      <div className="sticky top-0 z-30 py-4 bg-slate-50/90 backdrop-blur">
        <label className="bg-black text-white w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all cursor-pointer">
          {loading ? <Loader2 className="animate-spin" /> : <Camera size={24}/>}
          <span className="text-lg">ラベルを撮って登録</span>
          <input type="file" accept="image/*" capture="environment" onChange={handleScan} className="hidden" />
        </label>
      </div>

      {/* 入力フォーム */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 mb-8 space-y-6">
        <div className="flex justify-between items-center px-2">
           <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">ID: {newWine.id ? `#${newWine.id}` : 'Auto Gen'}</span>
           {editingId && <button onClick={() => {setEditingId(null); setNewWine({id:'',name_jp:'',name_en:'',country:'',region:'',grape:'',type:'赤',vintage:'',price:'',cost:'',stock:'0',advice:'',image:''})}} className="text-slate-400"><X size={20}/></button>}
        </div>

        <div className="aspect-[3/4] bg-slate-100 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-50">
          {newWine.image ? <img src={newWine.image} className="w-full h-full object-cover" /> : <WineIcon className="text-slate-200" size={64}/>}
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">カタカナ名</label>
            <input type="text" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black text-lg border-2 border-slate-100 outline-none focus:border-black" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">English Name</label>
            <input type="text" value={newWine.name_en} onChange={e => setNewWine({...newWine, name_en: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100 outline-none focus:border-black" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">国</label>
              <input type="text" value={newWine.country} onChange={e => setNewWine({...newWine, country: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">産地</label>
              <input type="text" value={newWine.region} onChange={e => setNewWine({...newWine, region: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">主要品種</label>
              <input type="text" value={newWine.grape} onChange={e => setNewWine({...newWine, grape: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">タイプ</label>
              <select value={newWine.type} onChange={e => setNewWine({...newWine, type: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100 outline-none">
                <option value="赤">赤</option><option value="白">白</option><option value="泡">泡</option><option value="ロゼ">ロゼ</option><option value="甘口">甘口</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-amber-600 ml-1 uppercase">販売価格 (¥)</label>
              <input type="number" value={newWine.price} onChange={e => setNewWine({...newWine, price: e.target.value})} className="w-full p-4 bg-amber-50 rounded-xl text-black font-black border-2 border-amber-100 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">仕入れ値 (¥)</label>
              <input type="number" value={newWine.cost} onChange={e => setNewWine({...newWine, cost: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-green-600 ml-1 uppercase">在庫本数</label>
              <input type="number" value={newWine.stock} onChange={e => setNewWine({...newWine, stock: e.target.value})} className="w-full p-4 bg-green-50 rounded-xl text-black font-black border-2 border-green-100 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Vintage</label>
              <input type="text" value={newWine.vintage} onChange={e => setNewWine({...newWine, vintage: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black border-2 border-slate-100 outline-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-indigo-600 ml-1 uppercase tracking-tighter">Sommelier Note & Advice</label>
            <textarea placeholder="オススメ解説を入力" value={newWine.advice} onChange={e => setNewWine({...newWine, advice: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-black h-32 border-2 border-slate-100 outline-none focus:border-black" />
          </div>
        </div>

        <button onClick={handleSave} className="w-full bg-black text-white py-6 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all">
          保存して登録
        </button>
      </div>

      {/* CSVアクション */}
      <div className="flex gap-2 mb-12 px-2">
        <button onClick={exportCSV} className="flex-1 bg-white border border-slate-200 py-4 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 shadow-sm"><Download size={16}/> CSV出力</button>
        <label className="flex-1 bg-white border border-slate-200 py-4 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 shadow-sm cursor-pointer">
          <Upload size={16}/> CSV取込 <input type="file" onChange={importCSV} className="hidden" />
        </label>
      </div>

      {/* 在庫クイック管理リスト */}
      <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 px-2">Inventory Quick Update</h2>
      <div className="space-y-3">
        {wines.map((wine: any) => (
          <div key={wine.id} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm border border-slate-200">
            <img src={wine.image} className="w-16 h-16 rounded-2xl object-cover border border-slate-50 shadow-inner" />
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm truncate">#{wine.id} {wine.name_jp || 'No Name'}</p>
              <p className="text-[10px] font-black text-amber-600">¥{Number(wine.price).toLocaleString()} <span className="text-slate-300 ml-1">/ Cost ¥{Number(wine.cost).toLocaleString()}</span></p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
              <button onClick={() => updateStock(wine, -1)} className="p-1"><Minus size={18}/></button>
              <span className={`font-black text-lg w-6 text-center ${parseInt(wine.stock) <= 0 ? 'text-red-500' : 'text-black'}`}>{wine.stock}</span>
              <button onClick={() => updateStock(wine, 1)} className="p-1"><Plus size={18}/></button>
            </div>
            <button onClick={() => {setNewWine(wine); setEditingId(wine.id); window.scrollTo({top:0, behavior:'smooth'})}} className="p-2 text-slate-300 hover:text-black transition-colors"><Edit3 size={20}/></button>
            <button onClick={async () => { if(confirm("削除？")) { await fetch('/api/wines', {method:'DELETE', body:JSON.stringify({id:wine.id})}); fetchWines(); } }} className="p-2 text-red-100 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}
