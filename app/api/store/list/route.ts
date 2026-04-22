export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET(req: Request) {
  const staffEmail = req.headers.get('x-user-email');
  const env = getRequestContext().env;
  try {
    const stores = await env.DB.prepare(`SELECT * FROM store_configs WHERE staff_email = ? ORDER BY store_name ASC`).bind(staffEmail).all();
    return NextResponse.json(stores.results);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
