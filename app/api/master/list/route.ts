// app/api/master/list/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET() {
  const env = getRequestContext().env;
  try {
    const { results } = await env.DB.prepare(`
      SELECT * FROM wines_master ORDER BY id DESC
    `).all();
    return NextResponse.json(results || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
