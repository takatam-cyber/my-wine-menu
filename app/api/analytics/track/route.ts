// app/api/analytics/track/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * 公開メニューでワインがタップされた際のログを記録
 */
export async function POST(req: Request) {
  try {
    const { store_slug, wine_id, action_type } = await req.json();
    const env = getRequestContext().env;

    await env.DB.prepare(`
      INSERT INTO wine_analytics (store_slug, wine_id, action_type)
      VALUES (?, ?, ?)
    `).bind(store_slug, wine_id, action_type || 'view').run();

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }
}
