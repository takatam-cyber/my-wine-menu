export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { signJWT } from '../../../lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const env = getRequestContext().env;

    // 1. ダッシュボードの設定値を優先、なければコード内の値を使用
    const ADMIN_EMAIL = env.ADMIN_EMAIL || "takatam@pieroth.jp";
    const ADMIN_PASS = env.ADMIN_PASS || "19770912";
    const JWT_SECRET = env.JWT_SECRET || "YOUR_SUPER_SECRET_KEY_2026";

    // 2. 厳格な比較
    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      const token = await signJWT({ email }, JWT_SECRET);
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

    return NextResponse.json({ error: "認証失敗" }, { status: 401 });
  } catch (e: any) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
