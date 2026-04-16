"use client";

import { useState, useEffect } from 'react';
import { Camera, Save, Loader2, Wine as WineIcon } from 'lucide-react';

export default function AdminPage() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newWine, setNewWine] = useState({
    name_jp: '', name_en: '', country: '', region: '', grape: '', vintage: '', 
    category: '赤', description: '', taste: '', image: ''
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
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const { url } = await uploadRes.json();
      setNewWine(prev => ({ ...prev, image: url }));

      const scanRes = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: url })
      });
      const data = await scanRes.json();
      
      let resText = data.result;
      // AIの返答からJSON部分だけを賢く抽出
      const jsonMatch = resText.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      setNewWine(prev => ({
        ...prev,
        name_jp: result.name_jp || '',
        name_en: result.name_en || '',
        country: result.country || '',
        region: result.region || '',
        grape: result.grape || '',
        vintage: result.vintage || '',
        taste: result.taste || '',
        description: result.description || '',
        image: url
      }));
    } catch (error) {
      alert("AI分析でエラーが発生しました。手動で入力するか、もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const id = Date.now().toString();
    await fetch('/api/wines', { method: 'POST', body: JSON.stringify({ ...newWine, id }) });
    alert("保存しました！");
    setNewWine({ name_jp: '', name_en: '', country: '', region: '', grape: '', vintage: '', category: '赤', description: '', taste: '', image: '' });
    fetchWines();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-50 min-h-screen text-slate-900 font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800">ワインメニュー管理</h1>
        <label className="bg-slate-800 text-white px-6 py-3 rounded-full flex items-center gap-2 cursor-pointer hover:bg-slate-700 transition shadow-lg">
          {loading ? <Loader2 className="animate-spin" /> : <Camera size={20} />}
          <span>{loading ? "AI分析中..." : "ラベルをスキャン"}</span>
          <input type="file" accept="image/*" onChange={handleScan} className="hidden" />
        </label>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">ワイン名 (カタカナ)</label>
              <input type="text" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-3 bg-slate-100 rounded-lg border border-slate-200 text-black font-bold outline-none focus:ring-2 focus:ring-slate-300" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Wine Name (Alphabet)</label>
              <input type="text" value={newWine.name_en} onChange={e => setNewWine({...newWine, name_en: e.target.value})} className="w-full p-3 bg-slate-100 rounded-lg border border-slate-200 text-black font-bold outline-none focus:ring-2 focus:ring-slate-300" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">国</label>
              <input type="text" value={newWine.country} onChange={e => setNewWine({...newWine, country: e.target.value})} className="w-full p-3 bg-slate-100 rounded-lg border border-slate-200 text-black font-bold outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">産地</label>
              <input type="text" value={newWine.region} onChange={e => setNewWine({...newWine, region: e.target.value})} className="w-full p-3 bg-slate-100 rounded-lg border border-slate-200 text-black font-bold outline-none" />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 min-h-[250px] overflow-hidden">
            {newWine.image ? <img src={newWine.image} className="w-full h-full object-cover" /> : <div className="text-slate-400 flex flex-col items-center gap-2"><WineIcon size={48} /><span className="text-xs font-bold">画像なし</span></div>}
          </div>

          <div className="col-span-full border-t border-slate-100 pt-4">
            <label className="text-xs font-bold text-slate-500 uppercase">味わいの特徴 (日本語)</label>
            <textarea value={newWine.taste} onChange={e => setNewWine({...newWine, taste: e.target.value})} className="w-full p-3 bg-slate-100 rounded-lg border border-slate-200 text-black font-bold h-20 outline-none" />
          </div>
          <div className="col-span-full">
            <label className="text-xs font-bold text-slate-500 uppercase">ワイン紹介コメント (日本語)</label>
            <textarea value={newWine.description} onChange={e => setNewWine({...newWine, description: e.target.value})} className="w-full p-3 bg-slate-100 rounded-lg border border-slate-200 text-black font-bold h-28 outline-none" />
          </div>
        </div>

        <button onClick={handleSave} className="w-full mt-8 bg-slate-800 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition shadow-xl active:scale-95">
          <Save size={20} />
          <span>セラーに登録する</span>
        </button>
      </div>
    </div>
  );
}
