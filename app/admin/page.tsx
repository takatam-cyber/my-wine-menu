"use client";

import { useState, useEffect } from 'react';
import { Camera, Save, Loader2, Wine as WineIcon, Trash2 } from 'lucide-react';

export default function AdminPage() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newWine, setNewWine] = useState({
    name_jp: '', name_en: '', country: '', region: '', grape: '', vintage: '', 
    category: '赤', description: '', taste: '', image: ''
  });

  useEffect(() => { fetchWines(); }, []);

  const fetchWines = async () => {
    try {
      const res = await fetch('/api/wines');
      const data = await res.json();
      setWines(Array.isArray(data) ? data : []);
    } catch (e) { setWines([]); }
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

      const scanRes = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: url })
      });
      const data = await scanRes.json();
      
      // 【最強のノイズクリーニング】
      let resText = String(data.result)
        .replace(/\\_/g, '_') // AIが入れてしまう \_ を _ に修正
        .replace(/```json|```/g, ''); // Markdownの枠を削除

      const startIdx = resText.indexOf('{');
      const endIdx = resText.lastIndexOf('}');

      if (startIdx !== -1 && endIdx !== -1) {
        const result = JSON.parse(resText.substring(startIdx, endIdx + 1));

        setNewWine(prev => ({
          ...prev,
          name_jp: result.name_jp || '',
          name_en: result.name_en || '',
          country: result.country || '',
          region: result.region || '',
          grape: result.grape || '',
          vintage: String(result.vintage || ''),
          taste: result.taste || '',
          description: result.description || '',
          image: url
        }));
      }
    } catch (error) {
      alert("AI分析に失敗しました。手動で入力するか、もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const id = Date.now().toString();
    await fetch('/api/wines', { method: 'POST', body: JSON.stringify({ ...newWine, id }) });
    alert("登録完了！");
    setNewWine({ name_jp: '', name_en: '', country: '', region: '', grape: '', vintage: '', category: '赤', description: '', taste: '', image: '' });
    fetchWines();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("削除しますか？")) return;
    await fetch(`/api/wines/${id}`, { method: 'DELETE' });
    fetchWines();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-50 min-h-screen text-slate-900 font-sans">
      <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tighter">WINE MENU ADMIN</h1>
        <label className="bg-slate-800 text-white px-6 py-3 rounded-full flex items-center gap-2 cursor-pointer hover:bg-black transition shadow-lg">
          {loading ? <Loader2 className="animate-spin" /> : <Camera size={20} />}
          <span className="font-bold">{loading ? "分析中..." : "ラベルをスキャン"}</span>
          <input type="file" accept="image/*" onChange={handleScan} className="hidden" />
        </label>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-5">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">ワイン名 (カタカナ)</label>
              <input type="text" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-black font-bold text-lg transition" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">WINE NAME (ALPHABET)</label>
              <input type="text" value={newWine.name_en} onChange={e => setNewWine({...newWine, name_en: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-black font-bold text-lg transition" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">国</label>
                <input type="text" value={newWine.country} onChange={e => setNewWine({...newWine, country: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-black font-bold transition" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">産地</label>
                <input type="text" value={newWine.region} onChange={e => setNewWine({...newWine, region: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-black font-bold transition" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">品種</label>
                <input type="text" value={newWine.grape} onChange={e => setNewWine({...newWine, grape: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-black font-bold transition" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">ヴィンテージ</label>
                <input type="text" value={newWine.vintage} onChange={e => setNewWine({...newWine, vintage: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-black font-bold transition" />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-full aspect-[3/4] border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 overflow-hidden flex items-center justify-center">
              {newWine.image ? (
                <img src={newWine.image} className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-300 flex flex-col items-center gap-2">
                  <WineIcon size={64} strokeWidth={1} />
                  <span className="text-xs font-bold uppercase tracking-tighter">No Label Image</span>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-full space-y-5 border-t border-slate-100 pt-6">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">味わいの特徴 (日本語)</label>
              <textarea value={newWine.taste} onChange={e => setNewWine({...newWine, taste: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-black font-bold h-24 transition" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">ワイン紹介コメント (日本語)</label>
              <textarea value={newWine.description} onChange={e => setNewWine({...newWine, description: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-black font-bold h-32 transition" />
            </div>
          </div>
        </div>

        <button onClick={handleSave} className="w-full mt-10 bg-slate-800 text-white py-5 rounded-2xl font-black text-xl hover:bg-black transition shadow-xl active:scale-[0.98] flex items-center justify-center gap-3">
          <Save size={24} />
          <span>セラーに登録する</span>
        </button>
      </div>

      <div className="mt-16">
        <h2 className="text-xl font-bold mb-6 text-slate-400 uppercase tracking-widest">Registered Wines ({wines.length})</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {wines.map((wine: any) => (
            <div key={wine.id} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm relative group">
              <button onClick={() => handleDelete(wine.id)} className="absolute top-2 right-2 p-2 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm z-10">
                <Trash2 size={16} />
              </button>
              <div className="aspect-square rounded-2xl bg-slate-100 mb-3 overflow-hidden">
                <img src={wine.image} className="w-full h-full object-cover" />
              </div>
              <p className="text-sm font-black truncate">{wine.name_jp}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter truncate">{wine.name_en}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
