"use client";

export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import { Camera, Save, Loader2, Wine, Plus } from 'lucide-react';

export default function AdminPage() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanLoading, setScanLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pass, setPass] = useState("");
  
  // 新規追加用の入力データ
  const [newWine, setNewWine] = useState({
    name_jp: "", name_en: "", price: 0, stock: 1, category: "Red", vintage: 2024,
    image_url: "", variety: "", sub_region: "", description: ""
  });

  const loadWines = async () => {
    setLoading(true);
    const res = await fetch('/api/wines');
    const data = await res.json();
    setWines(data);
    setLoading(false);
  };

  useEffect(() => { if (isAuthorized) loadWines(); }, [isAuthorized]);

  // AIスキャン：結果を newWine ステートに流し込む
  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/scan', { method: 'POST', body: formData });
      const ai = await res.json();
      // AIの結果を入力欄に自動セット！
      setNewWine({
        ...newWine,
        name_jp: ai.name_jp || "",
        name_en: ai.name_en || "",
        vintage: ai.vintage || 2024,
        variety: ai.variety || "",
        sub_region: ai.sub_region || "",
        description: ai.description || ""
      });
      alert("AI解析が完了し、入力欄にセットしました！");
    } catch (err) { alert("AIスキャンに失敗しました"); } 
    finally { setScanLoading(false); }
  };

  const handleSave = async (wineData: any) => {
    await fetch('/api/wines', { method: 'POST', body: JSON.stringify(wineData) });
    alert("保存が完了しました！");
    loadWines(); // 一覧を更新
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans">
        <Wine className="w-12 h-12 text-[#d4af37] mb-6 opacity-50" />
        <h1 className="text-xl font-serif mb-6 tracking-widest text-zinc-400">ADMIN ACCESS</h1>
        <input type="password" onChange={(e) => setPass(e.target.value)} className="bg-zinc-900 p-4 rounded-xl mb-4 text-center border border-zinc-800" placeholder="Password" />
        <button onClick={() => pass === "wine123" && setIsAuthorized(true)} className="bg-[#d4af37] text-black px-10 py-3 rounded-xl font-bold uppercase tracking-widest text-xs">Login</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-10 text-zinc-900 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Cellar Manager</h1>
          <label className="cursor-pointer bg-black text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-xl hover:scale-105 transition-all">
            {scanLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Camera className="w-4 h-4" />}
            <span className="text-sm font-bold">AI Label Scan</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleScan} />
          </label>
        </header>

        {/* --- 新規追加フォーム --- */}
        <section className="mb-16 bg-[#fff9e6] p-8 rounded-[2rem] border-2 border-[#d4af37]/20 shadow-inner">
          <h2 className="flex items-center gap-2 font-bold mb-6 text-[#856a16]">
            <Plus className="w-5 h-5" /> 新しいワインを登録する
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input placeholder="ワイン名（日本語）" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="p-3 rounded-xl border-none shadow-sm text-sm" />
            <input placeholder="Wine Name (English)" value={newWine.name_en} onChange={e => setNewWine({...newWine, name_en: e.target.value})} className="p-3 rounded-xl border-none shadow-sm text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <input type="number" placeholder="価格" value={newWine.price} onChange={e => setNewWine({...newWine, price: Number(e.target.value)})} className="p-3 rounded-xl border-none shadow-sm text-sm" />
            <input type="number" placeholder="在庫数" value={newWine.stock} onChange={e => setNewWine({...newWine, stock: Number(e.target.value)})} className="p-3 rounded-xl border-none shadow-sm text-sm" />
            <input type="number" placeholder="ヴィンテージ" value={newWine.vintage} onChange={e => setNewWine({...newWine, vintage: Number(e.target.value)})} className="p-3 rounded-xl border-none shadow-sm text-sm" />
          </div>
          <textarea placeholder="AIが作成した説明文がここに入ります" value={newWine.description} onChange={e => setNewWine({...newWine, description: e.target.value})} className="w-full p-3 rounded-xl border-none shadow-sm text-sm h-24 mb-6" />
          <button onClick={() => handleSave(newWine)} className="w-full bg-[#d4af37] text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-[#b8962d] transition-all">
            この内容でセラーに追加する
          </button>
        </section>

        {/* --- 在庫一覧 --- */}
        <div className="grid gap-6 opacity-80">
          <h2 className="font-bold text-zinc-400 uppercase text-xs tracking-widest border-b pb-2">Current Inventory</h2>
          {wines.map((wine: any) => (
            <div key={wine.id} className="bg-white p-6 rounded-2xl flex items-center justify-between shadow-sm border border-zinc-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={wine.image_url || "https://images.unsplash.com/photo-1510850402288-c3f5305c21bd?q=80&w=100"} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{wine.name_jp}</h3>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-tighter">在庫: {wine.stock} / ¥{wine.price.toLocaleString()}</p>
                </div>
              </div>
              <button onClick={() => {/* 編集モード */}} className="text-zinc-300 hover:text-black">
                <Save className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
