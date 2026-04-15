"use client";

export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import { Camera, Save, Loader2, Wine } from 'lucide-react';

export default function AdminPage() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanLoading, setScanLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pass, setPass] = useState("");

  // 1. ワイン一覧の読み込み
  const loadWines = async () => {
    setLoading(true);
    const res = await fetch('/api/wines');
    const data = await res.json();
    setWines(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthorized) loadWines();
  }, [isAuthorized]);

  // 2. AIスキャンの処理
  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/scan', { method: 'POST', body: formData });
      const ai = await res.json();
      
      // AIの結果をポップアップで表示（次のステップでフォームへの自動反映を実装します）
      alert(`AI解析完了！\nワイン名: ${ai.name_jp || '不明'}\n説明: ${ai.description || 'なし'}`);
    } catch (err) {
      alert("AIスキャンに失敗しました");
    } finally {
      setScanLoading(false);
    }
  };

  // 3. 保存ボタンの処理
  const handleSave = async (wine: any) => {
    await fetch('/api/wines', {
      method: 'POST',
      body: JSON.stringify(wine),
    });
    alert("保存しました！");
    loadWines();
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white">
        <Wine className="w-12 h-12 text-[#d4af37] mb-6 opacity-50" />
        <h1 className="text-xl font-serif mb-6 tracking-widest text-zinc-400 uppercase">Cellar Access</h1>
        <div className="w-full max-w-xs space-y-4">
          <input type="password" onChange={(e) => setPass(e.target.value)} className="w-full bg-zinc-900 p-4 rounded-xl text-center border border-zinc-800 outline-none focus:border-[#d4af37]" placeholder="••••••" />
          <button onClick={() => pass === "wine123" && setIsAuthorized(true)} className="w-full bg-[#d4af37] text-black py-4 rounded-xl font-bold">UNLOCKED</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-10 text-zinc-900 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Cellar Manager</h1>
          <label className="cursor-pointer bg-black text-white px-6 py-3 rounded-full flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-xl">
            {scanLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            <span className="text-sm font-bold">{scanLoading ? "Analyzing..." : "AI Label Scan"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleScan} disabled={scanLoading} />
          </label>
        </header>

        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin text-zinc-300" /></div>
        ) : (
          <div className="grid gap-8">
            {wines.map((wine: any) => (
              <div key={wine.id} className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 space-y-6">
                <div className="flex gap-4 items-center border-b pb-4 border-zinc-50">
                   <img src={wine.image_url} className="w-16 h-16 rounded-xl object-cover bg-zinc-100" />
                   <div>
                     <h2 className="font-bold">{wine.name_jp}</h2>
                     <p className="text-xs text-zinc-400 uppercase">{wine.category} / {wine.vintage}</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" defaultValue={wine.price} className="bg-zinc-50 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-black" placeholder="Price" 
                    onChange={(e) => wine.price = Number(e.target.value)} />
                  <input type="number" defaultValue={wine.stock} className="bg-zinc-50 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-black" placeholder="Stock"
                    onChange={(e) => wine.stock = Number(e.target.value)} />
                </div>

                <textarea defaultValue={wine.description} className="w-full bg-zinc-50 p-3 rounded-xl text-sm h-24 outline-none border border-transparent focus:border-zinc-200"
                   onChange={(e) => wine.description = e.target.value} />

                <button onClick={() => handleSave(wine)} className="w-full bg-zinc-100 text-zinc-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black hover:text-white transition-all">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
