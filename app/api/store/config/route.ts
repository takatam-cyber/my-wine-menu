// app/api/store/config/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET(req: Request) {
  const staffEmail = req.headers.get('x-user-email');
  if (!staffEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const db = getRequestContext().env.DB;
  const { results } = await db.prepare("SELECT * FROM store_configs WHERE staff_email = ? ORDER BY created_at DESC")
    .bind(staffEmail).all();

  return NextResponse.json(results);
}

export async function POST(req: Request) {
  const staffEmail = req.headers.get('x-user-email');
  if (!staffEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { store_name, slug, theme_color, access_password } = await req.json();
  const db = getRequestContext().env.DB;

  // バリデーション
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "URLスラッグは小文字英数字とハイフンのみ使用可能です" }, { status: 400 });
  }

  try {
    // スキーマ: store_configs (slug, staff_email, store_name, theme_color, access_password)
    await db.prepare(`
      INSERT INTO store_configs (slug, staff_email, store_name, theme_color, access_password)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        store_name = excluded.store_name,
        theme_color = excluded.theme_color,
        access_password = excluded.access_password
    `).bind(slug, staffEmail, store_name, theme_color || '#b45309', access_password || null).run();

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "このURLスラッグは既に使用されています" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
