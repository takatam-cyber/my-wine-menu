export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET() {
  const env = getRequestContext().env;
  try {
    // 全ての登録済み店舗を取得する（100店舗運用に対応）
    const stores = await env.DB.prepare(`
      SELECT store_name, slug, store_email 
      FROM store_configs 
      ORDER BY store_name ASC
    `).all();
    
    return NextResponse.json(stores.results);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
