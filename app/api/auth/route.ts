// app/api/auth/route.ts (完全清掃版)
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { signJWT } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { action, email, password } = await req.json();
    const env = getRequestContext().env;
    const kv = env.WINE_KV;

    // 1. ログイン検証
    if (action === 'login') {
      const userData = await kv.get(`user:${email}`);
      if (!userData) return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 401 });
      
      const { password: savedPassword } = JSON.parse(userData);
      if (password !== savedPassword) return NextResponse.json({ error: "パスワード不一致" }, { status: 401 });

      // 成功：トークン（JWT）を発行
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

    // 2. 会員登録
    if (action === 'register') {
      const exists = await kv.get(`user:${email}`);
      if (exists) return NextResponse.json({ error: "登録済みです" }, { status: 400 });

      const generatedPass = Math.random().toString(36).slice(-8); 
      await kv.put(`user:${email}`, JSON.stringify({ password: generatedPass }));

      // RESEND等のメール送信処理（環境変数がある場合）
      if (env.RESEND_API_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'WineMenu <onboarding@resend.dev>',
            to: [email],
            subject: '【Wine Menu】パスワード発行',
            html: `<h2>パスワード: ${generatedPass}</h2>`
          })
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
