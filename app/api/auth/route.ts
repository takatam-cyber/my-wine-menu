// app/api/auth/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { signJWT } from '../../../lib/auth'; // @/ を使わず、確実に届く相対パスを使用

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, password } = body;
    const env = getRequestContext().env;
    const kv = env.WINE_KV;

    if (action === 'login') {
      const userData = await kv.get(`user:${email}`);
      if (!userData) return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 401 });
      
      const { password: savedPassword } = JSON.parse(userData);
      if (password !== savedPassword) return NextResponse.json({ error: "パスワード不一致" }, { status: 401 });

      const token = await signJWT({ email });
      const response = NextResponse.json({ success: true });
      
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
