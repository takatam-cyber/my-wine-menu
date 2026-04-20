export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET(req: Request) {
  const storeEmail = req.headers.get('x-user-email');
  const db = getRequestContext().env.DB;

  const config = await db.prepare("SELECT store_name, slug FROM store_configs WHERE store_email = ?")
    .bind(storeEmail).first();

  return NextResponse.json(config || { store_name: '', slug: '' });
}

export async function POST(req: Request) {
  const storeEmail = req.headers.get('x-user-email');
  const { store_name, slug } = await req.json();
  const db = getRequestContext().env.DB;

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
      return NextResponse.json({ error: "このURL（Slug）は既に使用されています" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
