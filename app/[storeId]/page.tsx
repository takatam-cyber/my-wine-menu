// app/[storeId]/page.tsx
"use client";
export const runtime = 'edge';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, MessageCircle, X, Send, Loader2 } from 'lucide-react';

export default function StoreMenu() {
  const { storeId } = useParams();
  const [wines, setWines] = useState([]);
  const [config, setConfig] = useState({ menu_name: '' });
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (storeId) {
      const decoded = decodeURIComponent(storeId as string);
      fetch(`/api/wines?storeId=${decoded}`).then(res => res.json()).then(data => setWines(Array.isArray(data) ? data : []));
      fetch(`/api/config`, { headers: { 'x-store-id': decoded } }).then(res => res.json()).then(data => setConfig(data));
    }
  }, [storeId]);

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-[#1a1a1a] font-sans pb-24">
      <header className="py-20 px-8 text-center bg-white border-b border-slate-100">
        <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a] uppercase mb-4 tracking-widest">{config.menu_name || 'WINE LIST'}</h1>
        <div className="h-[2px] w-12 bg-[#2f5d3a] mx-auto opacity-80"></div>
        <p className="text-[10px] tracking-[0.4em] mt-6 opacity-30 uppercase font-black tracking-widest">Refined Wine Selection</p>
      </header>

      <div className="max-w-xl mx-auto px-6 space-y-10 mt-10">
        {wines.filter(w => !w.stock || parseInt(w.stock) > 0).map((wine: any) => (
          <div key={wine.id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 p-6 flex flex-col gap-6 animate-in fade-in duration-700">
            <div className="flex gap-6">
              {/* ボトル画像：情報を隠さない最適なサイズ */}
              <div className="w-24 aspect-[2/3] bg-slate-50 rounded-xl overflow-hidden flex-shrink-0">
                {wine.image && <img src={wine.image} className="w-full h-full object-contain p-2" />}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold tracking-tight mb-1 truncate">{wine.name_jp}</h2>
                <p className="text-[10px] font-black uppercase text-[#2f5d3a] opacity-60 mb-3 truncate">
                  {wine.region} / {wine.grape} / {wine.producer}
                </p>
                <div className="flex flex-col gap-2">
                  {wine.price_glass && <div className="text-[10px] font-black text-slate-400">GLASS <span className="text-lg text-black ml-2">¥{Number(wine.price_glass).toLocaleString()}</span></div>}
                  {wine.price_bottle && <div className="text-[10px] font-black text-slate-400">BOTTLE <span className="text-lg text-amber-800 ml-2">¥{Number(wine.price_bottle).toLocaleString()}</span></div>}
                </div>
              </div>
            </div>

            {/* 味わいバー：画像のデザインをリッチに再現 */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-2">
              <FlavorDots label="Body" val={wine.body} />
              <FlavorDots label="Acidity" val={wine.acidity} />
              <FlavorDots label="Sweet" val={wine.sweetness} />
              <FlavorDots label={wine.color === '赤' ? 'Tannin' : 'Aroma'} val={wine.color === '赤' ? wine.tannin : wine.aroma} />
            </div>

            <p className="text-sm text-slate-500 leading-relaxed font-medium bg-slate-50 p-5 rounded-2xl border-l-4 border-slate-200">
              {wine.advice}
            </p>
          </div>
        ))}
      </div>

      <button onClick={() => setChatOpen(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-[#2f5d3a] text-white rounded-full shadow-2xl flex items-center justify-center animate-bounce z-50">
        <MessageCircle size={28}/>
      </button>
    </main>
  );
}

function FlavorDots({ label, val }: { label: string, val: string }) {
  const level = parseInt(val) || 3;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center pr-1"><span className="text-[8px] font-black uppercase tracking-tighter opacity-30">{label}</span></div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${s <= level ? 'bg-[#2f5d3a]' : 'bg-slate-100'}`}></div>
        ))}
      </div>
    </div>
  );
}
