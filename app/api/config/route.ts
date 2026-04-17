// app/api/config/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET(req: Request) {
  const storeId = req.headers.get('x-store-id');
  const kv = getRequestContext().env.WINE_KV;
  const config = await kv.get(`config:${storeId}`);
  return NextResponse.json(config ? JSON.parse(config) : {});
}

export async function POST(req: Request) {
  const storeId = req.headers.get('x-store-id');
  const configData = await req.json();
  const kv = getRequestContext().env.WINE_KV;
  
  await kv.put(`config:${storeId}`, JSON.stringify(configData));
  return NextResponse.json({ success: true });
}
