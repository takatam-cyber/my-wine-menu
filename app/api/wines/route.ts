// app/api/wines/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const env = getRequestContext().env;

  if (!slug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });

  try {
    // store_slug をキーにした最新の JOIN ロジック
    // 味覚数値（sweetness, body, acidity, tannins）を含めて取得
    const wines = await env.DB.prepare(`
      SELECT 
        m.id, m.name_jp, m.name_en, m.country, m.region, m.grape, 
        m.color, m.type, m.vintage, m.image_url, m.is_priority,
        m.ai_explanation, m.sweetness, m.body, m.acidity, m.tannins,
        i.price_bottle, i.price_glass, i.stock
      FROM wines_master m
      JOIN store_inventory i ON m.id = i.wine_id
      WHERE i.store_slug = ? AND i.is_visible = 1 AND i.stock > 0
      ORDER BY m.is_priority DESC, m.id ASC
    `).bind(slug).all();

    return NextResponse.json(wines.results || []);
  } catch (e: any) {
    console.error("Fetch wines error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
