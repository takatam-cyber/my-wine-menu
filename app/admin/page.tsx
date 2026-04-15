"use client"; // AIの反応をリアルタイムで反映させるためクライアントモードにします

import React, { useState, useEffect } from 'react';
import { Camera, Save, Loader2 } from 'lucide-react';

export default function AdminPage() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pass, setPass] = useState("");

  // 1. データの読み込み
  const fetchWines = async () => {
    const res = await fetch('/api/wines'); // 後で追加する取得用API
    const data = await res.json();
    setWines(data);
  };

  // 2. AIスキャンの処理
  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/scan', { method: 'POST', body: formData });
      const aiResult = await res.json();
      
      // AIが返した情報を「新規登録」用のフォームに自動セットする
      // ※ここではデモとしてalertで表示。実際はstateに入れてフォームを埋めます
      alert("AIが解析しました！\n" + aiResult.description);
    } catch (err) {
      alert("AIスキャンに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white">
        <h1 className="text-2xl font-serif mb-6 italic text-[#d4af37]">Wine Manager Login</h1>
        <input type="password" onChange={(e) => setPass(e.target.value)} className="bg-zinc-900 p-4 rounded-xl mb-4 text-center border border-zinc-800" placeholder="Password" />
        <button onClick={() => pass === "wine123" && setIsAuthorized(true)} className="bg-[#d4af37] text-black px-10 py-3 rounded-xl font-bold">LOGIN</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-10 text-zinc-900 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Cellar Manager</h1>
          
          <label className="cursor-pointer bg-black text-white px-6 py-3 rounded-full flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {loading ? "Analyzing..." : "AI Label Scan"}
            <input type="file" accept="image/*" className="hidden" onChange={handleScan} disabled={loading} />
          </label>
        </header>

        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <p className="text-center text-zinc-400 text-sm">
            AIスキャン機能の枠組みが完成しました。<br/>
            上の「AI Label Scan」ボタンから写真を送ると、AIが解析を始めます。
          </p>
        </div>
      </div>
    </div>
  );
}
