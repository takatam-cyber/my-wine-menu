// app/api/wines/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * 店舗用ワインリスト取得API
 * 1. 在庫があるもののみを表示
 * 2. Pieroth Exclusiveを最優先ソート
 * 3. 必要最小限のフィールドに絞って軽量化
 */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  const env = getRequestContext().env;

  try {
    const { results } = await env.DB.prepare(`
      SELECT 
        m.id, 
        m.name_jp, 
        m.name_en, 
        m.country, 
        m.region, 
        m.grape, 
        m.color, 
        m.vintage, 
        m.image_url, 
        m.is_priority,
        m.ai_explanation, 
        m.sweetness, 
        m.body, 
        m.acidity, 
        m.tannins,
        COALESCE(i.price_bottle, m.price_bottle) as price_bottle,
        COALESCE(i.price_glass, m.price_glass) as price_glass,
        i.stock
      FROM store_inventory i
      JOIN wines_master m ON i.wine_id = m.id
      WHERE i.store_slug = ? 
        AND i.is_visible = 1 
        AND i.stock > 0
      ORDER BY m.is_priority DESC, m.name_jp ASC
    `).bind(slug).all();

    return NextResponse.json(results || []);
  } catch (e: any) {
    console.error("API Error [GET /api/wines]:", e.message);
    return NextResponse.json({ error: "Failed to fetch collection" }, { status: 500 });
  }
}
