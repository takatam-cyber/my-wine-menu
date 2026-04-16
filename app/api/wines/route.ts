export const runtime = 'edge';
import { NextResponse } from 'next/server';

// 全ワイン取得
export async function GET() {
  try {
    // @ts-ignore
    const KV = process.env.WINE_KV;
    const list = await KV.list();
    const wines = await Promise.all(
      list.keys.map(async (k: any) => JSON.parse(await KV.get(k.name)))
    );
    return NextResponse.json(wines.sort((a, b) => Number(b.id) - Number(a.id)));
  } catch (e) {
    return NextResponse.json([]);
  }
}

// 登録・更新
export async function POST(req: Request) {
  try {
    const wine = await req.json();
    // @ts-ignore
    await process.env.WINE_KV.put(wine.id, JSON.stringify(wine));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// 削除
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    // @ts-ignore
    await process.env.WINE_KV.delete(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
