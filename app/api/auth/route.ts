// app/api/auth/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { signJWT } from '../../../lib/auth';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const env = getRequestContext().env as any;

    // Cloudflareの環境変数から取得、未設定時はデフォルト値を使用
    const ADMIN_EMAIL = env.ADMIN_EMAIL || "takatam@pieroth.jp";
    const ADMIN_PASS = env.ADMIN_PASS || "19770912";

    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      const token = await signJWT({ email });
      const response = NextResponse.json({ success: true });
      
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24時間
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ error: "認証に失敗しました。メールアドレスまたはパスワードが正しくありません。" }, { status: 401 });
  } catch (e: any) {
    return NextResponse.json({ error: "認証サーバーエラー" }, { status: 500 });
  }
}
