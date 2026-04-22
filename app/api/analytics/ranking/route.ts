// app/api/analytics/ranking/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 });

  const db = getRequestContext().env.DB;

  try {
    const { results } = await db.prepare(`
      SELECT m.name_jp, COUNT(a.id) as view_count
      FROM wine_analytics a
      JOIN wines_master m ON a.wine_id = m.id
      WHERE a.store_slug = ?
      GROUP BY a.wine_id
      ORDER BY view_count DESC
      LIMIT 5
    `).bind(slug).all();

    return NextResponse.json(results || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
