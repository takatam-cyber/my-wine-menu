export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 配線が生きているかチェック
    // @ts-ignore
    const KV = process.env.WINE_KV;
    if (!KV) {
      return NextResponse.json({ error: "KV binding not found" }, { status: 500 });
    }

    const list = await KV.list();
    if (!list.keys || list.keys.length === 0) {
      return NextResponse.json([]); // データがない時は空の配列を返す
    }
    
    const wines = await Promise.all(
      list.keys.map(async (k: any) => {
        const data = await KV.get(k.name);
        return data ? JSON.parse(data) : null;
      })
    );
    return NextResponse.json(wines.filter(w => w !== null));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
