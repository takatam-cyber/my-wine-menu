// app/api/wines/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * 特定の店舗(slug)に紐づくワインリストをマスターデータと結合して取得
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  
  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  const db = getRequestContext().env.DB;

  try {
    // マスター情報と店舗個別の価格・在庫情報を結合
    const { results } = await db.prepare(`
      SELECT 
        m.id,
        m.name_jp,
        m.name_en,
        m.country,
        m.region,
        m.grape,
        m.color,
        m.type,
        m.vintage,
        m.alcohol,
        m.ai_explanation,
        m.menu_short,
        m.pairing,
        m.aroma_features,
        m.tags,
        m.image_url,
        m.is_priority,
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
