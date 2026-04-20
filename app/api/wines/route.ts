export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug'); 
  const userEmail = req.headers.get('x-user-email'); 
  const db = getRequestContext().env.DB;

  let storeId = userEmail;

  // 公開メニューからのアクセス（Slugから店舗メールを特定）
  if (slug) {
    const store: any = await db.prepare("SELECT store_email FROM store_configs WHERE slug = ?").bind(slug).first();
    if (!store) return NextResponse.json([]);
    storeId = store.store_email;
  }

  if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  const storeId = req.headers.get('x-user-email');
  if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
