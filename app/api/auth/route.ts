// app/api/auth/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { signJWT } from '../../../lib/auth';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const env = getRequestContext().env as any;

    // 基本的に管理者は環境変数で制御、一般営業スタッフは必要に応じてD1で照合可能
    const ADMIN_EMAIL = env.ADMIN_EMAIL || "takatam@pieroth.jp";
    const ADMIN_PASS = env.ADMIN_PASS || "19770912";

    // ログインチェック
    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      const token = await signJWT({ email });
      const response = NextResponse.json({ success: true });
      
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24時間
        path: '/',
      });
      return response;
    }

    return NextResponse.json(
      { error: "認証に失敗しました。メールアドレスまたはパスワードを確認してください。" }, 
      { status: 401 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
