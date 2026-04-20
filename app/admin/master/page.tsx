"use client";
import { useState } from 'react';
import { Upload, Database, CheckCircle, ArrowLeft } from 'lucide-react';

export default function MasterAdmin() {
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  const importCSV = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      setLoading(true);
      try {
        const text = event.target?.result as string;
        const rows = text.split(/\r?\n/).filter(l => l.trim().length > 0).slice(1);
        const imported = rows.map(row => {
          const c = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          return {
            id: c[1], name_jp: c[2], name_en: c[3], country: c[4], region: c[5], grape: c[6],
            color: c[7], type: c[8], vintage: c[9], alcohol: c[10], ai_explanation: c[18],
            menu_short: c[19], pairing: c[20], sweetness: c[21], body: c[22], acidity: c[23],
            tannin: c[24], aroma_intensity: c[25], complexity: c[26], aftertaste: c[27], oak: c[28],
            aroma_features: c[29], tags: c[30], best_drinking: c[31], image_url: c[32]
          };
        });

        const res = await fetch('/api/master/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(imported)
        });
        if (res.ok) {
          const data = await res.json();
          setCount(data.count);
          alert("マスターデータを更新しました！");
        }
      } catch (err) { alert("エラーが発生しました"); } finally { setLoading(false); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8">
      <div className="bg-zinc-900 p-12 rounded-[3rem] border border-zinc-800 text-center space-y-8 shadow-2xl max-w-md w-full">
        <Database size={64} className="mx-auto text-amber-500" />
        <h1 className="text-3xl font-black italic tracking-tighter">MASTER IMPORT</h1>
        <p className="text-zinc-400 font-bold text-sm">Gemini 3で作成した最新CSVを反映します</p>
        
        <label className="block w-full bg-white text-black py-6 rounded-2xl font-black text-xl cursor-pointer hover:bg-zinc-200 transition-all active:scale-95">
          {loading ? "更新中..." : "CSVを選択して更新"}
          <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
        </label>

        {count > 0 && (
          <div className="flex items-center justify-center gap-2 text-green-500 font-bold">
            <CheckCircle size={20} /> {count} 件のデータを同期しました
          </div>
        )}
        <a href="/admin" className="text-zinc-500 flex items-center justify-center gap-2 text-sm pt-4"><ArrowLeft size={16}/> 戻る</a>
      </div>
    </div>
  );
}
