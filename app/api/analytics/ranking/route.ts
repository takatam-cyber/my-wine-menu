export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET(req: Request) {
  const storeEmail = req.headers.get('x-user-email');
  if (!storeEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getRequestContext().env.DB;

  // その店舗の閲覧数TOP5を取得
  const { results } = await db.prepare(`
    SELECT m.name_jp, COUNT(a.id) as view_count
    FROM wine_analytics a
    JOIN wines_master m ON a.wine_id = m.id
    WHERE a.store_email = ?
    GROUP BY a.wine_id
    ORDER BY view_count DESC
    LIMIT 5
  `).bind(storeEmail).all();

  return NextResponse.json(results);
}
