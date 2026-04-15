'use client';
import { useState, useEffect } from 'react';
import { Camera, Plus, Trash2, Loader2 } from 'lucide-react';

export default function AdminPage() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanData, setScanData] = useState({
    name_jp: '', name_en: '', vintage: '', variety: '', sub_region: '', category: 'Red', description: '', image_url: ''
  });

  useEffect(() => { fetchWines(); }, []);

  const fetchWines = async () => {
    const res = await fetch('/api/wines');
    const data = await res.json();
    setWines(data);
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // 1. 画像をR2にアップロード
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const { url } = await uploadRes.json();

      // 2. AIで情報を解析
      const scanRes = await fetch('/api/scan', { method: 'POST', body: formData });
      const aiResult = await scanRes.json();

      setScanData({ ...aiResult, image_url: url });
    } catch (e) {
      alert("スキャンに失敗しました。設定を確認してください。");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!scanData.name_jp) return alert("ワイン名を入力してください");
    
    await fetch('/api/wines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scanData)
    });
    alert("セラーに追加しました！");
    setScanData({ name_jp: '', name_en: '', vintage: '', variety: '', sub_region: '', category: 'Red', description: '', image_url: '' });
    fetchWines();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このワインを削除しますか？保存された画像もストレージから消去されます。")) return;
    
    try {
      const res = await fetch(`/api/wines/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert("削除が完了し、ストレージが解放されました。");
        fetchWines();
      }
    } catch (e) {
      alert("削除に失敗しました。");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-stone-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-stone-800">Cellar Manager</h1>
        <label className="bg-black text-white px-4 py-2 rounded-full flex items-center gap-2 cursor-pointer hover:bg-stone-800 transition">
          <Camera size={20} />
          <span>{loading ? "Scanning..." : "AI Label Scan"}</span>
          <input type="file" accept="image/*" onChange={handleScan} className="hidden" />
        </label>
      </div>

      {/* 入力フォーム */}
      <div className="bg-[#fdf6e3] p-8 rounded-3xl shadow-xl border border-stone-200 mb-12">
        <h2 className="text-xl font-serif text-amber-800 mb-6 font-bold">新しいワインを登録</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input placeholder="ワイン名（日本名）" value={scanData.name_jp} onChange={e => setScanData({...scanData, name_jp: e.target.value})} className="p-3 rounded-xl border-none shadow-inner w-full" />
          <input placeholder="Wine Name (English)" value={scanData.name_en} onChange={e => setScanData({...scanData, name_en: e.target.value})} className="p-3 rounded-xl border-none shadow-inner w-full" />
          <input placeholder="ヴィンテージ" value={scanData.vintage} onChange={e => setScanData({...scanData, vintage: e.target.value})} className="p-3 rounded-xl border-none shadow-inner w-full" />
          <input placeholder="品種" value={scanData.variety} onChange={e => setScanData({...scanData, variety: e.target.value})} className="p-3 rounded-xl border-none shadow-inner w-full" />
        </div>
        <textarea placeholder="説明文" value={scanData.description} onChange={e => setScanData({...scanData, description: e.target.value})} className="w-full p-3 rounded-xl border-none shadow-inner h-24 mb-6" />
        
        {scanData.image_url && (
          <div className="mb-6 flex justify-center">
            <img src={scanData.image_url} alt="Preview" className="h-40 rounded-xl shadow-md" />
          </div>
        )}

        <button onClick={handleSave} className="w-full bg-[#d4af37] text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-amber-600 transition">
          この内容でセラーに追加
        </button>
      </div>

      {/* 在庫リスト */}
      <div className="space-y-4">
        <h2 className="text-stone-400 text-xs uppercase tracking-widest font-bold mb-4">Current Inventory</h2>
        {wines.length === 0 && <p className="text-stone-400 italic">セラーは空です。ワインをスキャンしてください。</p>}
        {wines.map((wine: any) => (
          <div key={wine.id} className="bg-white p-4 rounded-3xl shadow-sm flex gap-4 items-center group hover:shadow-md transition">
            {wine.image_url ? (
              <img src={wine.image_url} className="w-20 h-20 object-cover rounded-2xl" alt="" />
            ) : (
              <div className="w-20 h-20 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400">No Image</div>
            )}
            <div className="flex-1">
              <h3 className="font-bold text-stone-800">{wine.name_jp}</h3>
              <p className="text-sm text-stone
