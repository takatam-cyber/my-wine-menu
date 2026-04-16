"use client";

import { useState, useEffect } from 'react';
import { Camera, Save, Loader2, Wine as WineIcon, Trash2, Edit3, Download, X } from 'lucide-react';

export default function AdminPage() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
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
      
      // --- 最強のクリーンアップ処理 ---
      let resText = String(data.result)
        .replace(/\\_/g, '_') // AI特有のバックスラッシュを掃除
        .replace(/```json|```/g, ''); // Markdownの枠を削除

      const startIdx = resText.indexOf('{');
      const endIdx = resText.lastIndexOf('}');

      if (startIdx !== -1 && endIdx !== -1) {
        const jsonString = resText.substring(startIdx, endIdx + 1);
        const result = JSON.parse(jsonString);

        setNewWine(prev => ({
          ...prev,
          name_jp: result.name_jp || prev.name_jp,
          name_en: result.name_en || prev.name_en,
          country: result.country || prev.country,
          region: result.region || prev.region,
          grape: result.grape || prev.grape,
          vintage: String(result.vintage || prev.vintage),
          taste: result.taste || prev.taste,
          description: result.description || prev.description,
        }));
      }
    } catch (error) {
      console.error(error);
      alert("AI分析に失敗しました。手動で入力するか、もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const id = editingId || Date.now().toString();
    await fetch('/api/wines', { method: 'POST', body: JSON.stringify({ ...newWine, id }) });
    setNewWine({ name_jp: '', name_en: '', country: '', region: '', grape: '', vintage: '', category: '赤', description: '', taste: '', image: '' });
    setEditingId(null);
    fetchWines();
    alert("セラーに保存しました！");
  };

  const startEdit = (wine: any) => {
    setNewWine(wine);
    setEditingId(wine.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("削除しますか？")) return;
    await fetch('/api/wines', { method: 'DELETE', body: JSON.stringify({ id }) });
    fetchWines();
  };

  const exportCSV = () => {
    const headers = ["ID,ワイン名(日),ワイン名(英),国,産地,品種,年,味わい,説明\n"];
    const rows = wines.map((w: any) => 
      `"${w.id}","${w.name_jp}","${w.name_en}","${w.country}","${w.region}","${w.grape}","${w.vintage}","${w.taste}","${w.description}"`
    ).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `wine_list.csv`;
    link.click();
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-slate-50 min-h-screen text-slate-900 font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-slate-800">WINE CELLAR ADMIN</h1>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="bg-green-600 text-white px-5 py-3 rounded-full flex items-center gap-2 hover:bg-green-700 transition shadow-md">
            <Download size={20} /> <span className="font-bold">CSV出力</span>
          </button>
          <label className="bg-slate-800 text-white px-6 py-3 rounded-full flex items-center gap-2 cursor-pointer hover:bg-black transition shadow-lg">
            {loading ? <Loader2 className="animate-spin" /> : <Camera size={20} />}
            <span className="font-bold">{editingId ? "再スキャン" : "スキャン登録"}</span>
            <input type="file" accept="image/*" onChange={handleScan} className="hidden" />
          </label>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-md border border-slate-200 mb-12">
        {editingId && (
          <div className="mb-6 flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-200">
            <span className="text-blue-800 font-bold">【編集モード】既存のデータを修正中</span>
            <button onClick={() => {setEditingId(null); setNewWine({name_jp:'',name_en:'',country:'',region:'',grape:'',vintage:'',category:'赤',description:'',taste:'',image:''})}} className="text-blue-800"><X size={20}/></button>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-5">
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">ワイン名 (カタカナ)</label>
              <input type="text" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-black font-bold text-lg" />
              
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Wine Name (Alphabet)</label>
              <input type="text" value={newWine.name_en} onChange={e => setNewWine({...newWine, name_en: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-black font-bold text-lg" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">国</label>
                <input type="text" value={newWine.country} onChange={e => setNewWine({...newWine, country: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-black font-bold" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">産地</label>
                <input type="text" value={newWine.region} onChange={e => setNewWine({...newWine, region: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-black font-bold" />
              </div>
            </div>
          </div>

          <div className="w-full aspect-[3/4] border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 overflow-hidden relative group">
            {newWine.image ? (
              <img src={newWine.image} className="w-full h-full object-cover" />
            ) : <div className="h-full flex flex-col items-center justify-center text-slate-300"><WineIcon size={48} /></div>}
            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer text-white font-bold">
              画像を差し替える
              <input type="file" accept="image/*" onChange={async (e) => {
                const f = e.target.files?.[0]; if(!f) return;
                const fd = new FormData(); fd.append('file', f);
                const res = await fetch('/api/upload', {method:'POST', body:fd});
                const {url} = await res.json(); setNewWine(p => ({...p, image:url}));
              }} className="hidden" />
            </label>
          </div>

          <div className="col-span-full space-y-4 pt-4 border-t">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">味わいの特徴 (日本語)</label>
            <textarea value={newWine.taste} onChange={e => setNewWine({...newWine, taste: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-black font-bold h-24" />
            
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">ワイン紹介コメント (日本語)</label>
            <textarea value={newWine.description} onChange={e => setNewWine({...newWine, description: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-black font-bold h-32" />
          </div>
        </div>

        <button onClick={handleSave} className="w-full mt-8 bg-slate-800 text-white py-5 rounded-2xl font-black text-xl hover:bg-black transition shadow-xl active:scale-95 flex items-center justify-center gap-3">
          <Save size={24} /> <span>{editingId ? "変更を保存する" : "セラーに登録する"}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {wines.map((wine: any) => (
          <div key={wine.id} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm relative group hover:shadow-md transition">
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition z-10">
              <button onClick={() => startEdit(wine)} className="p-2 bg-white text-blue-600 rounded-full shadow hover:bg-blue-50"><Edit3 size={14}/></button>
              <button onClick={() => handleDelete(wine.id)} className="p-2 bg-white text-red-600 rounded-full shadow hover:bg-red-50"><Trash2 size={14}/></button>
            </div>
            <div className="aspect-square rounded-2xl bg-slate-100 mb-3 overflow-hidden">
              <img src={wine.image} className="w-full h-full object-cover" />
            </div>
            <p className="text-xs font-black truncate text-black">{wine.name_jp}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{wine.name_en}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
