"use client";
export const runtime = 'edge';
import React, { useState, useEffect } from 'react';
import { Camera, Save, Loader2, Wine, Plus, RefreshCw } from 'lucide-react';

export default function AdminPage() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanLoading, setScanLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pass, setPass] = useState("");
  const [newWine, setNewWine] = useState({ name_jp: "", name_en: "", price: 0, stock: 1, category: "Red", vintage: 2024, image_url: "", variety: "", sub_region: "", description: "" });

  const loadWines = async () => {
    setLoading(true);
    const res = await fetch('/api/wines');
    const data = await res.json();
    setWines(data);
    setLoading(false);
  };

  useEffect(() => { if (isAuthorized) loadWines(); }, [isAuthorized]);

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/scan', { method: 'POST', body: formData });
      const ai = await res.json();
      setNewWine({ ...newWine, name_jp: ai.name_jp, name_en: ai.name_en, vintage: ai.vintage, variety: ai.variety, sub_region: ai.sub_region, description: ai.description });
      alert("AI解析完了！フォームを確認してください。");
    } catch (err) { alert("AIスキャンに失敗しました"); } finally { setScanLoading(false); }
  };

  const handleSave = async (wineData: any) => {
    await fetch('/api/wines', { method: 'POST', body: JSON.stringify(wineData) });
    alert("保存しました！");
    loadWines();
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans text-center">
        <Wine className="w-12 h-12 text-[#d4af37] mb-6 opacity-50" />
        <h1 className="text-xl font-serif mb-6 tracking-[0.3em] text-zinc-400 uppercase">Admin Entry</h1>
        <input type="password" onChange={(e) => setPass(e.target.value)} className="bg-zinc-900 p-4 rounded-xl mb-4 text-center border border-zinc-800 outline-none focus:border-[#d4af37]" placeholder="Password" />
        <button onClick={() => pass === "wine123" && setIsAuthorized(true)} className="bg-[#d4af37] text-black px-12 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px]">Login</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-10 text-zinc-900 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Cellar Manager</h1>
          <label className="cursor-pointer bg-black text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-xl hover:scale-105 transition-all active:scale-95">
            {scanLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Camera className="w-4 h-4" />}
            <span className="text-sm font-bold">AI Label Scan</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleScan} />
          </label>
        </header>

        {/* --- 新規登録（黄色いエリア） --- */}
        <section className="mb-20 bg-[#fff9e6] p-8 rounded-[2.5rem] border-2 border-[#d4af37]/20 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Plus className="w-24 h-24" /></div>
          <h2 className="flex items-center gap-2 font-bold mb-8 text-[#856a16] text-xl">新しいワインを登録</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input placeholder="名前 (日本語)" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="p-4 rounded-2xl border-none shadow-sm text-sm" />
            <input placeholder="Name (English)" value={newWine.name_en} onChange={e => setNewWine({...newWine, name_en: e.target.value})} className="p-4 rounded-2xl border-none shadow-sm text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <input type="number" placeholder="価格" value={newWine.price} onChange={e => setNewWine({...newWine, price: Number(e.target.value)})} className="p-4 rounded-2xl border-none shadow-sm text-sm" />
            <input type="number" placeholder="在庫" value={newWine.stock} onChange={e => setNewWine({...newWine, stock: Number(e.target.value)})} className="p-4 rounded-2xl border-none shadow-sm text-sm" />
            <input type="number" placeholder="年" value={newWine.vintage} onChange={e => setNewWine({...newWine, vintage: Number(e.target.value)})} className="p-4 rounded-2xl border-none shadow-sm text-sm" />
          </div>
          <textarea placeholder="説明文" value={newWine.description} onChange={e => setNewWine({...newWine, description: e.target.value})} className="w-full p-4 rounded-2xl border-none shadow-sm text-sm h-24 mb-8" />
          <button onClick={() => handleSave(newWine)} className="w-full bg-[#d4af37] text-white py-5 rounded-2xl font-bold shadow-lg hover:bg-[#b8962d] transition-all">
            この内容でセラーに追加
          </button>
        </section>

        {/* --- 在庫リスト（白いエリア） --- */}
        <div className="space-y-8">
          <h2 className="font-bold text-zinc-400 uppercase text-xs tracking-[0.3em] border-b pb-4 flex items-center gap-2">
            <RefreshCw className="w-3 h-3" /> Current Inventory
          </h2>
          {wines.map((wine: any) => (
            <div key={wine.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100 grid md:grid-cols-3 gap-6">
              <img src={wine.image_url || "https://images.unsplash.com/photo-1510850402288-c3f5305c21bd?q=80&w=100"} className="w-full h-40 object-cover rounded-2xl bg-zinc-50" />
              <div className="md:col-span-2 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg">{wine.name_jp}</h3>
                  <select defaultValue={wine.category} onChange={e => wine.category = e.target.value} className="bg-zinc-100 px-3 py-1 rounded-full text-[10px] font-bold">
                    <option value="Red">Red</option><option value="White">White</option><option value="Sparkling">Sparkling</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" defaultValue={wine.price} onChange={e => wine.price = Number(e.target.value)} className="bg-zinc-50 p-2 rounded-lg text-xs" />
                  <input type="number" defaultValue={wine.stock} onChange={e => wine.stock = Number(e.target.value)} className="bg-zinc-50 p-2 rounded-lg text-xs" />
                  <input type="number" defaultValue={wine.vintage} onChange={e => wine.vintage = Number(e.target.value)} className="bg-zinc-50 p-2 rounded-lg text-xs" />
                </div>
                <button onClick={() => handleSave(wine)} className="w-full bg-zinc-900 text-white py-3 rounded-xl text-xs font-bold hover:bg-black transition-all">Update Info</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
