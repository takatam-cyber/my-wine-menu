export const runtime = 'edge';

import React from 'react';

export default async function AdminPage() {
  // データの読み込み
  // @ts-ignore
  const { results } = await process.env.DB.prepare("SELECT * FROM wines").all();

  // 更新処理（Server Action）
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
    <div className="min-h-screen bg-zinc-50 p-4 md:p-10 text-zinc-900 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex justify-between items-end border-b border-zinc-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cellar Manager</h1>
            <p className="text-zinc-500 text-sm mt-1">在庫・品種・産地情報のリアルタイム更新</p>
          </div>
        </header>

        <div className="grid gap-6">
          {results.map((wine: any) => (
            <form key={wine.id} action={updateWine} className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
              <input type="hidden" name="id" value={wine.id} />
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-lg bg-zinc-100 overflow-hidden">
                  <img src={wine.image_url} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{wine.name_jp}</h2>
                  <p className="text-xs text-zinc-400 italic">{wine.name_en}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Price (¥)</label>
                  <input name="price" type="number" defaultValue={wine.price} className="border border-zinc-200 p-2 rounded text-sm focus:ring-2 focus:ring-zinc-900 outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Stock (在庫数)</label>
                  <input name="stock" type="number" defaultValue={wine.stock} className="border border-zinc-200 p-2 rounded text-sm focus:ring-2 focus:ring-zinc-900 outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Vintage</label>
                  <div className="p-2 bg-zinc-50 text-zinc-400 text-sm rounded">{wine.vintage}</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Variety (品種)</label>
                  <input name="variety" type="text" defaultValue={wine.variety} className="border border-zinc-200 p-2 rounded text-sm focus:ring-2 focus:ring-zinc-900 outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Appellation (産地詳細)</label>
                  <input name="sub_region" type="text" defaultValue={wine.sub_region} className="border border-zinc-200 p-2 rounded text-sm focus:ring-2 focus:ring-zinc-900 outline-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1 mt-4">
                <label className="text-[10px] font-bold uppercase text-zinc-400">Comment / Description</label>
                <textarea name="description" defaultValue={wine.description} className="border border-zinc-200 p-2 rounded text-sm h-20 focus:ring-2 focus:ring-zinc-900 outline-none" />
              </div>

              <button type="submit" className="w-full mt-6 bg-zinc-900 text-white py-3 rounded-lg font-bold text-sm hover:bg-zinc-700 transition-colors shadow-lg active:scale-[0.98]">
                情報を更新する
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
