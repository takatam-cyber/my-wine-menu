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
    // スキーマの store_inventory は store_slug と wine_id を持つ
    const { results } = await db.prepare(`
      SELECT 
        m.*,
        i.price_bottle, 
        i.price_glass, 
        i.stock, 
        i.is_visible
      FROM wines_master m
      JOIN store_inventory i ON m.id = i.wine_id
      WHERE i.store_slug = ? AND i.is_visible = 1
      ORDER BY m.is_priority DESC, m.name_jp ASC
    `).bind(slug).all();

    return NextResponse.json(results);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
