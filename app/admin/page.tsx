"use client";

import { useState, useEffect } from 'react';
import { Camera, Save, Loader2, Wine as WineIcon, Trash2, Edit3, Download, X, Utensils, Sparkles, Plus, Minus } from 'lucide-react';

export default function AdminPage() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newWine, setNewWine] = useState({
    name_jp: '', name_en: '', country: '', region: '', grape: '', vintage: '', 
    price: '', pairing: '', advice: '', description: '', taste: '', image: '', stock: '0'
  });

  useEffect(() => { fetchWines(); }, []);

  const fetchWines = async () => {
    const res = await fetch('/api/wines');
    const data = await res.json();
    setWines(Array.isArray(data) ? data : []);
  };

  const updateStock = async (wine: any, delta: number) => {
    const updatedStock = Math.max(0, (parseInt(wine.stock) || 0) + delta);
    const updatedWine = { ...wine, stock: String(updatedStock) };
    await fetch('/api/wines', { method: 'POST', body: JSON.stringify(updatedWine) });
    fetchWines();
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const { url } = await uploadRes.json();
      setNewWine(prev => ({ ...prev, image: url }));

      const scanRes = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: url }) });
      const data = await scanRes.json();
      
      // --- 強力なゴミ掃除ロジック ---
      let rawText = String(data.result || "").replace(/\\_/g, '_');
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1) throw new Error("JSONが見つかりません");
      const jsonString = rawText.substring(firstBrace, lastBrace + 1);
      const result = JSON.parse(jsonString);

      setNewWine(prev => ({
        ...prev,
        name_jp: result.name_jp || '',
        name_en: result.name_en || '',
        country: result.country || '',
        region: result.region || '',
        vintage: String(result.vintage || ''),
        price: String(result.price || ''),
        pairing: result.pairing || '',
        advice: result.advice || '',
        taste: result.taste || '',
        description: result.description || '',
        stock: '1'
      }));
    } catch (error) {
      console.error("Parse Error:", error);
      alert("ソムリエが考えすぎて回答に失敗しました。もう一度試すか手入力してください。");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const id = editingId || Date.now().toString();
    await fetch('/api/wines', { method: 'POST', body: JSON.stringify({ ...newWine, id }) });
    setNewWine({ name_jp: '', name_en: '', country: '', region: '', grape: '', vintage: '', price: '', pairing: '', advice: '', description: '', taste: '', image: '', stock: '0' });
    setEditingId(null);
    fetchWines();
    alert("保存しました");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("削除しますか？")) return;
    await fetch('/api/wines', { method: 'DELETE', body: JSON.stringify({ id }) });
    fetchWines();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen text-slate-900 bg-slate-50 font-sans">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Sommelier Admin</h1>
        <label className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 cursor-pointer shadow-xl hover:bg-black transition">
          {loading ? <Loader2 className="animate-spin" /> : <Camera size={18}/>}
          {loading ? "ソムリエ分析中..." : "スキャン登録"}
          <input type="file" accept="image/*" onChange={handleScan} className="hidden" />
        </label>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border mb-12">
        {editingId && <div className="mb-6 bg-blue-50 p-4 rounded-xl text-blue-800 font-bold flex justify-between"><span>編集モード</span><button onClick={() => setEditingId(null)}><X/></button></div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="md:col-span-2 space-y-6">
            <input type="text" placeholder="ワイン名" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-5 bg-slate-100 rounded-2xl text-black font-bold text-xl outline-none" />
            <div className="grid grid-cols-3 gap-4">
              <input type="text" placeholder="価格" value={newWine.price} onChange={e => setNewWine({...newWine, price: e.target.value})} className="p-4 bg-amber-50 rounded-xl font-bold text-amber-900 outline-none" />
              <input type="number" placeholder="在庫" value={newWine.stock} onChange={e => setNewWine({...newWine, stock: e.target.value})} className="p-4 bg-green-50 rounded-xl font-bold text-green-900 outline-none" />
              <input type="text" placeholder="年" value={newWine.vintage} onChange={e => setNewWine({...newWine, vintage: e.target.value})} className="p-4 bg-slate-100 rounded-xl font-bold outline-none" />
            </div>
            <textarea placeholder="ペアリング" value={newWine.pairing} onChange={e => setNewWine({...newWine, pairing: e.target.value})} className="w-full p-4 bg-indigo-50/50 rounded-xl font-bold h-20 outline-none" />
            <textarea placeholder="アドバイス" value={newWine.advice} onChange={e => setNewWine({...newWine, advice: e.target.value})} className="w-full p-4 bg-blue-50/50 rounded-xl font-bold h-20 outline-none" />
          </div>
          <div className="aspect-[3/4] border-2 border-dashed rounded-[2rem] overflow-hidden relative bg-slate-100 flex items-center justify-center">
            {newWine.image ? <img src={newWine.image} className="w-full h-full object-cover" /> : <WineIcon size={64} className="text-slate-200"/>}
          </div>
        </div>
        <button onClick={handleSave} className="w-full mt-8 bg-slate-900 text-white py-5 rounded-3xl font-black text-xl shadow-lg transition">保存する</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wines.map((wine: any) => (
          <div key={wine.id} className="bg-white p-5 rounded-[2rem] border shadow-sm flex gap-4 items-center group relative">
            <img src={wine.image} className="w-20 h-20 rounded-2xl object-cover shadow-inner" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black truncate">{wine.name_jp}</p>
              <div className="flex items-center gap-3 mt-2">
                <button onClick={() => updateStock(wine, -1)} className="p-1 bg-slate-100 rounded-lg hover:bg-slate-200"><Minus size={16}/></button>
                <span className={`text-lg font-black ${parseInt(wine.stock) <= 0 ? 'text-red-500' : 'text-slate-800'}`}>
                  {wine.stock}
                </span>
                <button onClick={() => updateStock(wine, 1)} className="p-1 bg-slate-100 rounded-lg hover:bg-slate-200"><Plus size={16}/></button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => {setNewWine(wine); setEditingId(wine.id); window.scrollTo(0,0)}} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"><Edit3 size={20}/></button>
              <button onClick={() => handleDelete(wine.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={20}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
