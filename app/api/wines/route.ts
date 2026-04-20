export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('storeId') || req.headers.get('x-store-id');
  const db = getRequestContext().env.DB;

  const { results } = await db.prepare(`
    SELECT m.*, i.price_bottle, i.price_glass, i.cost, i.stock, i.is_visible
    FROM wines_master m
    JOIN store_inventory i ON m.id = i.wine_id
    WHERE i.store_id = ?
  `).bind(storeId).all();

  const formattedResults = results.map((w: any) => ({
    ...w,
    ...JSON.parse(w.flavor_profile || '{}')
  }));

  return NextResponse.json(formattedResults);
}

export async function POST(req: Request) {
  const storeId = req.headers.get('x-store-id');
  const { wine_id, price_bottle, price_glass, stock, is_visible } = await req.json();
  const db = getRequestContext().env.DB;

  await db.prepare(`
    INSERT INTO store_inventory (store_id, wine_id, price_bottle, price_glass, stock, is_visible)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(store_id, wine_id) DO UPDATE SET
      price_bottle = excluded.price_bottle,
      price_glass = excluded.price_glass,
      stock = excluded.stock,
      is_visible = excluded.is_visible
  `).bind(storeId, wine_id, price_bottle, price_glass, stock, is_visible ? 1 : 0).run();

  return NextResponse.json({ success: true });
}
// app/api/wines/route.ts
export async function GET(req: Request) {
  // ミドルウェアでセットされた信頼できるメールアドレスを使用
  const storeId = req.headers.get('x-user-email'); 
  const db = getRequestContext().env.DB;

  const { results } = await db.prepare(`
    SELECT m.*, i.price_bottle, i.price_glass, i.cost, i.stock, i.is_visible
    FROM wines_master m
    JOIN store_inventory i ON m.id = i.wine_id
    WHERE i.store_id = ?
  `).bind(storeId).all();
  // ... 以下、パース処理 ...
}
