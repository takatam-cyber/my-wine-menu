// app/api/analytics/report/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * 特定の店舗におけるワインごとの閲覧数を集計
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  if (!slug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });

  try {
    const env = getRequestContext().env;
    // ワインマスタと結合して名前を取得しつつカウント
    const { results } = await env.DB.prepare(`
      SELECT 
        a.wine_id, 
        m.name_jp, 
        COUNT(a.id) as view_count
      FROM wine_analytics a
      JOIN wines_master m ON a.wine_id = m.id
      WHERE a.store_slug = ?
      GROUP BY a.wine_id
      ORDER BY view_count DESC
    `).bind(slug).all();

    return NextResponse.json(results || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
