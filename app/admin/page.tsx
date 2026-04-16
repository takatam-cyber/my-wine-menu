"use client";

import { useState, useEffect } from 'react';
import { Camera, Save, Loader2, Wine as WineIcon, Trash2, Edit3, Download, Upload, X, Plus, Minus } from 'lucide-react';

export default function AdminPage() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newWine, setNewWine] = useState({
    id: '', name_jp: '', name_en: '', country: '', region: '', grape: '', type: '赤', 
    vintage: '', price: '', cost: '', stock: '0', advice: '', image: ''
  });

  useEffect(() => { fetchWines(); }, []);

  const fetchWines = async () => {
    const res = await fetch('/api/wines');
    const data = await res.json();
    setWines(Array.isArray(data) ? data : []);
  };

  const updateStock = async (wine: any, delta: number) => {
    const updated = { ...wine, stock: String(Math.max(0, (parseInt(wine.stock) || 0) + delta)) };
    await fetch('/api/wines', { method: 'POST', body: JSON.stringify(updated) });
    fetchWines();
  };

  const handleSave = async () => {
    await fetch('/api/wines', { method: 'POST', body: JSON.stringify(newWine) });
    setNewWine({ id:'', name_jp:'', name_en:'', country:'', region:'', grape:'', type:'赤', vintage:'', price:'', cost:'', stock:'0', advice:'', image:'' });
    setEditingId(null);
    fetchWines();
    alert("保存しました");
  };

  // --- 強化版CSVインポート ---
  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/);
      const rows = lines.slice(1); // ヘッダーを飛ばす

      let count = 0;
      for (let row of rows) {
        if (!row.trim()) continue;

        // CSVの各項目を分解（カンマ区切り、引用符対応）
        const cols = [];
        let start = 0;
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
          if (row[i] === '"') inQuotes = !inQuotes;
          if (row[i] === ',' && !inQuotes) {
            cols.push(row.substring(start, i).replace(/^"|"$/g, '').replace(/""/g, '"'));
            start = i + 1;
          }
        }
        cols.push(row.substring(start).replace(/^"|"$/g, '').replace(/""/g, '"'));

        // 最低限「名前」があれば取り込むように緩和（13列なくてもOKに調整）
        if (cols.length >= 2) {
          await fetch('/api/wines', {
            method: 'POST',
            body: JSON.stringify({
              id: cols[0],
              name_jp: cols[1] || '',
              name_en: cols[2] || '',
              country: cols[3] || '',
              region: cols[4] || '',
              grape: cols[5] || '',
              type: cols[6] || '赤',
              vintage: cols[7] || '',
              price: cols[8] || '0',
              cost: cols[9] || '0',
              stock: cols[10] || '0',
              advice: cols[11] || '',
              image: cols[12] || ''
            })
          });
          count++;
        }
      }
      fetchWines();
      alert(`${count}件のデータを読み込みました。IDは自動で整理されます。`);
    };
    reader.readAsText(file);
  };

  const exportCSV = () => {
    const headers = "番号,カタカナ名,アルファベット,国,産地,品種,タイプ,年,販売価格,仕入れ値,在庫,オススメ解説,画像URL\n";
    const rows = wines.map((w: any) => `"${w.id}","${w.name_jp}","${w.name_en}","${w.country}","${w.region}","${w.grape}","${w.type}","${w.vintage}","${w.price}","${w.cost}","${w.stock}","${(w.advice||'').replace(/"/g,'""')}","${w.image}"`).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "wine_list.csv";
    link.click();
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-slate-50 min-h-screen font-sans text-black pb-24">
      {/* 画面上部のボタン群 */}
      <div className="flex justify-between items-center mb-6 pt-4">
        <h1 className="text-xl font-black uppercase">Wine Master</h1>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="p-2 bg-white border rounded-xl"><Download size={20}/></button>
          <label className="p-2 bg-white border rounded-xl cursor-pointer">
            <Upload size={20}/>
            <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
          </label>
        </div>
      </div>

      {/* 入力フォーム (前回のスマホ版をベースに各項目を追加) */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 mb-8 space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">カタカナ名</label>
          <input type="text" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-black font-bold text-lg border-2 border-slate-100 outline-none focus:border-black" />
        </div>
        
        {/* ...（中略：他の入力項目。前回お送りしたスマホ版と同じ構成で全項目配置）... */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-amber-600 ml-1">販売価格</label>
            <input type="number" value={newWine.price} onChange={e => setNewWine({...newWine, price: e.target.value})} className="w-full p-4 bg-amber-50 rounded-xl text-black font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-green-600 ml-1">在庫本数</label>
            <input type="number" value={newWine.stock} onChange={e => setNewWine({...newWine, stock: e.target.value})} className="w-full p-4 bg-green-50 rounded-xl text-black font-bold" />
          </div>
        </div>

        <button onClick={handleSave} className="w-full bg-black text-white py-5 rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all">保存する</button>
      </div>

      {/* 在庫リスト */}
      <div className="space-y-3">
        {wines.map((wine: any) => (
          <div key={wine.id} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm border border-slate-100">
            <img src={wine.image} className="w-16 h-16 rounded-2xl object-cover" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">#{wine.id} {wine.name_jp}</p>
              <p className="text-[10px] font-bold text-amber-600">¥{Number(wine.price).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl">
              <button onClick={() => updateStock(wine, -1)} className="p-1"><Minus size={18}/></button>
              <span className="font-black text-lg w-6 text-center">{wine.stock}</span>
              <button onClick={() => updateStock(wine, 1)} className="p-1"><Plus size={18}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
