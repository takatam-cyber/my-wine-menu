export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // @ts-ignore
    const KV = process.env.WINE_KV;
    const list = await KV.list();
    const wines = await Promise.all(
      list.keys.map(async (k: any) => JSON.parse(await KV.get(k.name)))
    );
    // ID順に並び替え
    return NextResponse.json(wines.sort((a, b) => Number(a.id) - Number(b.id)));
  } catch (e) {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const wine = await req.json();
    // @ts-ignore
    const KV = process.env.WINE_KV;

    let finalId = wine.id;

    // IDが新規（空または自動生成前）の場合、最大のID+1を割り当てる
    if (!finalId || finalId.length > 5) { // タイムスタンプ等の長いIDもリセット対象
      const list = await KV.list();
      const ids = list.keys.map((k: any) => parseInt(k.name)).filter((n: any) => !isNaN(n));
      const maxId = ids.length > 0 ? Math.max(...ids) : 0;
      finalId = String(maxId + 1);
    }

    const updatedWine = { ...wine, id: finalId };
    await KV.put(finalId, JSON.stringify(updatedWine));
    return NextResponse.json({ success: true, id: finalId });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    // @ts-ignore
    await process.env.WINE_KV.delete(String(id));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
