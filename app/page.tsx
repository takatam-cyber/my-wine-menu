export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0d0e12] flex items-center justify-center p-8 text-white font-sans text-center">
      <div className="max-w-md space-y-6">
        <h1 className="text-4xl font-black tracking-tighter">WINE MENU SaaS</h1>
        <p className="text-slate-400 font-bold leading-relaxed">
          多数の店舗でご利用いただける、AIソムリエ機能付きワイン管理・メニューシステムです。
        </p>
        <div className="pt-8">
          <a href="/admin" className="bg-white text-black px-10 py-4 rounded-2xl font-black text-lg shadow-2xl block">
            店舗管理ログイン
          </a>
        </div>
      </div>
    </div>
  );
}
