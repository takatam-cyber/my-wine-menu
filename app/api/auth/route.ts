// app/api/auth/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { signJWT } from '../../../lib/auth'; // パスを死守

export async function POST(req: Request) {
  try {
    // 画面から送られてきたメールアドレスとパスワードを受け取る
    const body = await req.json();
    const { email, password } = body;

    // 【重要】インポーター（あなた）専用の固定ログイン情報
    // ひとまずこれでログインできるようにします
    if (email === "importer@example.com" && password === "winepro2026") {
      const token = await signJWT({ email });
      const response = NextResponse.json({ success: true });
      
      // ブラウザに「ログイン中」という鍵（クッキー）を渡す
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 1日間有効
        path: '/',
      });
      return response;
    }

    // 認証失敗
    return NextResponse.json({ error: "メールアドレスまたはパスワードが正しくありません" }, { status: 401 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
