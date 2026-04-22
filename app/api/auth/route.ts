export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { signJWT } from '../../../lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const env = getRequestContext().env; // これで設定値を取得

    // ダッシュボードに設定した「ADMIN_EMAIL」「ADMIN_PASS」を直接参照
    const ADMIN_EMAIL = env.ADMIN_EMAIL;
    const ADMIN_PASS = env.ADMIN_PASS;

    if (!ADMIN_EMAIL || !ADMIN_PASS) {
      return NextResponse.json({ error: "サーバー側で環境変数が読み込めていません。設定を確認してください。" }, { status: 500 });
    }

    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      // 署名にもダッシュボードの秘密鍵を使用
      const token = await signJWT({ email }, env.JWT_SECRET);
      const response = NextResponse.json({ success: true });
      
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 12,
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ error: "認証に失敗しました。メールアドレスまたはパスワードが正しくありません。" }, { status: 401 });
  } catch (e: any) {
    return NextResponse.json({ error: "システムエラーが発生しました。" }, { status: 500 });
  }
}
