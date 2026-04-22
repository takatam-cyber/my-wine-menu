// app/api/store/config/route.ts の完全版
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  // Middlewareから渡されたスタッフのメールアドレスを取得
  const staffEmail = req.headers.get('x-user-email');
  if (!staffEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { store_name, slug, theme_color } = await req.json();
  const db = (getRequestContext() as any).env.DB;

  // URL（Slug）の形式チェック
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "URLには小文字英数字とハイフンのみ使用できます" }, { status: 400 });
  }

  try {
    // 新しいテーブル構造（slugが主キー、staff_emailを保存）に合わせて実行
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
      return NextResponse.json({ error: "このURLは既に他の店舗が使用しています" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
