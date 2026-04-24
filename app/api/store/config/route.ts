// app/api/store/config/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * ログイン中の営業スタッフが管理する店舗の設定を取得・保存
 */
export async function GET(req: Request) {
  const staffEmail = req.headers.get('x-user-email'); // middlewareでセットされる
  if (!staffEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const db = getRequestContext().env.DB;
  const { results } = await db.prepare("SELECT * FROM store_configs WHERE staff_email = ?")
    .bind(staffEmail).all();

  return NextResponse.json(results);
}

export async function POST(req: Request) {
  const staffEmail = req.headers.get('x-user-email');
  if (!staffEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { store_name, slug, theme_color } = await req.json();
  const db = getRequestContext().env.DB;

  // バリデーション: slugは英数字とハイフンのみ
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "URLスラッグには小文字英数字とハイフンのみ使用可能です" }, { status: 400 });
  }

  try {
    await db.prepare(`
      INSERT INTO store_configs (slug, staff_email, store_name, theme_color)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        store_name = excluded.store_name,
        theme_color = excluded.theme_color
    `).bind(slug, staffEmail, store_name, theme_color || '#b45309').run();

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "このURLスラッグは既に使用されています" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
