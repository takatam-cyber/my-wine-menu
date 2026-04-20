// app/api/auth/route.ts (完全清掃・パス修正版)
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { signJWT } from '../../../lib/auth'; // 相対パスに変更してエラーを回避

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, password } = body;
    const env = getRequestContext().env;
    const kv = env.WINE_KV;

    // 1. ログイン検証
    if (action === 'login') {
      const userData = await kv.get(`user:${email}`);
      if (!userData) return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 401 });
      
      const { password: savedPassword } = JSON.parse(userData);
      if (password !== savedPassword) return NextResponse.json({ error: "パスワード不一致" }, { status: 401 });

      // 成功：トークンを発行
      const token = await signJWT({ email });
      const response = NextResponse.json({ success: true });
      
      // HttpOnly Cookieをセット
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 // 1日
      });
      
      return response;
    }

    // 2. 会員登録（必要であれば）
    if (action === 'register') {
       // ...以前のロジック...
       return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
