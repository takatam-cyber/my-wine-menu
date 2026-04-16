"use client";

import { useState, useEffect } from 'react';
import { Camera, Save, Trash2, Loader2 } from 'lucide-react';

export default function AdminPage() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newWine, setNewWine] = useState({
    name: '', country: '', region: '', grape: '', vintage: '', category: '赤',
    description: '', taste: '', image: ''
  });

  useEffect(() => {
    fetchWines();
  }, []);

  const fetchWines = async () => {
    const res = await fetch('/api/wines');
    const data = await res.json();
    setWines(data);
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const { url } = await uploadRes.json();

      const scanRes = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: url })
      });
      const { result } = await scanRes.json();
      
      // AIの結果を反映（味わいなども含める準備）
      setNewWine({ ...newWine, ...result, image: url });
    } catch (error) {
      alert("スキャンに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const id = Date.now().toString();
    await fetch('/api/wines', {
      method: 'POST',
      body: JSON.stringify({ ...newWine, id })
    });
    setNewWine({ name: '', country: '', region: '', grape: '', vintage: '', category: '赤', description: '', taste: '', image: '' });
    fetchWines();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">ワインメニュー管理</h1>
        <label className="bg-slate-800 text-white px-6 py-3 rounded-full flex items-center gap-2 cursor-pointer hover:bg-slate-700 transition">
          <Camera size={20} />
          <span>ラベルをスキャン</span>
          <input type="file" accept="image/*" onChange={handleScan} className="hidden" />
        </label>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm mb-12 border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 各入力欄の text-slate-900 が文字を濃くする設定です */}
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">ワイン名 (日本語)</label>
            <input type="text" value={newWine.name} onChange={e => setNewWine({...newWine, name: e.target.value})} className="w-full p-3 bg-slate-100 rounded-lg border-none text-slate-900 font-semibold" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">国</label>
            <input type="text" value={newWine.country} onChange={e => setNewWine({...newWine, country: e.target.value})} className="w-full p-3 bg-slate-100 rounded-lg border-none text-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">産地</label>
            <input type="text" value={newWine.region} onChange={e => setNewWine({...newWine, region: e.target.value})} className="w-full p-3 bg-slate-100 rounded-lg border-none text-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">品種</label>
            <input type="text" value={newWine.grape} onChange={e => setNewWine({...newWine, grape: e.target.value})} className="w-full p-3 bg-slate-100 rounded-lg border-none text-slate-900" />
          </div>
          <div className="col-span-full">
            <label className="block text-sm font-medium text-slate-500 mb-1">味わいの特徴 (AIが分析)</label>
            <textarea value={newWine.taste} onChange={e => setNewWine({...newWine, taste: e.target.value})} placeholder="例: 重厚なタンニン、ベリーの香り..." className="w-full p-3 bg-slate-100 rounded-lg border-none text-slate-900 h-20" />
          </div>
          <div className="col-span-full">
            <label className="block text-sm font-medium text-slate-500 mb-1">ワイン紹介コメント</label>
            <textarea value={newWine.description} onChange={e => setNewWine({...newWine, description: e.target.value})} placeholder="このワインの歴史やストーリー..." className="w-full p-3 bg-slate-100 rounded-lg border-none text-slate-900 h-24" />
          </div>
        </div>

        <button onClick={handleSave} className="w-full mt-8 bg-slate-800 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900">
          <Save size={20} />
          <span>セラーに登録する</span>
        </button>
      </div>

      {/* 登録済みリスト（省略） */}
    </div>
  );
}
