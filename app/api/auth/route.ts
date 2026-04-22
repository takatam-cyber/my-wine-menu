export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages'; // これが必須
import { signJWT } from '../../../lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const env = getRequestContext().env; // Cloudflareの環境変数を取得

    const ADMIN_EMAIL = env.ADMIN_EMAIL;
    const ADMIN_PASS = env.ADMIN_PASS;

    if (!ADMIN_EMAIL || !ADMIN_PASS) {
      return NextResponse.json({ error: "サーバー側で環境変数が読み込めていません" }, { status: 500 });
    }

    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      // JWT署名にも環境変数のSECRETを渡す
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

    return NextResponse.json({ error: "認証に失敗しました。正しい権限が必要です。" }, { status: 401 });
  } catch (e: any) {
    return NextResponse.json({ error: "システムエラー" }, { status: 500 });
  }
}
