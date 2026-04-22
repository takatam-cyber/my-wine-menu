export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages'; // 追加
import { signJWT } from '../../../lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    // Cloudflareのコンテキストから環境変数を取得
    const env = getRequestContext().env;
    const ADMIN_EMAIL = env.ADMIN_EMAIL;
    const ADMIN_PASS = env.ADMIN_PASS;

    if (!ADMIN_EMAIL || !ADMIN_PASS) {
      console.error("Environment variables ADMIN_EMAIL or ADMIN_PASS are not set in Cloudflare Dashboard.");
      return NextResponse.json({ error: "サーバー設定エラー" }, { status: 500 });
    }

    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      // lib/auth.ts も secret を引数で取るように修正が必要（後述）
      const token = await signJWT({ email }, env.JWT_SECRET || "fallback_secret");
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

    return NextResponse.json({ error: "認証に失敗しました。" }, { status: 401 });
  } catch (e: any) {
    return NextResponse.json({ error: "システムエラー" }, { status: 500 });
  }
}
