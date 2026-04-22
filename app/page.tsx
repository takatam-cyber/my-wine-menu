// app/page.tsx 全文上書き
export default function Landing() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8 text-white font-sans text-center bg-luxury-gradient">
      <div className="max-w-md space-y-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter italic text-amber-500">PIEROTH MS</h1>
          <p className="text-slate-400 font-bold leading-relaxed">
            AI Sommelier & Digital Wine Menu System
          </p>
        </div>
        
        <div className="space-y-4 pt-8">
          <a href="/admin" className="bg-white text-black px-10 py-5 rounded-2xl font-black text-lg shadow-2xl block hover:bg-amber-500 transition-all">
            管理画面へログイン
          </a>
          <a href="/admin/register" className="text-slate-500 font-black text-sm uppercase tracking-widest block hover:text-white transition-all">
            新しく利用を開始する（スタッフ有効化）
          </a>
        </div>
        
        <div className="pt-12 text-[10px] text-slate-600 font-bold uppercase tracking-tighter">
          © 2024 PIEROTH JAPAN K.K. - Internal Sales Tool
        </div>
      </div>
    </div>
  );
}
