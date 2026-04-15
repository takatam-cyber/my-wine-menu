export const runtime = 'edge';
import { NextResponse } from 'next/server';

// ワイン一覧を取得する（GET）
export async function GET() {
  try {
    // @ts-ignore
    const wines = await process.env.WINE_KV.list();
    const data = await Promise.all(
      wines.keys.map(async (key: any) => {
        // @ts-ignore
        const val = await process.env.WINE_KV.get(key.name);
        return JSON.parse(val);
      })
    );
    return NextResponse.json(data);
  } catch (e) {
    // KVが未設定の場合はサンプルデータを出す
    return NextResponse.json([
      { id: "1", name_jp: "シャトー・マルゴー", price: 119992, stock: 5, vintage: 2015, image_url: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809" }
    ]);
  }
}

// ワインを保存する（POST）
export async function POST(req: Request) {
  try {
    const wine = await req.json();
    const id = wine.id || Date.now().toString();
    const newWine = { ...wine, id };

    // Cloudflare KVに保存
    // @ts-ignore
    await process.env.WINE_KV.put(id, JSON.stringify(newWine));

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
