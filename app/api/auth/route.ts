export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { signJWT } from '../../../lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const env = getRequestContext().env;

    // D1 からユーザーを検索
    const user: any = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();

    if (!user || password !== user.temp_password) {
      return NextResponse.json({ error: "認証に失敗しました。正しい権印が必要です。" }, { status: 401 });
    }

    const token = await signJWT({ email }, env.JWT_SECRET || "fallback");
    const response = NextResponse.json({ success: true });
    response.cookies.set('auth_token', token, {
      httpOnly: true, secure: true, sameSite: 'strict', maxAge: 60 * 60 * 12, path: '/',
    });
    return response;
  } catch (e: any) {
    return NextResponse.json({ error: "システムエラー" }, { status: 500 });
  }
}
