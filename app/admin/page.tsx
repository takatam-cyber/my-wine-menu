"use client";

import { useState, useEffect } from 'react';
import { Camera, Save, Loader2, Wine as WineIcon, Trash2, Edit3, Download, Upload, X, Utensils, Sparkles } from 'lucide-react';

export default function AdminPage() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newWine, setNewWine] = useState({
    name_jp: '', name_en: '', country: '', region: '', grape: '', vintage: '', 
    price: '', pairing: '', advice: '', description: '', taste: '', image: ''
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

      const scanRes = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: url }) });
      const data = await scanRes.json();
      let resText = String(data.result).replace(/\\_/g, '_').replace(/```json|```/g, '');
      const result = JSON.parse(resText.match(/\{[\s\S]*\}/)[0]);

      setNewWine(prev => ({
        ...prev,
        name_jp: result.name_jp || prev.name_jp,
        name_en: result.name_en || prev.name_en,
        country: result.country || prev.country,
        region: result.region || prev.region,
        grape: result.grape || prev.grape,
        vintage: String(result.vintage || prev.vintage),
        price: String(result.price || prev.price),
        pairing: result.pairing || '',
        advice: result.advice || '',
        taste: result.taste || '',
        description: result.description || '',
      }));
    } catch (error) { alert("AIスキャンに失敗しました。"); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    const id = editingId || Date.now().toString();
    await fetch('/api/wines', { method: 'POST', body: JSON.stringify({ ...newWine, id }) });
    setNewWine({ name_jp: '', name_en: '', country: '', region: '', grape: '', vintage: '', price: '', pairing: '', advice: '', description: '', taste: '', image: '' });
    setEditingId(null);
    fetchWines();
    alert("セラー情報を保存しました。");
  };

  const exportCSV = () => {
    const headers = ["ID,ワイン名(日),ワイン名(英),国,産地,年,販売価格,ペアリング,アドバイス,味わい,説明,画像URL\n"];
    const rows = wines.map((w: any) => 
      `"${w.id}","${w.name_jp}","${w.name_en}","${w.country}","${w.region}","${w.vintage}","${w.price}","${(w.pairing||'').replace(/"/g,'""')}","${(w.advice||'').replace(/"/g,'""')}","${(w.taste||'').replace(/"/g,'""')}","${(w.description||'').replace(/"/g,'""')}","${w.image}"`
    ).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `wine_list_full.csv`;
    link.click();
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split("\n").slice(1);
      for (let row of rows) {
        if (!row.trim()) continue;
        const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"')) || [];
        if (cols.length >= 12) {
          await fetch('/api/wines', { method: 'POST', body: JSON.stringify({
            id: cols[0], name_jp: cols[1], name_en: cols[2], country: cols[3], region: cols[4], vintage: cols[5], 
            price: cols[6], pairing: cols[7], advice: cols[8], taste: cols[9], description: cols[10], image: cols[11]
          })});
        }
      }
      fetchWines();
      alert("CSVのインポートを完了しました。");
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen text-slate-900 bg-slate-50 font-sans">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-black uppercase">AI sommelier Admin</h1>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="bg-white border px-4 py-2 rounded-xl font-bold shadow-sm hover:bg-slate-50">CSV出力</button>
          <label className="bg-white border px-4 py-2 rounded-xl font-bold cursor-pointer hover:bg-slate-50">CSV読み込み<input type="file" accept=".csv" onChange={importCSV} className="hidden" /></label>
          <label className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-xl hover:bg-black transition">
            {loading ? <Loader2 className="animate-spin" /> : <Camera size={18}/>}
            {loading ? "分析中..." : "スキャン"}
            <input type="file" accept="image/*" onChange={handleScan} className="hidden" />
          </label>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 mb-12">
        {editingId && (
          <div className="mb-6 flex justify-between items-center bg-blue-50 p-4 rounded-xl text-blue-800 font-bold border border-blue-100">
            <span>編集モード中（ID: {editingId}）</span>
            <button onClick={() => {setEditingId(null); setNewWine({name_jp:'',name_en:'',country:'',region:'',grape:'',vintage:'',price:'',pairing:'',advice:'',description:'',taste:'',image:''})}}><X/></button>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="md:col-span-2 space-y-6">
            <input type="text" placeholder="ワイン名 (カタカナ)" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-5 bg-slate-100 rounded-2xl text-black font-bold text-xl outline-none" />
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="英語名" value={newWine.name_en} onChange={e => setNewWine({...newWine, name_en: e.target.value})} className="p-4 bg-slate-100 rounded-xl font-bold outline-none" />
              <input type="text" placeholder="価格（税込）" value={newWine.price} onChange={e => setNewWine({...newWine, price: e.target.value})} className="p-4 bg-amber-50 rounded-xl font-bold text-amber-900 outline-none" />
              <input type="text" placeholder="産地" value={newWine.region} onChange={e => setNewWine({...newWine, region: e.target.value})} className="p-4 bg-slate-100 rounded-xl font-bold outline-none" />
              <input type="text" placeholder="年" value={newWine.vintage} onChange={e => setNewWine({...newWine, vintage: e.target.value})} className="p-4 bg-slate-100 rounded-xl font-bold outline-none" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 font-bold"><Utensils size={18}/><span>ペアリング料理</span></div>
              <textarea value={newWine.pairing} onChange={e => setNewWine({...newWine, pairing: e.target.value})} className="w-full p-4 bg-indigo-50/50 rounded-xl font-bold h-20 outline-none" />
              
              <div className="flex items-center gap-2 text-blue-600 font-bold"><Sparkles size={18}/><span>選び方のアドバイス</span></div>
              <textarea value={newWine.advice} onChange={e => setNewWine({...newWine, advice: e.target.value})} className="w-full p-4 bg-blue-50/50 rounded-xl font-bold h-20 outline-none" />
            </div>
          </div>
          <div className="aspect-[3/4] border-2 border-dashed rounded-[2rem] overflow-hidden relative group bg-slate-100 flex items-center justify-center">
            {newWine.image ? <img src={newWine.image} className="w-full h-full object-cover" /> : <WineIcon size={64} className="text-slate-300"/>}
          </div>
          <div className="col-span-full border-t pt-6 space-y-4">
            <textarea placeholder="ソムリエのテイスティングノート" value={newWine.taste} onChange={e => setNewWine({...newWine, taste: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl font-bold h-24 outline-none" />
            <textarea placeholder="生産者背景・物語" value={newWine.description} onChange={e => setNewWine({...newWine, description: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl font-bold h-32 outline-none" />
          </div>
        </div>
        <button onClick={handleSave} className="w-full mt-10 bg-slate-900 text-white py-6 rounded-3xl font-black text-2xl shadow-2xl active:scale-95 transition">
          {editingId ? "更新する" : "セラーに登録する"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 pb-24">
        {wines.map((wine: any) => (
          <div key={wine.id} className="bg-white p-4 rounded-3xl border shadow-sm relative group hover:shadow-lg transition">
            <button onClick={() => {setNewWine(wine); setEditingId(wine.id); window.scrollTo(0,0)}} className="absolute top-2 right-2 p-2 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow text-blue-600"><Edit3 size={14}/></button>
            <div className="aspect-square rounded-2xl bg-slate-50 mb-3 overflow-hidden"><img src={wine.image} className="w-full h-full object-cover" /></div>
            <p className="text-xs font-black truncate">{wine.name_jp}</p>
            <p className="text-[12px] font-black text-amber-600">¥{Number(wine.price).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
