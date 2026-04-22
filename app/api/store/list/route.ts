// app/api/store/list/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET(req: Request) {
  // middleware.ts で付与されたヘッダーから取得
  const staffEmail = req.headers.get('x-user-email');
  if (!staffEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const env = getRequestContext().env;
  try {
    const { results } = await env.DB.prepare(
      `SELECT slug, store_name, theme_color FROM store_configs WHERE staff_email = ? ORDER BY created_at DESC`
    ).bind(staffEmail).all();
    
    return NextResponse.json(results || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
