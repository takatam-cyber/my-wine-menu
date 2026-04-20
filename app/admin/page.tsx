"use client";

import { useState, useEffect } from 'react';
import { 
  Camera, Loader2, Wine as WineIcon, Edit3, LogOut, Save, Download, Upload, Trash2, ExternalLink, ChevronRight, Info
} from 'lucide-react';

export default function AdminPage() {
  const [auth, setAuth] = useState({ email: '', pass: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [config, setConfig] = useState({ menu_name: '' });
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialWineState = {
    image_filename: '', id: '', name_jp: '', name_en: '', country: '', region: '', 
    grape: '', color: '赤', type: 'ミディアム', vintage: '', alcohol: '',
    price_bottle: '', price_glass: '', cost: '', stock: '0', ideal_stock: '',
    supplier: '', storage: '', ai_explanation: '', menu_short: '', pairing: '',
    sweetness: '3', body: '3', acidity: '3', tannin: '3', aroma_intensity: '3',
    complexity: '3', aftertaste: '3', oak: '3', aroma_features: '', tags: '',
    best_drinking: '', image: '', visible: 'ON'
  };
  const [newWine, setNewWine] = useState(initialWineState);

  useEffect(() => {
    const savedEmail = localStorage.getItem('wine_store_email');
    if (savedEmail) { setAuth(prev => ({ ...prev, email: savedEmail })); setIsLoggedIn(true); }
  }, []);

  useEffect(() => { 
    if (isLoggedIn && auth.email) {
      fetchWines();
      fetch(`/api/config`, { headers: { 'x-store-id': auth.email } }).then(res => res.json()).then(data => setConfig(data));
    }
  }, [isLoggedIn, auth.email]);

  const fetchWines = async () => {
    const res = await fetch(`/api/wines`, { headers: { 'x-store-id': auth.email } });
    const data = await res.json();
    setWines(Array.isArray(data) ? data : []);
  };

  const handleScan = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const originalFileName = file.name;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const { url } = await uploadRes.json();
      setNewWine(prev => ({ ...prev, image: url, image_filename: originalFileName }));
      const scanRes = await fetch('/api/scan', { method: 'POST', headers: { 'x-store-id': auth.email }, body: JSON.stringify({ image: url }) });
      const scanData = await scanRes.json();
      if (scanData.result) {
        const ai = JSON.parse(scanData.result);
        setNewWine(prev => ({ ...prev, name_en: ai.name_en, color: ai.color }));
      }
    } catch (err) { alert("解析失敗"); } finally { setLoading(false); }
  };

  const handleSaveWine = async () => {
    const wineData = editingId ? { ...newWine, id: editingId } : { ...newWine, id: Date.now().toString() };
    await fetch('/api/wines', { method: 'POST', headers: { 'x-store-id': auth.email }, body: JSON.stringify(wineData) });
    setNewWine(initialWineState); setEditingId(null); fetchWines();
    alert("保存完了");
  };

  const exportCSV = () => {
    const headers = "画像ファイル名,ID,ワイン名(日),ワイン名(英),生産国,地域,主要品種,色,タイプ,ヴィンテージ,アルコール,ボトル価格,グラス価格,原価,在庫数,適正在庫,仕入先,保管場所,AI解説,メニュー用短文,ペアリング,甘味,ボディ,酸味,渋み,香り強,複雑性,余韻,樽感,香りの特徴,タグ,飲み頃,画像URL,表示\n";
    const csvContent = wines.map((w: any) => 
      `"${w.image_filename||''}",${w.id},"${w.name_jp}","${w.name_en}","${w.country}","${w.region}","${w.grape}",${w.color},${w.type},${w.vintage},${w.alcohol},${w.price_bottle},${w.price_glass},${w.cost},${w.stock},${w.ideal_stock},"${w.supplier}","${w.storage}","${(w.ai_explanation||'').replace(/"/g,'""')}","${(w.menu_short||'').replace(/"/g,'""')}","${w.pairing}",${w.sweetness},${w.body},${w.acidity},${w.tannin},${w.aroma_intensity},${w.complexity},${w.aftertaste},${w.oak},"${w.aroma_features}","${w.tags}","${w.best_drinking}","${w.image}",${w.visible}`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `wine_list_full.csv`;
    link.click();
  };

  const importCSV = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        // 改行で分割し、空行を事前に除外
        const rows = text.split(/\r?\n/).filter(l => l.trim().length > 0).slice(1);
        
        const imported = rows.map(row => {
          // 各セルをトリムして、余計な改行や空白を除去
          const c = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          return {
            image_filename: c[0], id: c[1] || Date.now().toString(), name_jp: c[2], name_en: c[3], country: c[4], region: c[5],
            grape: c[6], color: c[7], type: c[8], vintage: c[9], alcohol: c[10],
            price_bottle: c[11], price_glass: c[12], cost: c[13], stock: c[14], ideal_stock: c[15],
            supplier: c[16], storage: c[17], ai_explanation: c[18], menu_short: c[19], pairing: c[20],
            sweetness: c[21], body: c[22], acidity: c[23], tannin: c[24], aroma_intensity: c[25],
            complexity: c[26], aftertaste: c[27], oak: c[28], aroma_features: c[29], tags: c[30],
            best_drinking: c[31], image: c[32], visible: c[33] || 'ON'
          };
        }).filter(w => w.name_jp && w.name_jp.length > 0); // 名前がある有効な行のみを抽出

        if (confirm(`${imported.length}件をインポートしますか？（末尾の空行は除外されました）`)) {
          setLoading(true);
          await fetch('/api/wines/bulk', { method: 'POST', headers: { 'x-store-id': auth.email }, body: JSON.stringify(imported) });
          fetchWines();
          alert("インポート完了");
        }
      } catch (err) { alert("CSVエラー"); } finally { setLoading(false); }
    };
    reader.readAsText(file);
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl">
        <h1 className="text-3xl font-black mb-8 text-center uppercase tracking-tighter">Admin Login</h1>
        <input type="email" placeholder="Email" value={auth.email} onChange={e => setAuth({...auth, email: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-bold mb-4 outline-none" />
        <input type="password" placeholder="Pass" value={auth.pass} onChange={e => setAuth({...auth, pass: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-bold mb-6 outline-none" />
        <button onClick={() => { localStorage.setItem('wine_store_email', auth.email); setIsLoggedIn(true); }} className="w-full bg-black text-white py-5 rounded-2xl font-black">ログイン</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 bg-slate-50 min-h-screen text-black font-sans pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white p-2 rounded-xl"><WineIcon size={24}/></div>
          <div>
            <h1 className="text-sm font-black opacity-30 uppercase tracking-tighter">Store Admin</h1>
            <p className="font-bold truncate max-w-[200px]">{auth.email}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <a href={`/${encodeURIComponent(auth.email)}`} target="_blank" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg">
            <ExternalLink size={18}/> メニューを確認
          </a>
          <button onClick={() => {localStorage.clear(); location.reload();}} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-red-500"><LogOut size={20}/></button>
        </div>
      </div>

      <div className="flex gap-2 mb-8">
        <button onClick={exportCSV} className="flex-1 bg-white border-2 border-slate-200 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 active:scale-95"><Download size={16}/> CSV出力</button>
        <label className="flex-1 bg-white border-2 border-slate-200 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95">
          <Upload size={16}/> CSV取込<input type="file" accept=".csv" onChange={importCSV} className="hidden" />
        </label>
      </div>

      <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-2xl border border-slate-100 mb-8 space-y-8">
        <h2 className="text-xl font-black flex items-center gap-2 border-b pb-4"><Edit3 size={20}/> ワイン詳細情報の登録</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <label className="aspect-[3/4] bg-slate-50 rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center relative cursor-pointer border-4 border-dashed border-slate-100 group">
              {newWine.image ? <img src={newWine.image} className="w-full h-full object-cover" /> : <div className="text-center"><Camera size={48} className="mx-auto text-slate-200 mb-2"/><p className="text-[10px] font-black text-slate-300 uppercase">ラベル写真を撮影</p></div>}
              {loading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="text-white animate-spin" size={48} /></div>}
              <input type="file" accept="image/*" capture="environment" onChange={handleScan} className="hidden" />
            </label>
            <div className="space-y-3">
              <div className="relative"><span className="absolute top-1 left-4 text-[8px] text-slate-400 font-bold uppercase">Image Filename</span><input type="text" value={newWine.image_filename} onChange={e => setNewWine({...newWine, image_filename: e.target.value})} className="w-full pt-5 pb-2 px-4 bg-slate-50 rounded-2xl border-2 font-bold" /></div>
              <input type="text" placeholder="ワイン名 (日本語)" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 font-bold focus:border-black outline-none" />
              <input type="text" placeholder="Wine Name (English)" value={newWine.name_en} onChange={e => setNewWine({...newWine, name_en: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 font-bold focus:border-black outline-none" />
            </div>
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <select value={newWine.color} onChange={e => setNewWine({...newWine, color: e.target.value})} className="p-4 bg-slate-100 rounded-2xl font-black"><option value="赤">赤</option><option value="白">白</option><option value="ロゼ">ロゼ</option><option value="泡">泡</option></select>
              <select value={newWine.visible} onChange={e => setNewWine({...newWine, visible: e.target.value})} className={`p-4 rounded-2xl font-black ${newWine.visible==='ON'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}><option value="ON">表示ON</option><option value="OFF">表示OFF</option></select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="生産国" value={newWine.country} onChange={e => setNewWine({...newWine, country: e.target.value})} className="p-4 bg-slate-50 rounded-2xl border-2" />
              <input type="text" placeholder="地域" value={newWine.region} onChange={e => setNewWine({...newWine, region: e.target.value})} className="p-4 bg-slate-50 rounded-2xl border-2" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input type="text" placeholder="主要品種" value={newWine.grape} onChange={e => setNewWine({...newWine, grape: e.target.value})} className="col-span-2 p-4 bg-slate-50 rounded-2xl border-2" />
              <input type="text" placeholder="2017" value={newWine.vintage} onChange={e => setNewWine({...newWine, vintage: e.target.value})} className="p-4 bg-slate-50 rounded-2xl border-2" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="relative"><span className="absolute top-1 left-4 text-[8px] text-amber-600 font-bold">ボトル価格</span><input type="number" value={newWine.price_bottle} onChange={e => setNewWine({...newWine, price_bottle: e.target.value})} className="w-full pt-5 pb-2 px-4 bg-amber-50 rounded-2xl font-black" /></div>
              <div className="relative"><span className="absolute top-1 left-4 text-[8px] text-amber-600 font-bold">グラス価格</span><input type="number" value={newWine.price_glass} onChange={e => setNewWine({...newWine, price_glass: e.target.value})} className="w-full pt-5 pb-2 px-4 bg-amber-50 rounded-2xl font-black" /></div>
              <div className="relative"><span className="absolute top-1 left-4 text-[8px] text-slate-400 font-bold">原価</span><input type="number" value={newWine.cost} onChange={e => setNewWine({...newWine, cost: e.target.value})} className="w-full pt-5 pb-2 px-4 bg-slate-100 rounded-2xl font-black" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative"><span className="absolute top-1 left-4 text-[8px] text-green-600 font-bold">在庫数</span><input type="number" value={newWine.stock} onChange={e => setNewWine({...newWine, stock: e.target.value})} className="w-full pt-5 pb-2 px-4 bg-green-50 rounded-2xl font-black" /></div>
              <div className="relative"><span className="absolute top-1 left-4 text-[8px] text-green-600 font-bold">適正数</span><input type="number" value={newWine.ideal_stock} onChange={e => setNewWine({...newWine, ideal_stock: e.target.value})} className="w-full pt-5 pb-2 px-4 bg-green-50 rounded-2xl font-black" /></div>
            </div>
            <input type="text" placeholder="仕入先" value={newWine.supplier} onChange={e => setNewWine({...newWine, supplier: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2" />
            <input type="text" placeholder="保管場所" value={newWine.storage} onChange={e => setNewWine({...newWine, storage: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2" />
          </div>
        </div>

        <div className="bg-slate-50 p-6 md:p-8 rounded-[2.5rem] space-y-6">
          <p className="text-[10px] font-black text-slate-400 uppercase text-center tracking-widest">Tasting Profile (0-5)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <input type="text" placeholder="香りの特徴" value={newWine.aroma_features} onChange={e => setNewWine({...newWine, aroma_features: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2" />
          <textarea placeholder="AI解説" value={newWine.ai_explanation} onChange={e => setNewWine({...newWine, ai_explanation: e.target.value})} className="w-full p-5 bg-slate-50 rounded-[2rem] border-2 h-32" />
          <input type="text" placeholder="メニュー用短文" value={newWine.menu_short} onChange={e => setNewWine({...newWine, menu_short: e.target.value})} className="w-full p-4 bg-amber-50 rounded-2xl border-2 border-amber-100 font-bold" />
          <input type="text" placeholder="ペアリング料理" value={newWine.pairing} onChange={e => setNewWine({...newWine, pairing: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2" />
          <div className="grid grid-cols-2 gap-4">
             <input type="text" placeholder="タグ" value={newWine.tags} onChange={e => setNewWine({...newWine, tags: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2" />
             <input type="text" placeholder="飲み頃" value={newWine.best_drinking} onChange={e => setNewWine({...newWine, best_drinking: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2" />
          </div>
        </div>

        <button onClick={handleSaveWine} className="w-full bg-black text-white py-7 rounded-[2.5rem] font-black text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
          <Save size={24}/> {editingId ? 'ワイン情報を更新' : '台帳に登録する'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {wines.map((wine: any) => (
          <div key={wine.id} className="bg-white p-5 rounded-[2.5rem] flex items-center gap-6 shadow-sm border border-slate-100 group">
            <img src={wine.image} className="w-20 h-24 rounded-2xl object-cover shadow-sm bg-slate-50" />
            <div className="flex-1 min-w-0">
              <p className="font-black text-lg truncate text-black">{wine.name_jp}</p>
              <p className="font-bold text-amber-600 text-sm italic">B:¥{wine.price_bottle} <span className="text-slate-300 ml-2">在庫: {wine.stock}</span></p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => {setNewWine(wine); setEditingId(wine.id); window.scrollTo({top: 400, behavior:'smooth'});}} className="p-4 bg-slate-50 rounded-2xl text-slate-300 hover:text-black transition-all"><Edit3 size={20}/></button>
              <button onClick={async () => { if(confirm("削除しますか？")) { await fetch('/api/wines', { method: 'DELETE', headers: { 'x-store-id': auth.email }, body: JSON.stringify({ id: wine.id }) }); fetchWines(); } }} className="p-4 bg-red-50 rounded-2xl text-red-200 hover:text-red-500 transition-all"><Trash2 size={20}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlavorDot({ label, val, set }: any) {
  return (
    <div className="space-y-1.5 flex-1 min-w-[120px]">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter block ml-1">{label}</span>
      <div className="flex gap-1 items-center">
        <button 
          onClick={() => set("0")} 
          className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${val === "0" ? 'bg-slate-800 text-white' : 'bg-white border-2 text-slate-300'}`}
        >
          0
        </button>
        {[1,2,3,4,5].map(v => (
          <button key={v} onClick={() => set(v.toString())} className={`h-6 flex-1 rounded-full transition-all ${parseInt(val) >= v && val !== "0" ? 'bg-[#2f5d3a]' : 'bg-white border-2'}`}></button>
        ))}
      </div>
    </div>
  );
}
