export const runtime = 'edge';
import { NextResponse } from 'next/server';

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

export async function GET() {
  // 既存のGETコードをそのまま使用（KVから全データを取得するロジック）
}
