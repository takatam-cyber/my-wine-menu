'use client';
import { useState, useEffect } from 'react';
import { Camera, Save, Trash2, Edit3, Loader2 } from 'lucide-react';

export default function AdminPage() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name_jp: '', name_en: '', vintage: '', country: '', region: '', variety: '', category: 'Red', description: '', image_url: ''
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
      const data = new FormData();
      data.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: data });
      const { url } = await uploadRes.json();
      setFormData(prev => ({ ...prev, image_url: url }));
      const scanRes = await fetch('/api/scan', { method: 'POST', body: data });
      const aiResult = await scanRes.json();
      setFormData(prev => ({ ...prev, ...aiResult, image_url: url }));
    } catch (e) { alert("スキャン失敗"); }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.name_jp) return alert("ワイン名を入力してください");
    const id = editingId || Date.now().toString();
    await fetch('/api/wines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, id })
    });
    setEditingId(null);
    setFormData({ name_jp: '', name_en: '', vintage: '', country: '', region: '', variety: '', category: 'Red', description: '', image_url: '' });
    fetchWines();
    alert("保存しました");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("削除しますか？画像も消去されます。")) return;
    await fetch(`/api/wines/${id}`, { method: 'DELETE' });
    fetchWines();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 bg-stone-50 min-h-screen pb-20">
      <header className="flex justify-between items-center mb-8 border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-serif font-bold text-stone-800">ワインメニュー管理</h1>
        <label className="bg-stone-800 text-white px-6 py-2 rounded-full flex items-center gap-2 cursor-pointer shadow-lg hover:bg-black transition">
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
          <span>{loading ? "解析中..." : "ラベルをスキャン"}</span>
          <input type="file" accept="image/*" onChange={handleScan} className="hidden" />
        </label>
      </header>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-xs font-bold text-stone-500">ワイン名 (日本語)</label><input value={formData.name_jp} onChange={e => setFormData({...formData, name_jp: e.target.value})} className="w-full p-2 bg-stone-100 rounded-lg outline-none" /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-stone-500">国</label><input value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full p-2 bg-stone-100 rounded-lg" /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-stone-500">産地</label><input value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="w-full p-2 bg-stone-100 rounded-lg" /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-stone-500">品種</label><input value={formData.variety} onChange={e => setFormData({...formData, variety: e.target.value})} className="w-full p-2 bg-stone-100 rounded-lg" /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-stone-500">ヴィンテージ</label><input value={formData.vintage} onChange={e => setFormData({...formData, vintage: e.target.value})} className="w-full p-2 bg-stone-100 rounded-lg" /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-stone-500">カテゴリ</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 bg-stone-100 rounded-lg">
                <option value="Red">赤</option><option value="White">白</option><option value="Rose">ロゼ</option><option value="Sparkling">泡</option>
              </select>
            </div>
          </div>
          <div className="border-2 border-dashed border-stone-200 rounded-2xl flex items-center justify-center bg-stone-50 overflow-hidden h-48 md:h-full relative">
            {formData.image_url ? <img src={formData.image_url} className="w-full h-full object-cover" /> : <p className="text-stone-400">画像なし</p>}
            {loading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}
          </div>
        </div>
        <button onClick={handleSave} className="w-full mt-6 bg-stone-800 text-white py-3 rounded-xl font-bold hover:bg-black transition">
          {editingId ? "変更を保存" : "セラーに登録"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wines.map((wine: any) => (
          <div key={wine.id} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex gap-4 items-center">
            <img src={wine.image_url} className="w-16 h-16 object-cover rounded-xl" />
            <div className="flex-1 min-w-0"><h3 className="font-bold text-stone-800 truncate">{wine.name_jp}</h3><p className="text-xs text-stone-500">{wine.country} / {wine.vintage}</p></div>
            <div className="flex gap-1">
              <button onClick={() => { setEditingId(wine.id); setFormData(wine); window.scrollTo({top:0}) }} className="p-2 text-stone-300 hover:text-stone-800 transition"><Edit3 size={18} /></button>
              <button onClick={() => handleDelete(wine.id)} className="p-2 text-stone-300 hover:text-red-500 transition"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
