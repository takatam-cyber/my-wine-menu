export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // @ts-ignore
    const list = await process.env.WINE_KV.list();
    if (!list.keys || list.keys.length === 0) {
      return NextResponse.json([]); // データがなければ空の配列を返す
    }
    
    const wines = await Promise.all(
      list.keys.map(async (k: any) => {
        // @ts-ignore
        const data = await process.env.WINE_KV.get(k.name);
        return data ? JSON.parse(data) : null;
      })
    );
    return NextResponse.json(wines.filter(w => w !== null));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
