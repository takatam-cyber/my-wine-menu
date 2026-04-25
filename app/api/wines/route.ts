// app/api/wines/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  
  if (!slug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });

  const db = getRequestContext().env.DB;

  try {
    // wines_master と store_inventory を結合して、その店舗独自の価格と在庫を表示
    const { results } = await db.prepare(`
      SELECT 
        m.*,
        i.price_bottle as store_price_bottle, 
        i.price_glass as store_price_glass, 
        i.stock as store_stock, 
        i.is_visible
      FROM wines_master m
      INNER JOIN store_inventory i ON m.id = i.wine_id
      WHERE i.store_slug = ? AND i.is_visible = 1
      ORDER BY m.is_priority DESC, m.name_jp ASC
    `).bind(slug).all();

    return NextResponse.json(results);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
