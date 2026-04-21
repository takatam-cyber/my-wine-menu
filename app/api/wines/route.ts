export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const env = getRequestContext().env;

  try {
    const wines = await env.DB.prepare(`
      SELECT 
        m.*, 
        i.price_bottle, 
        i.price_glass, 
        i.stock, 
        i.is_visible
      FROM wines_master m
      JOIN store_inventory i ON m.id = i.wine_id
      JOIN store_configs c ON i.store_id = c.store_email
      WHERE c.slug = ? AND i.is_visible = 1
    `).bind(slug).all();

    return NextResponse.json(wines.results);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
