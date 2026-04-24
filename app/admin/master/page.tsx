// app/admin/master/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, Plus, Search, ArrowLeft, Save, X, 
  Wine, Sparkles, Image as ImageIcon, Trash2, 
  ChevronRight, Loader2, Globe, 
  AlertCircle, CheckCircle2, Sliders, Info
} from 'lucide-react';

/**
 * ユーティリティ: 環境に応じた安全なURL生成
 * fetch や location.href で URL 解析エラーが発生するのを防ぐため、
 * 相対パスを絶対 URL に変換して返します。
 */
const getSafeUrl = (path: string) => {
  if (typeof window === 'undefined') return path;
  if (!path) return '/admin';
  if (path.startsWith('http')) return path;
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  try {
    const origin = window.location.origin;
    // 正常な origin が取得できる場合はそれを使用
    if (origin && origin !== 'null' && !origin.startsWith('blob:')) {
      return origin.replace(/\/+$/, '') + cleanPath;
    }
    // blob URL や origin が null の場合、現在の href からベース URL を構築
    const base = window.location.href.split('?')[0].split('#')[0]
      .replace(/\/(admin|master|partner|\[slug\]).*/, '');
    return base.replace(/\/+$/, '') + cleanPath;
  } catch (e) {
    return cleanPath;
  }
};

/**
 * レーダーチャート表示用（プレビュー）
 */
function RadarPreview({ data }: { data: any }) {
  const size = 120, center = 60, maxR = 40;
  const keys = ['body', 'aroma_intensity', 'sweetness', 'complexity', 'tannins', 'finish', 'acidity', 'oak'];
  const points = keys.map((k, i) => {
    const angle = (i * 45 - 90) * (Math.PI / 180);
    const val = Number(data[k]) || 3;
    const r = (val / 5) * maxR;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  }).join(' ');

  return (
    <div className="bg-slate-900 rounded-3xl p-4 flex flex-col items-center gap-2 border border-white/10 shadow-2xl">
      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Taste Profile</span>
      <svg width={size} height={size} className="overflow-visible">
        {[1,2,3,4,5].map(l => <circle key={l} cx={center} cy={center} r={(l/5)*maxR} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />)}
        <polygon points={points} fill="rgba(245, 158, 11, 0.3)" stroke="#f59e0b" strokeWidth="2" />
      </svg>
    </div>
  );
}

/**
 * メインコンポーネント
 */
export default function MasterAdmin() {
  const [wines, setWines] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingWine, setEditingWine] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);

  // データ取得
  const fetchMaster = async () => {
    setLoading(true);
    try {
      const url = getSafeUrl('/api/master/list');
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setWines(Array.isArray(data) ? data : []);
      }
    } catch (e: any) {
      console.error("Failed to fetch master", e.message || e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMaster(); }, []);

  // フィルタリング
  const filteredWines = useMemo(() => {
    return wines.filter(w => 
      w.name_jp?.includes(search) || 
      w.name_en?.toLowerCase().includes(search.toLowerCase()) || 
      w.id?.includes(search)
    );
  }, [wines, search]);

  // 保存処理
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWine) return;
    setSaving(true);
    try {
      const res = await fetch(getSafeUrl('/api/master/save'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingWine)
      });
      if (res.ok) {
        setStatus({ type: 'success', msg: '保存しました' });
        setEditingWine(null);
        fetchMaster();
        setTimeout(() => setStatus(null), 3000);
      } else {
        throw new Error();
      }
    } catch {
      setStatus({ type: 'error', msg: '保存に失敗しました' });
    }
    setSaving(false);
  };

  // 新規作成
  const handleCreateNew = () => {
    setEditingWine({
      id: `P-${Math.floor(1000000 + Math.random() * 9000000)}`,
      name_jp: "", name_en: "", country: "フランス", region: "", grape: "",
      vintage: new Date().getFullYear().toString(), price_bottle: 0,
      image_url: "", ai_explanation: "",
      body: 3, aroma_intensity: 3, sweetness: 3, complexity: 3, tannins: 3, finish: 3, acidity: 3, oak: 3,
      is_priority: 0
    });
  };

  // 安全なナビゲーション関数
  const navigateTo = (path: string) => {
    const url = getSafeUrl(path);
    if (url) {
      window.location.href = url;
    }
  };

  if (editingWine) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white pb-32 animate-in slide-in-from-right-4 duration-500">
        <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10 p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setEditingWine(null)} className="p-2 bg-white/5 rounded-full active:scale-90 transition-transform"><ArrowLeft size={20}/></button>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest">{editingWine.name_jp ? 'Edit Wine' : 'Add New Wine'}</h1>
              <p className="text-[10px] text-amber-500 font-bold">{editingWine.id || 'NEW MASTER RECORD'}</p>
            </div>
          </div>
          <button type="submit" form="wine-form" disabled={saving} className="bg-amber-500 text-black px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
            {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
            SAVE
          </button>
        </header>

        <form id="wine-form" onSubmit={handleSave} className="max-w-2xl mx-auto p-6 space-y-10">
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-amber-500/60 font-black text-[10px] tracking-[0.3em] uppercase"><Info size={14}/> Basic Information</div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 ml-2 uppercase">商品名 (日本語)</label>
                <input required type="text" value={editingWine.name_jp} onChange={e => setEditingWine({...editingWine, name_jp: e.target.value})} className="w-full h-14 px-5 bg-white/5 border border-white/10 rounded-2xl font-bold outline-none focus:border-amber-500/50" placeholder="例：パスカルトソ・レゼルヴァ" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 ml-2 uppercase">Wine Name (English)</label>
                <input required type="text" value={editingWine.name_en} onChange={e => setEditingWine({...editingWine, name_en: e.target.value})} className="w-full h-14 px-5 bg-white/5 border border-white/10 rounded-2xl font-bold outline-none focus:border-amber-500/50" placeholder="Chateau Pieroth..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 ml-2 uppercase">Country</label>
                  <input type="text" value={editingWine.country} onChange={e => setEditingWine({...editingWine, country: e.target.value})} className="w-full h-14 px-5 bg-white/5 border border-white/10 rounded-2xl font-bold outline-none focus:border-amber-500/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 ml-2 uppercase">Vintage</label>
                  <input type="text" value={editingWine.vintage} onChange={e => setEditingWine({...editingWine, vintage: e.target.value})} className="w-full h-14 px-5 bg-white/5 border border-white/10 rounded-2xl font-bold outline-none focus:border-amber-500/50" />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-2 text-amber-500/60 font-black text-[10px] tracking-[0.3em] uppercase"><ImageIcon size={14}/> Media & Content</div>
            <div className="flex gap-6 items-start">
              <div className="w-32 h-48 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center overflow-hidden shrink-0">
                {editingWine.image_url ? <img src={editingWine.image_url} className="w-full h-full object-contain p-4" alt="" /> : <ImageIcon className="text-white/10" size={32}/>}
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 ml-2 uppercase">Image URL</label>
                  <input type="url" value={editingWine.image_url} onChange={e => setEditingWine({...editingWine, image_url: e.target.value})} className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-xs font-bold outline-none" placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 ml-2 uppercase italic flex items-center gap-1.5"><Sparkles size={10}/> AI Explanation (JP)</label>
                  <textarea rows={4} value={editingWine.ai_explanation} onChange={e => setEditingWine({...editingWine, ai_explanation: e.target.value})} className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-xs font-medium leading-relaxed outline-none focus:border-amber-500/50" placeholder="AIによる解説文を入力してください..." />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-amber-500/60 font-black text-[10px] tracking-[0.3em] uppercase"><Sliders size={14}/> Sensory Profile</div>
              <RadarPreview data={editingWine} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem]">
              {[
                { key: 'body', label: 'ボディ' },
                { key: 'aroma_intensity', label: '香りの強さ' },
                { key: 'sweetness', label: '甘味' },
                { key: 'complexity', label: '複雑さ' },
                { key: 'tannins', label: '渋み/タンニン' },
                { key: 'finish', label: '余韻の長さ' },
                { key: 'acidity', label: '酸味' },
                { key: 'oak', label: '樽感' },
              ].map(item => (
                <div key={item.key} className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[11px] font-black text-white/60 uppercase">{item.label}</label>
                    <span className="text-xs font-black text-amber-500">{editingWine[item.key] || 3}</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" step="1" 
                    value={editingWine[item.key] || 3} 
                    onChange={e => setEditingWine({...editingWine, [item.key]: parseInt(e.target.value)})}
                    className="w-full accent-amber-500 bg-white/10 h-1.5 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </section>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-40">
      <header className="bg-slate-900 text-white px-6 py-6 sticky top-0 z-50 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigateTo('/admin')} className="p-2 bg-white/10 rounded-full active:scale-90 transition-transform"><ArrowLeft size={20}/></button>
          <div>
            <h1 className="text-lg font-black italic tracking-tighter uppercase leading-none">Master Database</h1>
            <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mt-1">Wine Inventory Master</p>
          </div>
        </div>
        <button type="button" onClick={handleCreateNew} className="w-12 h-12 bg-amber-500 text-black rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all"><Plus size={24} strokeWidth={4}/></button>
      </header>

      <main className="max-w-2xl mx-auto p-5 space-y-6">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={20}/>
          <input 
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="商品名・商品IDで検索..." 
            className="w-full h-16 pl-14 pr-6 bg-slate-50 border border-slate-200 rounded-[2rem] font-bold outline-none focus:ring-4 ring-amber-500/5 focus:border-amber-500/20 transition-all shadow-sm" 
          />
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center animate-pulse">
              <Database className="mx-auto text-slate-100 mb-4" size={48} />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Loading Master Database...</p>
            </div>
          ) : filteredWines.map(w => (
            <div key={w.id} onClick={() => setEditingWine(w)} className="group bg-white border border-slate-100 rounded-[2.5rem] p-5 flex gap-5 hover:border-amber-500/30 transition-all duration-500 cursor-pointer shadow-sm hover:shadow-xl active:scale-[0.98]">
              <div className="w-20 h-32 bg-slate-50 border border-slate-100 rounded-3xl p-3 shrink-0 flex items-center justify-center">
                <img src={w.image_url} className="w-full h-full object-contain drop-shadow-md" alt="" onError={(e:any)=>e.target.src='https://placehold.co/100x150?text=WINE'}/>
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">ID: {w.id}</span>
                    <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">{w.country}</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 leading-tight group-hover:text-amber-600 transition-colors line-clamp-2">{w.name_jp}</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 group-hover:text-amber-500 transition-colors uppercase tracking-widest">Edit <ChevronRight size={14}/></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {status && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-4 ${status.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {status.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
          <span className="text-xs font-black uppercase tracking-widest">{status.msg}</span>
        </div>
      )}

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-fit bg-white/95 backdrop-blur-md border border-slate-200 rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex items-center px-2 py-2 gap-1 z-[150]">
        <button type="button" onClick={() => navigateTo('/admin')} className="flex items-center gap-2.5 px-6 py-3 rounded-full text-slate-400 hover:text-slate-900 transition-all duration-300">
          <Globe size={18}/><span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
        </button>
        <div className="w-[1px] h-4 bg-slate-200 mx-1" />
        <button type="button" className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-slate-900 text-white shadow-lg transition-all duration-300">
          <Database size={18}/><span className="text-[10px] font-black uppercase tracking-widest">Master DB</span>
        </button>
      </nav>
    </div>
  );
}
