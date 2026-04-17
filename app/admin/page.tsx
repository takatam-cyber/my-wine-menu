// app/admin/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Camera, Loader2, Wine as WineIcon, Edit3, LogOut, Save, Download, Upload, Trash2, Info } from 'lucide-react';

export default function AdminPage() {
  const [auth, setAuth] = useState({ email: '', pass: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // A-AG列 (全33項目) に対応したステート
  const initialWineState = {
    id: '', name_jp: '', name_en: '', country: '', region: '', 
    grape: '', color: '赤', type: 'ミディアム', vintage: '', alcohol: '',
    price_bottle: '', price_glass: '', cost: '', stock: '0', ideal_stock: '',
    supplier: '', storage: '', ai_explanation: '', menu_short: '', pairing: '',
    sweetness: '3', body: '3', acidity: '3', tannin: '3', aroma_intensity: '3',
    complexity: '3', aftertaste: '3', oak: '3', aroma_features: '', tags: '',
    best_drinking: '', image: '', visible: 'ON'
  };
  const [newWine, setNewWine] = useState(initialWineState);

  // ... ログイン・認証ロジックは既存を維持 ...

  const fetchWines = async () => {
    const res = await fetch(`/api/wines`, { headers: { 'x-store-id': auth.email } });
    const data = await res.json();
    setWines(Array.isArray(data) ? data : []);
  };

  // CSVエクスポート (A-AG 33項目)
  const exportCSV = () => {
    const headers = "ID,ワイン名(日),ワイン名(英),生産国,地域,主要品種,色,タイプ,ヴィンテージ,アルコール,ボトル価格,グラス価格,原価,在庫数,適正在庫,仕入先,保管場所,AI解説,メニュー用短文,ペアリング,甘味,ボディ,酸味,渋み,香り強,複雑性,余韻,樽感,香りの特徴,タグ,飲み頃,画像URL,表示\n";
    const csvContent = wines.map((w: any) => 
      `${w.id},"${w.name_jp}","${w.name_en}","${w.country}","${w.region}","${w.grape}",${w.color},${w.type},${w.vintage},${w.alcohol},${w.price_bottle},${w.price_glass},${w.cost},${w.stock},${w.ideal_stock},"${w.supplier}","${w.storage}","${(w.ai_explanation||'').replace(/"/g,'""')}","${(w.menu_short||'').replace(/"/g,'""')}","${w.pairing}",${w.sweetness},${w.body},${w.acidity},${w.tannin},${w.aroma_intensity},${w.complexity},${w.aftertaste},${w.oak},"${w.aroma_features}","${w.tags}","${w.best_drinking}","${w.image}",${w.visible}`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `wine_inventory_33cols.csv`;
    link.click();
  };

  const importCSV = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split("\n").filter(l => l.trim()).slice(1);
        const imported = rows.map(row => {
          const c = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/^"|"$/g, '').replace(/""/g, '"'));
          return {
            id: c[0] || Date.now().toString(), name_jp: c[1], name_en: c[2], country: c[3], region: c[4],
            grape: c[5], color: c[6], type: c[7], vintage: c[8], alcohol: c[9],
            price_bottle: c[10], price_glass: c[11], cost: c[12], stock: c[13], ideal_stock: c[14],
            supplier: c[15], storage: c[16], ai_explanation: c[17], menu_short: c[18], pairing: c[19],
            sweetness: c[20], body: c[21], acidity: c[22], tannin: c[23], aroma_intensity: c[24],
            complexity: c[25], aftertaste: c[26], oak: c[27], aroma_features: c[28], tags: c[29],
            best_drinking: c[30], image: c[31], visible: c[32] || 'ON'
          };
        });
        if (confirm(`${imported.length}件を一括インポートしますか？`)) {
          setLoading(true);
          await fetch('/api/wines/bulk', { method: 'POST', headers: { 'x-store-id': auth.email }, body: JSON.stringify(imported) });
          fetchWines();
          alert("インポート完了");
        }
      } catch (err) { alert("CSVエラー"); } finally { setLoading(false); }
    };
    reader.readAsText(file);
  };

  const handleSaveWine = async () => {
    const wineData = editingId ? { ...newWine, id: editingId } : { ...newWine, id: Date.now().toString() };
    await fetch('/api/wines', { method: 'POST', headers: { 'x-store-id': auth.email }, body: JSON.stringify(wineData) });
    setNewWine(initialWineState); setEditingId(null); fetchWines();
    alert("保存しました");
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-slate-50 min-h-screen text-black font-sans pb-24">
      {/* 既存のヘッダー・認証ロジックを維持 */}
      
      <div className="flex gap-4 mb-8">
        <button onClick={exportCSV} className="flex-1 bg-white border-2 border-slate-200 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-100 transition-all shadow-sm"><Download size={20}/> 在庫CSV出力 (33項目)</button>
        <label className="flex-1 bg-white border-2 border-slate-200 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-all shadow-sm"><Upload size={20}/> 在庫CSV取込<input type="file" accept=".csv" onChange={importCSV} className="hidden" /></label>
      </div>

      <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 mb-8 space-y-6">
        <h2 className="text-xl font-black flex items-center gap-2 border-b pb-4"><WineIcon/> ワイン詳細台帳</h2>
        
        {/* 基本情報グリッド */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
             <label className="block text-[10px] font-bold text-slate-400">ワイン名(日/英)</label>
             <input type="text" placeholder="名前(日)" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-2 font-bold" />
             <input type="text" placeholder="Name(En)" value={newWine.name_en} onChange={e => setNewWine({...newWine, name_en: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-2" />
             <div className="flex gap-2">
               <select value={newWine.color} onChange={e => setNewWine({...newWine, color: e.target.value})} className="flex-1 p-3 bg-slate-100 rounded-xl font-black"><option value="赤">赤</option><option value="白">白</option><option value="ロゼ">ロゼ</option><option value="泡">泡</option></select>
               <select value={newWine.visible} onChange={e => setNewWine({...newWine, visible: e.target.value})} className={`flex-1 p-3 rounded-xl font-black ${newWine.visible==='ON'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}><option value="ON">表示ON</option><option value="OFF">表示OFF</option></select>
             </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-slate-400">スペック・価格</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="生産国" value={newWine.country} onChange={e => setNewWine({...newWine, country: e.target.value})} className="p-3 bg-slate-50 rounded-xl border-2" />
              <input type="text" placeholder="地域" value={newWine.region} onChange={e => setNewWine({...newWine, region: e.target.value})} className="p-3 bg-slate-50 rounded-xl border-2" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="主要品種" value={newWine.grape} onChange={e => setNewWine({...newWine, grape: e.target.value})} className="p-3 bg-slate-50 rounded-xl border-2" />
              <input type="text" placeholder="ヴィンテージ" value={newWine.vintage} onChange={e => setNewWine({...newWine, vintage: e.target.value})} className="p-3 bg-slate-50 rounded-xl border-2" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" placeholder="ボトル¥" value={newWine.price_bottle} onChange={e => setNewWine({...newWine, price_bottle: e.target.value})} className="p-3 bg-amber-50 rounded-xl font-bold" />
              <input type="number" placeholder="グラス¥" value={newWine.price_glass} onChange={e => setNewWine({...newWine, price_glass: e.target.value})} className="p-3 bg-amber-50 rounded-xl font-bold" />
              <input type="number" placeholder="原価¥" value={newWine.cost} onChange={e => setNewWine({...newWine, cost: e.target.value})} className="p-3 bg-slate-100 rounded-xl font-bold" />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-green-600">在庫・管理情報</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative"><span className="absolute top-1 left-3 text-[8px] text-green-600">在庫数</span><input type="number" value={newWine.stock} onChange={e => setNewWine({...newWine, stock: e.target.value})} className="w-full pt-4 pb-2 px-3 bg-green-50 rounded-xl font-black border-2 border-green-200" /></div>
              <div className="relative"><span className="absolute top-1 left-3 text-[8px] text-green-600">適正数</span><input type="number" value={newWine.ideal_stock} onChange={e => setNewWine({...newWine, ideal_stock: e.target.value})} className="w-full pt-4 pb-2 px-3 bg-green-50 rounded-xl font-black border-2 border-green-200" /></div>
            </div>
            <input type="text" placeholder="仕入先" value={newWine.supplier} onChange={e => setNewWine({...newWine, supplier: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-2" />
            <input type="text" placeholder="保管場所" value={newWine.storage} onChange={e => setNewWine({...newWine, storage: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-2" />
          </div>
        </div>

        {/* 味わい 3x3 グリッド */}
        <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase text-center">Tasting Profile</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FlavorDot label="甘味" val={newWine.sweetness} set={(v:any)=>setNewWine({...newWine, sweetness:v})}/>
            <FlavorDot label="ボディ" val={newWine.body} set={(v:any)=>setNewWine({...newWine, body:v})}/>
            <FlavorDot label="酸味" val={newWine.acidity} set={(v:any)=>setNewWine({...newWine, acidity:v})}/>
            <FlavorDot label="渋み" val={newWine.tannin} set={(v:any)=>setNewWine({...newWine, tannin:v})}/>
            <FlavorDot label="香り強" val={newWine.aroma_intensity} set={(v:any)=>setNewWine({...newWine, aroma_intensity:v})}/>
            <FlavorDot label="複雑性" val={newWine.complexity} set={(v:any)=>setNewWine({...newWine, complexity:v})}/>
            <FlavorDot label="余韻" val={newWine.aftertaste} set={(v:any)=>setNewWine({...newWine, aftertaste:v})}/>
            <FlavorDot label="樽感" val={newWine.oak} set={(v:any)=>setNewWine({...newWine, oak:v})}/>
          </div>
        </div>

        <div className="space-y-4">
          <input type="text" placeholder="香りの特徴 (例: 柑橘、ミネラル)" value={newWine.aroma_features} onChange={e => setNewWine({...newWine, aroma_features: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-2" />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="タグ (例: 希少, 限定)" value={newWine.tags} onChange={e => setNewWine({...newWine, tags: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-2" />
            <input type="text" placeholder="飲み頃 (例: 2026)" value={newWine.best_drinking} onChange={e => setNewWine({...newWine, best_drinking: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-2" />
          </div>
          <textarea placeholder="AI解説 (Sommelier's Note)" value={newWine.ai_explanation} onChange={e => setNewWine({...newWine, ai_explanation: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 h-24" />
          <input type="text" placeholder="メニュー用短文" value={newWine.menu_short} onChange={e => setNewWine({...newWine, menu_short: e.target.value})} className="w-full p-3 bg-amber-50 rounded-xl border-2 border-amber-100 font-bold" />
        </div>

        <button onClick={handleSaveWine} className="w-full bg-black text-white py-6 rounded-3xl font-black text-xl shadow-xl active:scale-95 transition-all"><Save className="inline-block mr-2"/> ワイン情報を保存</button>
      </div>
    </div>
  );
}

function FlavorDot({ label, val, set }: any) {
  return (
    <div className="space-y-1">
      <span className="text-[9px] font-black text-slate-400 uppercase block ml-1">{label}</span>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(v => (
          <button key={v} onClick={() => set(v.toString())} className={`h-6 flex-1 rounded-full transition-all ${parseInt(val) >= v ? 'bg-[#2f5d3a]' : 'bg-white border'}`}></button>
        ))}
      </div>
    </div>
  );
}
