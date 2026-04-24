"use client";

export const runtime = 'edge';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, Plus, Search, ArrowLeft, Save, X, 
  Wine, Sparkles, Image as ImageIcon, Trash2, 
  ChevronRight, Loader2, Globe, 
  AlertCircle, CheckCircle2, Sliders, Info,
  Star, Target, Zap
} from 'lucide-react';

/**
 * ユーティリティ: 環境に応じた安全なURL生成
 */
const getSafeUrl = (path: string) => {
  if (typeof window === 'undefined') return path;
  if (!path) return '/admin';
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  try {
    const origin = window.location.origin;
    if (origin && origin !== 'null' && !origin.startsWith('blob:')) {
      return origin.replace(/\/+$/, '') + cleanPath;
    }
    const base = window.location.href.split('?')[0].split('#')[0]
      .replace(/\/(admin|master|partner|\[slug\]).*/, '');
    return base.replace(/\/+$/, '') + cleanPath;
  } catch (e) {
    return cleanPath;
  }
};

/**
 * 味わいプロファイルのレーダーチャート・プレビュー
 */
function RadarPreview({ data }: { data: any }) {
  const size = 160, center = 80, maxR = 60;
  const keys = ['body', 'aroma_intensity', 'sweetness', 'complexity', 'tannins', 'finish', 'acidity', 'oak'];
  const labels = ['ボディ', '香り', '甘味', '複雑さ', '渋み', '余韻', '酸味', '樽感'];
  
  const points = keys.map((k, i) => {
    const angle = (i * 45 - 90) * (Math.PI / 180);
    const val = Number(data[k]) || 3;
    const r = (val / 5) * maxR;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  }).join(' ');

  return (
    <div className="bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] p-6 flex flex-col items-center gap-4 border border-white/10 shadow-2xl">
      <div className="flex items-center gap-2">
        <Target size={14} className="text-amber-500" />
        <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Sensory Analytics</span>
      </div>
      <svg width={size} height={size} className="overflow-visible">
        {/* 背景の同心円 */}
        {[1,2,3,4,5].map(l => (
          <circle key={l} cx={center} cy={center} r={(l/5)*maxR} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}
        {/* 軸線 */}
        {keys.map((_, i) => {
          const angle = (i * 45 - 90) * (Math.PI / 180);
          return <line key={i} x1={center} y1={center} x2={center + maxR * Math.cos(angle)} y2={center + maxR * Math.sin(angle)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
        })}
        {/* データポリゴン */}
        <polygon points={points} fill="rgba(245, 158, 11, 0.2)" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round" />
        {/* 頂点のドット */}
        {keys.map((k, i) => {
          const angle = (i * 45 - 90) * (Math.PI / 180);
          const r = (Number(data[k]) || 3) / 5 * maxR;
          return <circle key={i} cx={center + r * Math.cos(angle)} cy={center + r * Math.sin(angle)} r="3" fill="#f59e0b" />;
        })}
      </svg>
    </div>
  );
}

/**
 * メインコンポーネント: マスター管理
 */
export default function MasterAdmin() {
  const [wines, setWines] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingWine, setEditingWine] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);

  // マスターデータ取得
  const fetchMaster = async () => {
    setLoading(true);
    try {
      const res = await fetch(getSafeUrl('/api/master/list'));
      if (res.ok) {
        const data = await res.json();
        setWines(Array.isArray(data) ? data : []);
      }
    } catch (e) { console.error(e); }
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
        setStatus({ type: 'success', msg: 'マスタを更新しました' });
        setEditingWine(null);
        fetchMaster();
        setTimeout(() => setStatus(null), 3000);
      }
    } catch {
      setStatus({ type: 'error', msg: '保存に失敗しました' });
    }
    setSaving(false);
  };

  // 新規作成初期値
  const handleCreateNew = () => {
    setEditingWine({
      id: `P-${Math.floor(1000000 + Math.random() * 9000000)}`,
      name_jp: "", name_en: "", country: "フランス", region: "", grape: "",
      vintage: new Date().getFullYear().toString(), price_bottle: 5000,
      image_url: "", ai_explanation: "",
      body: 3, aroma_intensity: 3, sweetness: 3, complexity: 3, tannins: 3, finish: 3, acidity: 3, oak: 3,
      is_priority: 0
    });
  };

  if (editingWine) {
    return (
      <div className="min-h-screen bg-[#050505] text-white pb-32 animate-in slide-in-from-right-4 duration-500 font-sans">
        {/* 編集ヘッダー */}
        <header className="sticky top-0 z-[100] bg-black/60 backdrop-blur-xl border-b border-white/5 p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setEditingWine(null)} className="p-2.5 bg-white/5 rounded-full active:scale-90 transition-all border border-white/10 text-white/60"><ArrowLeft size={20}/></button>
            <div>
              <h1 className="text-xs font-black uppercase tracking-[0.3em] text-amber-500">Master Record Editor</h1>
              <p className="text-sm font-bold truncate max-w-[150px]">{editingWine.name_jp || 'Untitled Wine'}</p>
            </div>
          </div>
          <button 
            type="submit" form="wine-form" disabled={saving} 
            className="bg-amber-500 text-black px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
            Sync Database
          </button>
        </header>

        <form id="wine-form" onSubmit={handleSave} className="max-w-3xl mx-auto p-6 space-y-12">
          {/* 基本設定 */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-white/30 px-2">
              <Zap size={14} className="text-amber-500" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">Core Specification</h2>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-white/30 ml-4 uppercase tracking-widest">商品名 (日本語)</label>
                  <input required type="text" value={editingWine.name_jp} onChange={e => setEditingWine({...editingWine, name_jp: e.target.value})} className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl font-bold outline-none focus:border-amber-500/50 transition-all" placeholder="例：パスカルトソ・レゼルヴァ" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-white/30 ml-4 uppercase tracking-widest">Wine Name (English)</label>
                  <input required type="text" value={editingWine.name_en} onChange={e => setEditingWine({...editingWine, name_en: e.target.value})} className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl font-bold outline-none focus:border-amber-500/50 transition-all" placeholder="Chateau Pieroth..." />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-white/30 ml-2 uppercase">Country</label>
                  <input type="text" value={editingWine.country} onChange={e => setEditingWine({...editingWine, country: e.target.value})} className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl font-bold outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-white/30 ml-2 uppercase">Vintage</label>
                  <input type="text" value={editingWine.vintage} onChange={e => setEditingWine({...editingWine, vintage: e.target.value})} className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl font-bold outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-white/30 ml-2 uppercase">Base Price (¥)</label>
                  <input type="number" value={editingWine.price_bottle} onChange={e => setEditingWine({...editingWine, price_bottle: parseInt(e.target.value)})} className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl font-bold outline-none text-amber-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-white/30 ml-2 uppercase">Priority</label>
                  <button type="button" onClick={() => setEditingWine({...editingWine, is_priority: editingWine.is_priority === 1 ? 0 : 1})} className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 border transition-all ${editingWine.is_priority === 1 ? 'bg-amber-500 border-amber-500 text-black' : 'bg-white/5 border-white/10 text-white/40'}`}>
                    <Star size={14} fill={editingWine.is_priority === 1 ? 'currentColor' : 'none'} />
                    <span className="text-[9px] font-black uppercase">Featured</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* メディア・解説 */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-white/30 px-2">
              <ImageIcon size={14} className="text-amber-500" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">Media & AI Assets</h2>
            </div>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-48 aspect-[2/3] bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center justify-center overflow-hidden shrink-0 group relative">
                {editingWine.image_url ? (
                  <img src={editingWine.image_url} className="w-full h-full object-contain p-6 drop-shadow-2xl" alt="" />
                ) : (
                  <ImageIcon className="text-white/10" size={48}/>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                  <p className="text-[8px] font-black text-center text-amber-500 leading-relaxed uppercase">Update visual via URL field</p>
                </div>
              </div>
              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-white/30 ml-4 uppercase tracking-widest">Image Source URL</label>
                  <input type="url" value={editingWine.image_url} onChange={e => setEditingWine({...editingWine, image_url: e.target.value})} className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl font-bold outline-none text-xs text-indigo-400" placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-white/30 ml-4 uppercase tracking-widest italic flex items-center gap-1.5"><Sparkles size={10} className="text-amber-500"/> AI Sommelier Explanation (JP)</label>
                  <textarea rows={6} value={editingWine.ai_explanation} onChange={e => setEditingWine({...editingWine, ai_explanation: e.target.value})} className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl text-xs font-medium leading-relaxed outline-none focus:border-amber-500/50 transition-all placeholder:text-white/5" placeholder="ソムリエAIが公開メニューで語る解説文を記述してください..." />
                </div>
              </div>
            </div>
          </section>

          {/* 官能プロファイル設定 */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3 text-white/30">
                <Sliders size={14} className="text-amber-500" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">Sensory Profile Setting</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="order-2 lg:order-1 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem]">
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
                      <label className="text-[11px] font-black text-white/40 uppercase tracking-tighter">{item.label}</label>
                      <span className="text-xs font-black text-amber-500">{editingWine[item.key] || 3}</span>
                    </div>
                    <input 
                      type="range" min="1" max="5" step="1" 
                      value={editingWine[item.key] || 3} 
                      onChange={e => setEditingWine({...editingWine, [item.key]: parseInt(e.target.value)})}
                      className="w-full accent-amber-500 bg-white/10 h-1 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                ))}
              </div>
              <div className="order-1 lg:order-2 flex justify-center">
                <RadarPreview data={editingWine} />
              </div>
            </div>
          </section>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-40 font-sans">
      {/* メインリストヘッダー */}
      <header className="bg-slate-900 text-white px-6 py-6 sticky top-0 z-[100] flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => window.location.href = getSafeUrl('/admin')} className="p-2.5 bg-white/10 rounded-full active:scale-90 transition-all border border-white/10 text-white/60"><ArrowLeft size={20}/></button>
          <div>
            <h1 className="text-lg font-black italic tracking-tighter uppercase leading-none">Master Database</h1>
            <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mt-1">Pieroth Global Inventory</p>
          </div>
        </div>
        <button type="button" onClick={handleCreateNew} className="w-12 h-12 bg-amber-500 text-black rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all shadow-amber-500/20"><Plus size={24} strokeWidth={4}/></button>
      </header>

      <main className="max-w-2xl mx-auto p-5 space-y-6">
        {/* 検索バー */}
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={20}/>
          <input 
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="商品名・商品IDで検索..." 
            className="w-full h-16 pl-16 pr-8 bg-slate-50 border border-slate-200 rounded-3xl font-bold outline-none focus:ring-4 ring-amber-500/5 focus:border-amber-500/20 transition-all shadow-sm" 
          />
        </div>

        {/* ワインリスト */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-24 text-center animate-pulse">
              <Database className="mx-auto text-slate-100 mb-4" size={56} />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Synchronizing Master Data...</p>
            </div>
          ) : filteredWines.length === 0 ? (
            <div className="py-24 text-center">
              <Info className="mx-auto text-slate-200 mb-3" size={40} />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching records found</p>
            </div>
          ) : filteredWines.map(w => (
            <div key={w.id} onClick={() => setEditingWine(w)} className="group bg-white border border-slate-100 rounded-[2.5rem] p-5 flex gap-6 hover:border-amber-500/30 transition-all duration-500 cursor-pointer shadow-sm hover:shadow-xl active:scale-[0.98]">
              <div className="w-20 h-32 bg-slate-50 border border-slate-100 rounded-[2rem] p-3 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                <img src={w.image_url} className="w-full h-full object-contain drop-shadow-md" alt="" onError={(e:any)=>e.target.src='https://placehold.co/100x150?text=NO+IMAGE'}/>
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[8px] font-black bg-slate-900 text-white px-2 py-0.5 rounded uppercase">ID: {w.id}</span>
                    <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">{w.country}</span>
                    {w.is_priority === 1 && <Star size={10} className="fill-amber-500 text-amber-500" />}
                  </div>
                  <h3 className="text-base font-black text-slate-900 leading-tight group-hover:text-amber-600 transition-colors line-clamp-2">{w.name_jp}</h3>
                  <p className="text-[10px] font-bold text-slate-400 italic truncate mt-1">{w.name_en}</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                  <p className="text-xs font-black text-slate-300 uppercase tracking-tighter">Sensory: {w.body}/5 Body</p>
                  <div className="flex items-center gap-1 text-[10px] font-black text-indigo-500 opacity-0 group-hover:opacity-100 transition-all uppercase tracking-widest">Edit Entry <ChevronRight size={14}/></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ステータス通知 */}
      {status && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-4 ${status.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {status.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
          <span className="text-xs font-black uppercase tracking-widest">{status.msg}</span>
        </div>
      )}

      {/* ボトムナビゲーション */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-fit bg-white/95 backdrop-blur-md border border-slate-200 rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex items-center px-2 py-2 gap-1 z-[150]">
        <button type="button" onClick={() => window.location.href = getSafeUrl('/admin')} className="flex items-center gap-2.5 px-7 py-3.5 rounded-full text-slate-400 hover:text-slate-900 transition-all duration-300">
          <Globe size={18}/><span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
        </button>
        <div className="w-[1px] h-4 bg-slate-200 mx-1" />
        <button type="button" className="flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-slate-900 text-white shadow-lg transition-all duration-300">
          <Database size={18}/><span className="text-[10px] font-black uppercase tracking-widest">Master DB</span>
        </button>
      </nav>
    </div>
  );
}
