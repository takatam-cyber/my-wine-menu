"use client";
export const runtime = 'edge';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Save, ArrowLeft, Loader2, Wine, Check, Filter } from 'lucide-react';

export default function InventoryManager({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [master, setMaster] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [inventory, setInventory] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // マスター全件と店舗の現在庫を同時に取得
    Promise.all([
      fetch('/api/master/list').then(res => res.json()),
      fetch(`/api/wines?slug=${slug}`).then(res => res.json())
    ]).then(([mList, sList]) => {
      setMaster(mList);
      // 既存在庫をMap形式で管理（高速アクセス用）
      const invMap: any = {};
      sList.forEach((w: any) => {
        invMap[w.id] = { active: true, price_bottle: w.price_bottle, price_glass: w.price_glass };
      });
      setInventory(invMap);
      setLoading(false);
    });
  }, [slug]);

  const toggleWine = (id: string) => {
    setInventory(prev => ({
      ...prev,
      [id]: { ...prev[id], active: !prev[id]?.active }
    }));
  };

  const updatePrice = (id: string, type: 'bottle' | 'glass', val: string) => {
    setInventory(prev => ({
      ...prev,
      [id]: { ...prev[id], [`price_${type}`]: parseInt(val) || 0 }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    // 有効なワインだけを抽出して送信
    const wineData = Object.entries(inventory)
      .filter(([_, v]) => v.active)
      .map(([id, v]) => ({ id, price_bottle: v.price_bottle || 0, price_glass: v.price_glass || 0 }));

    await fetch(`/api/wines/bulk`, {
      method: 'POST',
      body: JSON.stringify({ slug, wines: wineData })
    });
    setSaving(false);
    alert("100店舗対応メニューとして保存完了しました");
  };

  // 1,000件の中から高速フィルタリング
  const filteredMaster = master.filter(w => 
    w.name_jp.includes(searchQuery) || w.id.includes(searchQuery) || w.country.includes(searchQuery)
  );

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-black">ANALYZING MASTER DATA...</div>;

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-8 text-left selection:bg-amber-500">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
          <div className="flex items-center gap-6">
            <button onClick={() => router.push('/admin')} className="p-4 hover:bg-slate-50 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-slate-400"/>
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{slug} : Inventory</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">1,000銘柄からセレクト</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-95">
            {saving ? <Loader2 className="animate-spin" /> : <><Save size={20}/> 変更を確定</>}
          </button>
        </header>

        {/* 1,000件対応：超高速検索バー */}
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={24}/>
          <input 
            type="text" placeholder="ワイン名、国、IDで瞬時に検索..." 
            className="w-full p-8 pl-16 bg-white rounded-[2.5rem] border-2 border-transparent focus:border-amber-500 outline-none shadow-sm transition-all font-bold text-lg"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid gap-4">
          {filteredMaster.slice(0, 50).map(wine => ( // 表示は50件に制限してパフォーマンス維持
            <div key={wine.id} className={`bg-white p-6 rounded-[2rem] flex items-center gap-6 transition-all border-2 ${inventory[wine.id]?.active ? 'border-amber-500 shadow-lg ring-4 ring-amber-500/5' : 'border-transparent opacity-60'}`}>
              <div onClick={() => toggleWine(wine.id)} className="cursor-pointer relative shrink-0">
                <img src={wine.image_url} className="w-16 h-20 object-cover rounded-xl shadow-md" />
                {inventory[wine.id]?.active && (
                  <div className="absolute -top-2 -right-2 bg-amber-500 text-white rounded-full p-1 border-4 border-white">
                    <Check size={16} strokeWidth={4}/>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0" onClick={() => toggleWine(wine.id)}>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">{wine.country} / {wine.id}</p>
                <h3 className="font-black text-slate-900 text-lg truncate">{wine.name_jp}</h3>
              </div>
              
              {inventory[wine.id]?.active && (
                <div className="flex gap-4 animate-in fade-in slide-in-from-right-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-tighter">Bottle (¥)</label>
                    <input 
                      type="number" className="w-28 p-3 bg-slate-50 rounded-xl font-bold border-2 border-slate-100 focus:border-slate-900 outline-none"
                      value={inventory[wine.id].price_bottle || ''} 
                      onChange={e => updatePrice(wine.id, 'bottle', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-tighter">Glass (¥)</label>
                    <input 
                      type="number" className="w-28 p-3 bg-slate-50 rounded-xl font-bold border-2 border-slate-100 focus:border-slate-900 outline-none"
                      value={inventory[wine.id].price_glass || ''} 
                      onChange={e => updatePrice(wine.id, 'glass', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
          {filteredMaster.length > 50 && (
            <p className="text-center text-slate-400 font-bold py-4">...他 {filteredMaster.length - 50} 件を表示するには検索してください...</p>
          )}
        </div>
      </div>
    </div>
  );
}
