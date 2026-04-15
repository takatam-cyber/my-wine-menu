export const runtime = 'edge';

import React from 'react';

export default async function AdminPage({ searchParams }: { searchParams: { pass?: string } }) {
  // パスワードチェック (URLの最後に ?pass=wine123 をつけるか、簡易ログイン)
  const ADMIN_PASSWORD = "wine123"; // ここを好きな文字に変えてください
  const isAuthorized = searchParams.pass === ADMIN_PASSWORD;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans">
        <h1 className="text-2xl font-serif mb-6">Security Access</h1>
        <form className="flex flex-col gap-4 w-full max-w-xs">
          <input 
            type="password" 
            name="pass" 
            placeholder="Enter Password" 
            className="bg-zinc-900 border border-zinc-800 p-3 rounded text-center outline-none focus:border-[#d4af37]"
          />
          <button className="bg-[#d4af37] text-black py-3 rounded font-bold uppercase tracking-widest text-xs">Login</button>
        </form>
      </div>
    );
  }

  // --- 以下、認証成功後のコード ---
  // @ts-ignore
  const { results } = await process.env.DB.prepare("SELECT * FROM wines ORDER BY id DESC").all();

  async function updateWine(formData: FormData) {
    'use server';
    const id = formData.get('id');
    const price = formData.get('price');
    const stock = formData.get('stock');
    const variety = formData.get('variety');
    const sub_region = formData.get('sub_region');
    const description = formData.get('description');
    // @ts-ignore
    await process.env.DB.prepare(
      "UPDATE wines SET price = ?, stock = ?, variety = ?, sub_region = ?, description = ? WHERE id = ?"
    ).bind(price, stock, variety, sub_region, description, id).run();
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-10 text-zinc-900">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex justify-between items-end border-b pb-6">
          <h1 className="text-3xl font-bold">Cellar Manager</h1>
          <a href="/admin/new" className="text-sm bg-black text-white px-4 py-2 rounded-full">＋ Add New Wine</a>
        </header>

        <div className="grid gap-6">
          {results.map((wine: any) => (
            <form key={wine.id} action={updateWine} className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
              <input type="hidden" name="id" value={wine.id} />
              <div className="flex items-center gap-4 mb-6">
                <img src={wine.image_url} className="w-16 h-16 rounded object-cover bg-zinc-100" />
                <div>
                  <h2 className="text-lg font-bold">{wine.name_jp}</h2>
                  <p className="text-xs text-zinc-400 italic">{wine.name_en}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <input name="price" type="number" defaultValue={wine.price} className="border p-2 rounded text-sm" placeholder="Price" />
                <input name="stock" type="number" defaultValue={wine.stock} className="border p-2 rounded text-sm" placeholder="Stock" />
                <input name="variety" type="text" defaultValue={wine.variety} className="border p-2 rounded text-sm" placeholder="Variety" />
              </div>
              <textarea name="description" defaultValue={wine.description} className="w-full border p-2 rounded text-sm h-20 mb-4" />
              <button type="submit" className="w-full bg-zinc-900 text-white py-3 rounded-lg font-bold text-sm">Update Information</button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
