// app/api/store/config/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  const staffEmail = req.headers.get('x-user-email');
  if (!staffEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { store_name, slug, theme_color, is_edit } = await req.json();
  const db = getRequestContext().env.DB;

  // バリデーション
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "URLは小文字英数字とハイフンのみ使用できます" }, { status: 400 });
  }

  try {
    if (is_edit) {
      // 編集：既存のスラッグに対して情報を更新
      await db.prepare(`
        UPDATE store_configs 
        SET store_name = ?, theme_color = ?
        WHERE slug = ? AND staff_email = ?
      `).bind(store_name, theme_color, slug, staffEmail).run();
    } else {
      // 新規：スラッグが重複していないか自動的にUNIQUE制約でチェックされる
      await db.prepare(`
        INSERT INTO store_configs (slug, staff_email, store_name, theme_color)
        VALUES (?, ?, ?, ?)
      `).bind(slug, staffEmail, store_name, theme_color || '#b45309').run();
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "このURLスラッグは既に使用されています" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
