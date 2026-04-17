// app/api/wines/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('storeId') || req.headers.get('x-store-id');
  const kv = getRequestContext().env.WINE_KV;
  const data = await kv.get(`store:${storeId}`);
  return NextResponse.json(data ? JSON.parse(data) : []);
}

export async function POST(req: Request) {
  const storeId = req.headers.get('x-store-id');
  const wineData = await req.json();
  const kv = getRequestContext().env.WINE_KV;

  const currentData = await kv.get(`store:${storeId}`);
  let wines = currentData ? JSON.parse(currentData) : [];

  const index = wines.findIndex((w: any) => w.id === wineData.id);
  if (index > -1) {
    wines[index] = wineData;
  } else {
    wines.push({ ...wineData, id: Date.now().toString() });
  }

  await kv.put(`store:${storeId}`, JSON.stringify(wines));
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const storeId = req.headers.get('x-store-id');
  const { id } = await req.json();
  const kv = getRequestContext().env.WINE_KV;

  const currentData = await kv.get(`store:${storeId}`);
  if (!currentData) return NextResponse.json({ success: true });

  let wines = JSON.parse(currentData);
  wines = wines.filter((w: any) => w.id !== id);

  await kv.put(`store:${storeId}`, JSON.stringify(wines));
  return NextResponse.json({ success: true });
}
