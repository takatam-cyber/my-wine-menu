export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { signJWT } from '../../../lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const env = getRequestContext().env;

    // 1. D1からユーザー情報を取得
    const user: any = await env.DB.prepare("SELECT * FROM users WHERE email = ?")
      .bind(email).first();

    if (!user) {
      return NextResponse.json({ error: "登録が見つかりません。先にパスワードを発行してください。" }, { status: 401 });
    }

    // 2. パスワード照合（D1の仮パスワード、またはマスターパスワード）
    const MASTER_PASS = env.ADMIN_PASS || "19770912";
    if (password === user.temp_password || password === MASTER_PASS) {
      const token = await signJWT({ email }, env.JWT_SECRET || "fallback");
      const response = NextResponse.json({ success: true });
      response.cookies.set('auth_token', token, {
        httpOnly: true, secure: true, sameSite: 'strict',
        maxAge: 60 * 60 * 12, path: '/',
      });
      return response;
    }

    return NextResponse.json({ error: "パスワードが違います" }, { status: 401 });
  } catch (e: any) {
    return NextResponse.json({ error: "認証エラー" }, { status: 500 });
  }
}
