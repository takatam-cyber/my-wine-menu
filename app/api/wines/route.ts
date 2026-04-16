export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // @ts-ignore
    const KV = process.env.WINE_KV;
    if (!KV) return NextResponse.json([]); // 配線がまだなら空を返す

    const list = await KV.list();
    if (!list.keys || list.keys.length === 0) return NextResponse.json([]);
    
    const wines = await Promise.all(
      list.keys.map(async (k: any) => {
        const data = await KV.get(k.name);
        return data ? JSON.parse(data) : null;
      })
    );
    return NextResponse.json(wines.filter(w => w !== null));
  } catch (e) {
    return NextResponse.json([]); // エラー時は空リストを返して画面を止めない
  }
}

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
