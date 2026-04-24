// app/[slug]/page.tsx
"use client";
export const runtime = 'edge';

import { useState, useEffect, use, useRef } from 'react';
import { Wine, Star, MessageSquare, ChevronRight, X, Send, Lock, Eye, Droplets, Flame, Wind } from 'lucide-react';

export default function PublicMenu({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [wines, setWines] = useState<any[]>([]);
  const [storeConfig, setStoreConfig] = useState<any>(null);
  const [selectedWine, setSelectedWine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [passInput, setPassInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  // AI Sommelier
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/store/config/public?slug=${slug}`)
      .then(res => res.json())
      .then(config => {
        setStoreConfig(config);
        if (!config.access_password) setIsUnlocked(true);
        return fetch(`/api/wines?slug=${slug}`);
      })
      .then(res => res.json())
      .then(wineData => {
        setWines(Array.isArray(wineData) ? wineData : []);
        setLoading(false);
      });
  }, [slug]);

  // 閲覧ログを記録
  const logView = (wineId: string) => {
    fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({ wine_id: wineId, store_slug: slug })
    });
  };

  const handleWineClick = (wine: any) => {
    setSelectedWine(wine);
    logView(wine.id);
  };

  const handleAskSommelier = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const res = await fetch('/api/sommelier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input, history: messages, wineList: wines })
    });
    const data = await res.json();
    setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    setIsTyping(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center font-luxury text-amber-500 animate-pulse">PIEROTH</div>
  );

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8">
        <div className="max-w-sm w-full space-y-8 text-center bg-white/5 p-10 rounded-[3rem] border border-white/10">
          <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
            <Lock className="text-black" size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="font-luxury text-2xl text-white uppercase tracking-widest">{storeConfig?.store_name}</h2>
            <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">会員様専用メニュー</p>
          </div>
          <input 
            type="password" 
            placeholder="PASSCODE" 
            className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white text-center font-black tracking-[0.5em] outline-none focus:border-amber-500"
            value={passInput}
            onChange={(e) => setPassInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && passInput === storeConfig.access_password && setIsUnlocked(true)}
          />
          <button 
            onClick={() => passInput === storeConfig.access_password && setIsUnlocked(true)}
            className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase text-sm hover:bg-amber-500 transition-all"
          >
            Unlock Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-stone-200 font-sans">
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/5 p-6 text-center">
        <h1 className="font-luxury text-3xl tracking-[0.2em] text-white uppercase">{storeConfig?.store_name}</h1>
        <p className="text-[10px] tracking-[0.4em] text-amber-500 mt-2 font-bold uppercase">Wine Selection</p>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-12 pb-32">
        {wines.some(w => w.is_priority === 1) && (
          <section className="space-y-6">
            <h2 className="font-luxury text-xl italic text-amber-400 border-l-2 border-amber-500 pl-4">Sommelier's Choice</h2>
            <div className="grid gap-6">
              {wines.filter(w => w.is_priority === 1).map(wine => (
                <WineCard key={wine.id} wine={wine} onClick={() => handleWineClick(wine)} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-6">
          <h2 className="font-luxury text-xl italic text-stone-500 border-l-2 border-stone-700 pl-4">The Collection</h2>
          <div className="grid gap-6">
            {wines.filter(w => w.is_priority !== 1).map(wine => (
              <WineCard key={wine.id} wine={wine} onClick={() => handleWineClick(wine)} />
            ))}
          </div>
        </section>
      </main>

      {/* Floating AI Button */}
      <button onClick={() => setIsAiOpen(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-amber-500 text-black rounded-full shadow-2xl flex items-center justify-center z-40 animate-bounce">
        <MessageSquare size={28} />
      </button>

      {/* Detail Modal */}
      {selectedWine && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="bg-[#111] w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 relative">
            <button onClick={() => setSelectedWine(null)} className="absolute top-6 right-6 p-3 bg-white/5 rounded-full text-stone-500"><X size={24} /></button>
            <div className="p-8 sm:p-12 space-y-8">
              <div className="flex flex-col sm:flex-row gap-10">
                <div className="w-full sm:w-1/3 aspect-[3/4] bg-stone-900 rounded-3xl overflow-hidden">
                  <img src={selectedWine.image_url} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-4">
                  <span className="text-amber-500 text-xs font-bold tracking-widest uppercase">{selectedWine.country} / {selectedWine.region}</span>
                  <h3 className="font-luxury text-4xl text-white leading-tight">{selectedWine.name_jp}</h3>
                  <div className="flex gap-8 pt-6 border-t border-white/5">
                    <div><p className="text-[9px] text-stone-500 uppercase mb-1">Glass</p><p className="text-2xl font-luxury text-amber-400">¥{Number(selectedWine.price_glass).toLocaleString()}</p></div>
                    <div><p className="text-[9px] text-stone-500 uppercase mb-1">Bottle</p><p className="text-2xl font-luxury text-amber-400">¥{Number(selectedWine.price_bottle).toLocaleString()}</p></div>
                  </div>
                </div>
              </div>
              
              {/* Flavor Profile Stats */}
              <div className="grid grid-cols-4 gap-4 pt-8 border-t border-white/5">
                <FlavorStat icon={<Droplets size={14}/>} label="Body" value={selectedWine.body} />
                <FlavorStat icon={<Flame size={14}/>} label="Alcohol" value={selectedWine.alcohol} isText />
                <FlavorStat icon={<Wind size={14}/>} label="Acidity" value={selectedWine.acidity} />
                <FlavorStat icon={<Eye size={14}/>} label="Finish" value={selectedWine.finish} />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-500"><MessageSquare size={14}/><span className="text-xs font-bold uppercase tracking-widest">Sommelier Note</span></div>
                <p className="text-stone-300 italic font-serif text-lg leading-relaxed">"{selectedWine.ai_explanation || selectedWine.menu_short}"</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Drawer (Omitted for brevity, but same as previous version) */}
    </div>
  );
}

function WineCard({ wine, onClick }: { wine: any, onClick: () => void }) {
  return (
    <div onClick={onClick} className="group bg-white/[0.03] border border-white/5 rounded-[2rem] p-6 flex items-center gap-6 cursor-pointer hover:bg-white/[0.07] transition-all">
      <div className="w-20 h-24 bg-stone-900 rounded-2xl overflow-hidden shrink-0 shadow-lg">
        <img src={wine.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] font-black text-amber-500/80 uppercase tracking-widest">{wine.country}</span>
          {wine.is_priority === 1 && <Star size={10} className="fill-amber-500 text-amber-500" />}
        </div>
        <h3 className="font-luxury text-xl text-stone-100 truncate">{wine.name_jp}</h3>
        <div className="flex gap-4 mt-2">
          <span className="text-[11px] font-bold text-stone-300">G: ¥{Number(wine.price_glass).toLocaleString()}</span>
          <span className="text-[11px] font-bold text-stone-300">B: ¥{Number(wine.price_bottle).toLocaleString()}</span>
        </div>
      </div>
      <ChevronRight className="text-stone-800" size={24} />
    </div>
  );
}

function FlavorStat({ icon, label, value, isText = false }: { icon: any, label: string, value: any, isText?: boolean }) {
  return (
    <div className="text-center space-y-2">
      <div className="flex items-center justify-center gap-1 text-stone-500">{icon}<span className="text-[8px] uppercase font-bold tracking-widest">{label}</span></div>
      {isText ? (
        <p className="text-xs font-bold text-white">{value}</p>
      ) : (
        <div className="flex justify-center gap-0.5">
          {[1,2,3,4,5].map(v => (
            <div key={v} className={`w-1 h-3 rounded-full ${v <= (value || 0) ? 'bg-amber-500' : 'bg-white/10'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
