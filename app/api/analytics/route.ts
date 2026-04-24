// app/api/analytics/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { wine_id, store_slug } = await req.json();
    const db = getRequestContext().env.DB;

    // スキーマ: wine_analytics (store_slug, wine_id, action_type)
    // store_configs から staff_email を引っ張る必要なし。スキーマが slug 直保持のため。
    await db.prepare(`
      INSERT INTO wine_analytics (store_slug, wine_id, action_type)
      VALUES (?, ?, 'view')
    `).bind(store_slug, wine_id).run();

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // ランキング取得用 (Adminダッシュボードで利用)
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const db = getRequestContext().env.DB;

  const { results } = await db.prepare(`
    SELECT m.name_jp, COUNT(a.id) as count
    FROM wine_analytics a
    JOIN wines_master m ON a.wine_id = m.id
    WHERE a.store_slug = ?
    GROUP BY a.wine_id
    ORDER BY count DESC
    LIMIT 5
  `).bind(slug).all();

  return NextResponse.json(results);
}
