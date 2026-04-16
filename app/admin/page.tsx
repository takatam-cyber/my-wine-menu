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
    alert("保存しました");
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-slate-50 min-h-screen font-sans text-black pb-20">
      {/* 固定ヘッダー風カメラボタン */}
      <div className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md py-4 mb-6">
        <label className="bg-black text-white w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all cursor-pointer">
          {loading ? <Loader2 className="animate-spin" /> : <Camera size={24}/>}
          <span className="text-lg">{loading ? "分析中..." : "カメラでワインを登録"}</span>
          <input type="file" accept="image/*" capture="environment" onChange={handleScan} className="hidden" />
        </label>
      </div>

      {/* 入力エリア */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-200 mb-8 space-y-6">
        <div className="aspect-[3/4] bg-slate-100 rounded-3xl overflow-hidden relative">
          {newWine.image ? <img src={newWine.image} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center justify-center h-full text-slate-300"><WineIcon size={48}/><p className="text-[10px] font-bold mt-2">NO IMAGE</p></div>}
          {editingId && <button onClick={() => setEditingId(null)} className="absolute top-4 right-4 bg-white/80 p-2 rounded-full"><X size={20}/></button>}
        </div>

        <div className="space-y-4">
          <input type="text" placeholder="カタカナ名 (例: バロナーク)" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-bold text-lg border-2 border-slate-100 focus:border-black outline-none" />
          <input type="text" placeholder="English Name" value={newWine.name_en} onChange={e => setNewWine({...newWine, name_en: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-bold border-2 border-slate-100 outline-none" />
          
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="国" value={newWine.country} onChange={e => setNewWine({...newWine, country: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-bold border-2 border-slate-100 outline-none" />
            <input type="text" placeholder="産地" value={newWine.region} onChange={e => setNewWine({...newWine, region: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-bold border-2 border-slate-100 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="品種" value={newWine.grape} onChange={e => setNewWine({...newWine, grape: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-bold border-2 border-slate-100 outline-none" />
            <select value={newWine.type} onChange={e => setNewWine({...newWine, type: e.target.value})} className="p-4 bg-slate-50 rounded-xl text-black font-bold border-2 border-slate-100 outline-none">
              <option value="赤">赤</option><option value="白">白</option><option value="泡">泡</option><option value="ロゼ">ロゼ</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-amber-600 ml-2">販売価格</label>
              <input type="number" value={newWine.price} onChange={e => setNewWine({...newWine, price: e.target.value})} className="w-full p-4 bg-amber-50 rounded-xl text-black font-bold border-2 border-amber-100" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 ml-2">仕入れ値</label>
              <input type="number" value={newWine.cost} onChange={e => setNewWine({...newWine, cost: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-bold border-2 border-slate-100" />
            </div>
          </div>

          <textarea placeholder="ソムリエのオススメコメント" value={newWine.advice} onChange={e => setNewWine({...newWine, advice: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-bold h-24 border-2 border-slate-100 outline-none" />
        </div>

        <button onClick={handleSave} className="w-full bg-black text-white py-5 rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all">保存して台帳に登録</button>
      </div>

      {/* 在庫一覧 (スマホで見やすいリスト形式) */}
      <h2 className="font-black mb-4 ml-2 text-slate-400 uppercase tracking-widest text-xs">Cellar Inventory</h2>
      <div className="space-y-3">
        {wines.map((wine: any) => (
          <div key={wine.id} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm border border-slate-100">
            <img src={wine.image} className="w-16 h-16 rounded-2xl object-cover" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{wine.name_jp || '名称未設定'}</p>
              <p className="text-[10px] font-bold text-amber-600">¥{Number(wine.price).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
              <button onClick={() => updateStock(wine, -1)} className="p-1"><Minus size={18}/></button>
              <span className={`font-black text-lg w-6 text-center ${parseInt(wine.stock) <= 0 ? 'text-red-500' : 'text-black'}`}>{wine.stock}</span>
              <button onClick={() => updateStock(wine, 1)} className="p-1"><Plus size={18}/></button>
            </div>
            <button onClick={() => {setNewWine(wine); setEditingId(wine.id); window.scrollTo(0,0)}} className="p-1 text-slate-300"><Edit3 size={20}/></button>
          </div>
        ))}
      </div>
      
      {/* CSV出力ボタン (下の方に配置) */}
      <div className="mt-10 flex gap-2">
        <button onClick={() => {/* exportCSVロジック */}} className="flex-1 bg-white border border-slate-200 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 text-slate-500"><Download size={14}/> CSV出力</button>
      </div>
    </div>
  );
}
