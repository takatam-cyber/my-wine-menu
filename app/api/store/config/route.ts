export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET(req: Request) {
  const storeEmail = req.headers.get('x-user-email');
  if (!storeEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const db = getRequestContext().env.DB;
  const config = await db.prepare("SELECT store_name, slug FROM store_configs WHERE store_email = ?")
    .bind(storeEmail).first();

  return NextResponse.json(config || { store_name: '', slug: '' });
}

export async function POST(req: Request) {
  const storeEmail = req.headers.get('x-user-email');
  if (!storeEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { store_name, slug } = await req.json();
  const db = getRequestContext().env.DB;

  // Slug（URL）に使用できない文字の簡易チェック
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "URLには小文字英数字とハイフンのみ使用できます" }, { status: 400 });
  }

  try {
    await db.prepare(`
      INSERT INTO store_configs (store_email, store_name, slug)
      VALUES (?, ?, ?)
      ON CONFLICT(store_email) DO UPDATE SET
        store_name = excluded.store_name,
        slug = excluded.slug
    `).bind(storeEmail, store_name, slug).run();

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "このURL（Slug）は既に他の店舗が使用しています" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
