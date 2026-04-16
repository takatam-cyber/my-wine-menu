export const runtime = 'edge';
import { NextResponse } from 'next/server';

// ワイン一覧の取得
export async function GET() {
  try {
    // @ts-ignore
    const KV = process.env.WINE_KV;
    const list = await KV.list();
    const wines = await Promise.all(
      list.keys.map(async (k: any) => JSON.parse(await KV.get(k.name)))
    );
    return NextResponse.json(wines.sort((a, b) => b.id - a.id));
  } catch (e) {
    return NextResponse.json([]);
  }
}

// 新規登録・更新（共通）
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

// 削除機能
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
