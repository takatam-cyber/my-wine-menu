export const runtime = 'edge';

import React from 'react';
import { Camera, Save, ArrowLeft } from 'lucide-react';

export default async function AdminPage({ searchParams }: { searchParams: { pass?: string } }) {
  const ADMIN_PASSWORD = "wine123"; 
  const isAuthorized = searchParams.pass === ADMIN_PASSWORD;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans">
        <h1 className="text-2xl font-serif mb-6 italic">Cellar Security</h1>
        <form className="flex flex-col gap-4 w-full max-w-xs">
          <input type="password" name="pass" placeholder="Password" className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-center outline-none focus:border-[#d4af37] transition-all" />
          <button className="bg-[#d4af37] text-black py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#b8962d]">Enter Cellar</button>
        </form>
      </div>
    );
  }

  // @ts-ignore
  const { results } = await process.env.DB.prepare("SELECT * FROM wines ORDER BY id DESC").all();

  // 更新処理
  async function updateWine(formData: FormData) {
    'use server';
    const id = formData.get('id');
    const price = formData.get('price');
    const stock = formData.get('stock');
    const category = formData.get('category');
    const vintage = formData.get('vintage');
    const image_url = formData.get('image_url');
    const variety = formData.get('variety');
    const sub_region = formData.get('sub_region');
    const description = formData.get('description');

    // @ts-ignore
    await process.env.DB.prepare(
      "UPDATE wines SET price = ?, stock = ?, category = ?, vintage = ?, image_url = ?, variety = ?, sub_region = ?, description = ? WHERE id = ?"
    ).bind(price, stock, category, vintage, image_url, variety, sub_region, id).run();
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20 font-sans text-zinc-900">
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <header className="mb-12 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Cellar Manager</h1>
            <p className="text-zinc-500 text-sm">在庫・情報のリアルタイム更新</p>
          </div>
          <button className="bg-black text-white px-6 py-3 rounded-full text-sm font-bold shadow-xl hover:bg-zinc-800 transition-all flex items-center gap-2">
            <Camera className="w-4 h-4" /> AI Label Scan
          </button>
        </header>

        <div className="grid gap-8">
          {results.map((wine: any) => (
            <form key={wine.id} action={updateWine} className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-200">
              <input type="hidden" name="id" value={wine.id} />
              
              <div className="grid md:grid-cols-3 gap-8">
                {/* 左：画像プレビューとURL */}
                <div className="space-y-4">
                  <div className="aspect-[3/4] rounded-2xl bg-zinc-100 overflow-hidden border border-zinc-100 shadow-inner">
                    <img src={wine.image_url} className="w-full h-full object-cover" />
                  </div>
                  <input name="image_url" type="text" defaultValue={wine.image_url} placeholder="Image URL" className="w-full text-[10px] p-2 bg-zinc-50 border rounded outline-none focus:border-zinc-400" />
                </div>

                {/* 右：入力項目 */}
                <div className="md:col-span-2 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold">{wine.name_jp}</h2>
                      <p className="text-sm text-zinc-400 italic">{wine.name_en}</p>
                    </div>
                    <select name="category" defaultValue={wine.category} className="bg-zinc-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider outline-none">
                      <option value="Red">Red</option>
                      <option value="White">White</option>
                      <option value="Sparkling">Sparkling</option>
                      <option value="Rose">Rose</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Price (¥)</label>
                      <input name="price" type="number" defaultValue={wine.price} className="w-full border-b border-zinc-200 py-2 text-lg font-medium outline-none focus:border-black transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Stock</label>
                      <input name="stock" type="number" defaultValue={wine.stock} className="w-full border-b border-zinc-200 py-2 text-lg font-medium outline-none focus:border-black transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Vintage</label>
                      <input name="vintage" type="number" defaultValue={wine.vintage} className="w-full border-b border-zinc-200 py-2 text-lg font-medium outline-none focus:border-black transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Variety</label>
                      <input name="variety" type="text" defaultValue={wine.variety} className="w-full border-b border-zinc-200 py-1 text-sm outline-none focus:border-black transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Appellation</label>
                      <input name="sub_region" type="text" defaultValue={wine.sub_region} className="w-full border-b border-zinc-200 py-1 text-sm outline-none focus:border-black transition-all" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Description</label>
                    <textarea name="description" defaultValue={wine.description} className="w-full bg-zinc-50 p-3 rounded-xl text-sm h-24 outline-none border border-transparent focus:border-zinc-200 transition-all" />
                  </div>

                  <button type="submit" className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-[0.98]">
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </div>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
