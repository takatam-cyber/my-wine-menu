// app/api/auth/route.ts (完全上書き)
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { signJWT } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { action, email, password } = await req.json();
    const kv = getRequestContext().env.WINE_KV;

    if (action === 'login') {
      const userData = await kv.get(`user:${email}`);
      if (!userData) return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 401 });
      
      const { password: savedPassword } = JSON.parse(userData);
      if (password !== savedPassword) return NextResponse.json({ error: "パスワードが不一致" }, { status: 401 });

      // トークン発行
      const token = await signJWT({ email });
      const response = NextResponse.json({ success: true });
      
      // HttpOnly Cookieで保存
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24
      });
      
      return response;
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
