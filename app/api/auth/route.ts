export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { signJWT } from '../../../lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 環境変数から取得。未設定時のフォールバックは開発用のみ。
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASS = process.env.ADMIN_PASS;

    if (!ADMIN_EMAIL || !ADMIN_PASS) {
      return NextResponse.json({ error: "サーバー設定エラー: 環境変数が未設定です。" }, { status: 500 });
    }

    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      const token = await signJWT({ email });
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

    return NextResponse.json({ error: "認証に失敗しました。" }, { status: 401 });
  } catch (e: any) {
    return NextResponse.json({ error: "システムエラー" }, { status: 500 });
  }
}
