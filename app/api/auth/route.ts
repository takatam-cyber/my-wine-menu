export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages'; // Cloudflare用
import { signJWT } from '../../../lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const env = getRequestContext().env; // ダッシュボードの設定値を取得

    // Cloudflareダッシュボードで設定した値を使用
    const ADMIN_EMAIL = env.ADMIN_EMAIL;
    const ADMIN_PASS = env.ADMIN_PASS;
    const JWT_SECRET = env.JWT_SECRET;

    if (!ADMIN_EMAIL || !ADMIN_PASS) {
      return NextResponse.json({ error: "サーバー設定（環境変数）が読み込めていません。" }, { status: 500 });
    }

    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      // JWT_SECRETもダッシュボードの設定値を使用
      const token = await signJWT({ email }, JWT_SECRET || "fallback_secret");
      const response = NextResponse.json({ success: true });
      
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 12, // 12時間
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ error: "認証に失敗しました。メールアドレスまたはパスワードが違います。" }, { status: 401 });
  } catch (e: any) {
    return NextResponse.json({ error: "システムエラーが発生しました。" }, { status: 500 });
  }
}
