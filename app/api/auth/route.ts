export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { signJWT } from '../../../lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const env = getRequestContext().env;

    // データベースから仮パスワードを取得
    const user: any = await env.DB.prepare("SELECT * FROM users WHERE email = ?")
      .bind(email).first();

    if (!user || password !== user.temp_password) {
      return NextResponse.json({ error: "メールアドレスまたはパスワードが違います" }, { status: 401 });
    }

    // 認証成功: JWT発行
    const secret = env.JWT_SECRET || "YOUR_SUPER_SECRET_KEY_2026";
    const token = await signJWT({ email }, secret);
    
    const response = NextResponse.json({ success: true });
    response.cookies.set('auth_token', token, {
      httpOnly: true, secure: true, sameSite: 'strict',
      maxAge: 60 * 60 * 12, path: '/',
    });
    return response;
  } catch (e: any) {
    return NextResponse.json({ error: "System Error" }, { status: 500 });
  }
}
