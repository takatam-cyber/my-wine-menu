export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET() {
  const env = getRequestContext().env;
  try {
    const stores = await env.DB.prepare(`SELECT * FROM store_configs ORDER BY store_name ASC`).all();
    return NextResponse.json(stores.results);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
