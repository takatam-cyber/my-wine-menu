// app/[slug]/page.tsx
"use client";
export const runtime = 'edge';

import { useState, useEffect, use, useRef } from 'react';
import { Wine, Star, MessageSquare, ChevronRight, X, Send, Lock, Eye, Droplets, Flame, Wind, Loader2 } from 'lucide-react';

export default function PublicMenu({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [wines, setWines] = useState<any[]>([]);
  const [storeConfig, setStoreConfig] = useState<any>(null);
  const [selectedWine, setSelectedWine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [passInput, setPassInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    const init = async () => {
      try {
        const configRes = await fetch(`/api/store/config/public?slug=${slug}`);
        const config = await configRes.json();
        setStoreConfig(config);
        
        if (!config.access_password) setIsUnlocked(true);

        const wineRes = await fetch(`/api/wines?slug=${slug}`);
        const wineData = await wineRes.json();
        setWines(Array.isArray(wineData) ? wineData : []);
      } catch (e) {
        console.error("Initialization failed", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [slug]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAskSommelier = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/sommelier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, history: messages, wineList: wines })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "申し訳ありません。少し考えがまとまりませんでした。もう一度お話しいただけますか？" }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center font-luxury text-amber-500 gap-4">
      <div className="text-4xl animate-pulse tracking-[0.5em]">PIEROTH</div>
      <Loader2 className="animate-spin" size={20} />
    </div>
  );

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8">
        <div className="max-w-sm w-full space-y-8 text-center bg-white/5 p-10 rounded-[3rem] border border-white/10 shadow-2xl">
          <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mx-auto">
            <Lock className="text-black" size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="font-luxury text-2xl text-white uppercase tracking-widest">{storeConfig?.store_name || 'PRIVATE MENU'}</h2>
            <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">会員様専用メニュー</p>
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
    <div className="min-h-screen bg-[#050505] text-stone-200 font-sans pb-32">
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/5 p-6 text-center">
        <h1 className="font-luxury text-2xl tracking-[0.2em] text-white uppercase">{storeConfig?.store_name}</h1>
        <p className="text-[9px] tracking-[0.4em] text-amber-500 mt-2 font-bold uppercase">Wine Selection</p>
      </header>

      <main className="max-w-xl mx-auto p-6 space-y-12">
        {wines.filter(w => w.is_priority === 1).length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[1px] bg-amber-500"></span>
              <h2 className="font-luxury text-lg italic text-amber-500 tracking-wider">Sommelier's Signature</h2>
            </div>
            <div className="grid gap-4">
              {wines.filter(w => w.is_priority === 1).map(wine => (
                <WineCard key={wine.id} wine={wine} onClick={() => setSelectedWine(wine)} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="w-8 h-[1px] bg-stone-700"></span>
            <h2 className="font-luxury text-lg italic text-stone-500 tracking-wider">The Collection</h2>
          </div>
          <div className="grid gap-4">
            {wines.filter(w => w.is_priority !== 1).map(wine => (
              <WineCard key={wine.id} wine={wine} onClick={() => setSelectedWine(wine)} />
            ))}
          </div>
        </section>
      </main>

      {/* AI Button */}
      <button onClick={() => setIsAiOpen(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-amber-500 text-black rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-110 transition-transform">
        <MessageSquare size={28} />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
      </button>

      {/* Detail Modal */}
      {selectedWine && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-[#111] w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-white/10 relative shadow-2xl">
            <button onClick={() => setSelectedWine(null)} className="sticky top-6 float-right mr-6 z-10 p-3 bg-white/5 rounded-full text-stone-400 backdrop-blur-md hover:text-white transition-colors"><X size={24} /></button>
            <div className="p-8 pt-12 space-y-8">
              <div className="aspect-[3/4] w-48 mx-auto bg-stone-900 rounded-3xl overflow-hidden shadow-2xl">
                <img src={selectedWine.image_url || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800'} className="w-full h-full object-cover" />
              </div>
              
              <div className="text-center space-y-4">
                <span className="text-amber-500 text-[10px] font-black tracking-widest uppercase">{selectedWine.country} / {selectedWine.region}</span>
                <h3 className="font-luxury text-3xl text-white leading-tight">{selectedWine.name_jp}</h3>
                <p className="text-stone-500 text-sm font-serif italic">{selectedWine.name_en}</p>
                
                <div className="flex justify-center gap-10 pt-6">
                  <div className="text-center">
                    <p className="text-[9px] text-stone-500 uppercase mb-1 font-black">Glass</p>
                    <p className="text-2xl font-luxury text-amber-400">¥{Number(selectedWine.store_price_glass).toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-stone-500 uppercase mb-1 font-black">Bottle</p>
                    <p className="text-2xl font-luxury text-amber-400">¥{Number(selectedWine.store_price_bottle).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2 py-8 border-y border-white/5">
                <FlavorStat label="Body" value={selectedWine.body} />
                <FlavorStat label="Tannins" value={selectedWine.tannins} />
                <FlavorStat label="Acidity" value={selectedWine.acidity} />
                <FlavorStat label="Finish" value={selectedWine.finish} />
              </div>

              <div className="space-y-4 bg-white/[0.02] p-6 rounded-3xl">
                <div className="flex items-center gap-2 text-amber-500 font-black text-[10px] tracking-widest uppercase">
                  <MessageSquare size={14}/> Sommelier Note
                </div>
                <p className="text-stone-300 italic font-serif text-lg leading-relaxed">
                  "{selectedWine.ai_explanation || selectedWine.menu_short || "洗練された味わいをお楽しみください。"}"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Drawer */}
      {isAiOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0a0a0a] h-full flex flex-col shadow-2xl border-l border-white/10 animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-black font-luxury text-xl">P</div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">AI Sommelier</h3>
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span><span className="text-[9px] text-stone-500 font-bold uppercase">Online</span></div>
                </div>
              </div>
              <button onClick={() => setIsAiOpen(false)} className="p-2 text-stone-500 hover:text-white"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 && (
                <div className="text-center py-20 space-y-4">
                  <Wine className="mx-auto text-amber-500/20" size={64} />
                  <p className="text-stone-500 text-xs font-bold px-10">今夜の気分や、お好みの料理を教えてください。あなたにぴったりの一本をご提案します。</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm leading-relaxed ${m.role === 'user' ? 'bg-amber-500 text-black font-bold rounded-tr-none' : 'bg-white/5 text-stone-200 border border-white/5 rounded-tl-none'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isTyping && <div className="bg-white/5 p-4 rounded-[1.5rem] rounded-tl-none w-16 flex gap-1 justify-center"><span className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce delay-100"></span><span className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce delay-200"></span></div>}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 bg-black border-t border-white/5">
              <div className="relative">
                <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleAskSommelier()}
                  placeholder="辛口の白、魚料理に合うものを..." 
                  className="w-full bg-white/5 border border-white/10 p-4 pr-14 rounded-2xl text-sm focus:border-amber-500 outline-none"
                />
                <button onClick={handleAskSommelier} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-amber-500 text-black rounded-xl hover:bg-amber-400 transition-colors"><Send size={18} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WineCard({ wine, onClick }: { wine: any, onClick: () => void }) {
  return (
    <div onClick={onClick} className="group bg-white/[0.02] border border-white/5 rounded-[1.8rem] p-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.05] hover:border-amber-500/30 transition-all active:scale-[0.98]">
      <div className="w-16 h-20 bg-stone-900 rounded-xl overflow-hidden shrink-0 shadow-lg border border-white/5">
        <img src={wine.image_url || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
      </div>
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[8px] font-black text-amber-500 tracking-[0.1em] uppercase">{wine.country}</span>
          {wine.is_priority === 1 && <Star size={10} className="fill-amber-500 text-amber-500" />}
        </div>
        <h3 className="font-luxury text-lg text-stone-100 truncate tracking-wide">{wine.name_jp}</h3>
        <div className="flex gap-4 mt-1.5">
          <div className="flex flex-col">
            <span className="text-[7px] text-stone-500 uppercase font-black">Glass</span>
            <span className="text-[11px] font-bold text-amber-400/90">¥{Number(wine.store_price_glass).toLocaleString()}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] text-stone-500 uppercase font-black">Bottle</span>
            <span className="text-[11px] font-bold text-amber-400/90">¥{Number(wine.store_price_bottle).toLocaleString()}</span>
          </div>
        </div>
      </div>
      <ChevronRight className="text-stone-800 group-hover:text-amber-500 transition-colors" size={20} />
    </div>
  );
}

function FlavorStat({ label, value }: { label: string, value: number }) {
  return (
    <div className="text-center space-y-2">
      <p className="text-[8px] uppercase font-black tracking-widest text-stone-500">{label}</p>
      <div className="flex justify-center gap-0.5">
        {[1,2,3,4,5].map(v => (
          <div key={v} className={`w-1 h-3 rounded-full ${v <= (value || 0) ? 'bg-amber-500' : 'bg-white/10'}`} />
        ))}
      </div>
    </div>
  );
}
