// app/[slug]/page.tsx の一部（スタイルとAIボタンの抜粋）
// ※全体は長いので、あなたの既存コードの return 部分をこの「高級感」で上書きしてください

return (
  <main className="min-h-screen bg-[#050505] pb-40 text-[#E5E5E5] font-sans selection:bg-amber-500">
    {/* ガラスのようなヘッダー */}
    <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/10 p-8 text-center">
      <h1 className="text-3xl font-luxury italic tracking-[0.2em] text-white">
        {config.store_name || 'RESERVED LIST'}
      </h1>
      <div className="w-12 h-[1px] bg-amber-500 mx-auto mt-4" />
    </header>

    <div className="max-w-xl mx-auto px-6 pt-12 space-y-12">
      {filteredWines.map(wine => (
        <div key={wine.id} onClick={() => setSelectedWine(wine)} className="group relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
            <img src={wine.image_url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            
            {wine.is_priority === 1 && (
              <div className="absolute top-6 left-6 border border-amber-500/50 bg-black/40 backdrop-blur-md text-amber-500 text-[10px] font-bold px-4 py-2 tracking-widest uppercase">
                Importer's Selection
              </div>
            )}

            <div className="absolute bottom-8 left-8 right-8 text-left">
              <p className="text-amber-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-2">{wine.country}</p>
              <h2 className="text-2xl font-luxury text-white mb-2 leading-tight">{wine.name_jp}</h2>
              <div className="flex items-center gap-4">
                <span className="text-lg font-light tracking-tighter">¥{Number(wine.price_bottle).toLocaleString()}</span>
                <div className="h-[1px] flex-1 bg-white/20" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* AIボタンを「コンシェルジュ」風に */}
    <button onClick={() => setChatOpen(true)} className="fixed bottom-12 left-1/2 -translate-x-1/2 group z-[60]">
      <div className="absolute inset-0 bg-amber-600 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
      <div className="relative bg-black border border-white/20 px-12 py-5 rounded-full flex items-center gap-4 hover:border-amber-500 transition-all">
        <Sparkles className="text-amber-500 w-5 h-5" />
        <span className="text-[11px] font-bold tracking-[0.4em] uppercase text-white">Ask Sommelier</span>
      </div>
    </button>
  </main>
);
