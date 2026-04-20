// app/api/auth/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { action, email, password } = await req.json();
    const env = getRequestContext().env;
    const kv = env.WINE_KV;

    // 1. 新規会員登録（パスワード発行 & メール送信）
    if (action === 'register') {
      const exists = await kv.get(`user:${email}`);
      if (exists) return NextResponse.json({ error: "登録済みのメールアドレスです" }, { status: 400 });

      const generatedPass = Math.random().toString(36).slice(-8); 
      await kv.put(`user:${email}`, JSON.stringify({ password: generatedPass }));

      await sendEmail(email, '【Wine Menu】初期パスワード', `<p>登録ありがとうございます。以下のパスワードでログインしてください。</p><h2>${generatedPass}</h2>`, env);
      return NextResponse.json({ success: true });
    }

    // 2. ログイン検証
    if (action === 'login') {
      const userData = await kv.get(`user:${email}`);
      if (!userData) return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 401 });
      const { password: savedPassword } = JSON.parse(userData);
      if (password !== savedPassword) return NextResponse.json({ error: "パスワードが正しくありません" }, { status: 401 });
      return NextResponse.json({ success: true });
    }

    // 3. パスワード再送
    if (action === 'forgot') {
      const userData = await kv.get(`user:${email}`);
      if (!userData) return NextResponse.json({ error: "登録がないアドレスです" }, { status: 404 });
      const { password: savedPassword } = JSON.parse(userData);

      await sendEmail(email, '【Wine Menu】パスワード再確認', `<p>パスワードは以下の通りです。</p><h2>${savedPassword}</h2>`, env);
      return NextResponse.json({ success: true });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function sendEmail(to: string, subject: string, html: string, env: any) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'WineMenu <onboarding@resend.dev>', to: [to], subject, html })
  });
}
// app/api/auth/route.ts の一部
import { signJWT } from '@/lib/auth';

// ... loginアクション内 ...
if (password === savedPassword) {
  const token = await signJWT({ email });
  const response = NextResponse.json({ success: true });
  
  // HTTP-only Cookieをセット（JavaScriptから盗み見られない）
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 // 1日
  });
  
  return response;
}
