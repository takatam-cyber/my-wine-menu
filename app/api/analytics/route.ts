export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  const { wine_id, store_slug } = await req.json();
  const db = getRequestContext().env.DB;

  // Slugからstore_emailを特定して保存
  await db.prepare(`
    INSERT INTO wine_analytics (store_email, wine_id, action_type)
    SELECT store_email, ?, 'view' FROM store_configs WHERE slug = ?
  `).bind(wine_id, store_slug).run();

  return NextResponse.json({ success: true });
}
