'use client';
import { useState, useEffect } from 'react';
import { Camera, Save, Trash2, Edit3, X, Check } from 'lucide-react';

export default function AdminPage() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null); // 修正モード用
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
      const [uploadRes, scanRes] = await Promise.all([
        fetch('/api/upload', { method: 'POST', body: data }),
        fetch('/api/scan', { method: 'POST', body: data })
      ]);
      const { url } = await uploadRes.json();
      const aiResult = await scanRes.json();
      setFormData({ ...aiResult, image_url: url });
    } catch (e) { alert("スキャン失敗"); }
    setLoading(false);
  };

  const handleSave = async () => {
    const id = editingId || Date.now().toString();
    await fetch('/api/wines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, id })
    });
    alert(editingId ? "修正しました" : "登録しました");
    setEditingId(null);
    setFormData({ name_jp: '', name_en: '', vintage: '', country: '', region: '', variety: '', category: 'Red', description: '', image_url: '' });
    fetchWines();
  };

  const startEdit = (wine: any) => {
    setEditingId(wine.id);
    setFormData(wine);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("削除しますか？")) return;
    await fetch(`/api/wines/${id}`, { method: 'DELETE' });
    fetchWines();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 bg-stone-50 min-h-screen pb-20">
      <header className="flex justify-between items-center mb-8 border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-serif font-bold text-stone-800">ワインメニュー管理</h1>
        <label className="bg-stone-800 text-white px-6 py-2 rounded-full flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition">
          <Camera size={20} />
          <span>{loading ? "解析中..." : "ラベルをスキャン"}</span>
          <input type="file" accept="image/*" onChange={handleScan} className="hidden" />
        </label>
      </header>

      {/* 編集・登録フォーム */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 mb-10">
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-700">{editingId ? "ワイン情報を修正中" : "新規ワイン登録"}</h2>
          {editingId && <button onClick={() => {setEditingId(null); setFormData({name_jp:'', name_en:'', vintage:'', country:'', region:'', variety:'', category:'Red', description:'', image_url:''})}} className="text-stone-400"><X /></button>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500">ワイン名 (日本語)</label>
              <input value={formData.name_jp} onChange={e => setFormData({...formData, name_jp: e.target.value})} className="w-full p-2 bg-stone-100 rounded-lg outline-none focus:ring-2 ring-stone-200" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500">ワイン名 (英語)</label>
              <input value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} className="w-full p-2 bg-stone-100 rounded-lg outline-none focus:ring-2 ring-stone-200" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500">国</label>
              <input value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full p-2 bg-stone-100 rounded-lg" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500">産地詳細</label>
              <input value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="w-full p-2 bg-stone-100 rounded-lg" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500">主要品種</label>
              <input value={formData.variety} onChange={e => setFormData({...formData, variety: e.target.value})} className="w-full p-2 bg-stone-100 rounded-lg" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500">ヴィンテージ / カテゴリ</label>
              <div className="flex gap-2">
                <input value={formData.vintage} onChange={e => setFormData({...formData, vintage: e.target.value})} className="w-20 p-2 bg-stone-100 rounded-lg" />
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="flex-1 p-2 bg-stone-100 rounded-lg">
                  <option value="Red">赤 (Red)</option>
                  <option value="White">白 (White)</option>
                  <option value="Rose">ロゼ (Rose)</option>
                  <option value="Sparkling">泡 (Sparkling)</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-stone-200 rounded-2xl p-2 min-h-[150px]">
            {formData.image_url ? (
              <img src={formData.image_url} className="h-full w-full object-cover rounded-xl" />
            ) : (
              <p className="text-stone-400 text-xs">画像なし</p>
            )}
          </div>
        </div>
        <div className="mt-4">
          <label className="text-xs font-bold text-stone-500">テイスティングノート (説明文)</label>
          <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 bg-stone-100 rounded-lg h-20 mt-1" />
        </div>
        <button onClick={handleSave} className="w-full mt-6 bg-stone-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition">
          <Save size={20} />
          <span>{editingId ? "変更を保存する" : "セラーに登録する"}</span>
        </button>
      </div>

      {/* 在庫一覧（修正・削除） */}
      <h2 className="text-stone-400 text-xs uppercase tracking-widest font-bold mb-4">登録済みワイン一覧</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wines.map((wine: any) => (
          <div key={wine.id} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex gap-4 items-center">
            <img src={wine.image_url} className="w-16 h-16 object-cover rounded-xl shadow-inner" alt="" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-stone-800 truncate">{wine.name_jp}</h3>
              <p className="text-xs text-stone-500">{wine.country} / {wine.variety} / {wine.vintage}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => startEdit(wine)} className="p-2 text-stone-400 hover:text-stone-800 transition"><Edit3 size={18} /></button>
              <button onClick={() => handleDelete(wine.id)} className="p-2 text-stone-400 hover:text-red-500 transition"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
