// app/api/wines/bulk/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  const storeId = req.headers.get('x-store-id');
  const wines = await req.json();
  const kv = getRequestContext().env.WINE_KV;

  // 既存データとマージせず、CSVの内容で上書き（またはマージ処理）
  await kv.put(`store:${storeId}`, JSON.stringify(wines));
  return NextResponse.json({ success: true });
}
