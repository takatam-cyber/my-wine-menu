// app/api/auth/partner/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { signJWT } from '@/lib/auth'; // エイリアスを使用してパスエラーを解消

export async function POST(req: Request) {
  try {
    const { slug, password } = await req.json();
    const env = (getRequestContext() as any).env;

    // D1 から店舗設定を検索（スラッグとパスワードを照合）
    const store: any = await env.DB.prepare(
      "SELECT * FROM store_configs WHERE slug = ? AND access_password = ?"
    ).bind(slug, password).first();

    if (!store) {
      return NextResponse.json({ error: "IDまたはパスワードが正しくありません。" }, { status: 401 });
    }

    // パートナー用トークンを発行（role: partner, slug: 店舗識別子）
    const token = await signJWT({ slug, role: 'partner' }, env.JWT_SECRET || "fallback");
    
    const response = NextResponse.json({ success: true });
    response.cookies.set('partner_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 12, // 12時間
      path: '/',
    });

    return response;
  } catch (e: any) {
    return NextResponse.json({ error: "システムエラーが発生しました。" }, { status: 500 });
  }
}
