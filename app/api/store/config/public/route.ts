export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 });

  const db = getRequestContext().env.DB;
  // スラッグから店名を取得
  const config: any = await db.prepare("SELECT store_name FROM store_configs WHERE slug = ?")
    .bind(slug).first();

  return NextResponse.json(config || { store_name: 'WINE MENU' });
}
