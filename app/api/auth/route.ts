// app/api/auth/route.ts の完全版
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { signJWT } from '../../../lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 【プロの対策】ハードコードを避け、環境変数から取得するように変更（無ければデフォルト）
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "takatam@pieroth.jp";
    const ADMIN_PASS = process.env.ADMIN_PASS || "19770912";

    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      const token = await signJWT({ email });
      const response = NextResponse.json({ success: true });
      
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict', // セキュリティレベルを最高に
        maxAge: 60 * 60 * 12, // 12時間で自動ログアウト
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ error: "認証に失敗しました。正しい権限が必要です。" }, { status: 401 });
  } catch (e: any) {
    return NextResponse.json({ error: "システムエラーが発生しました。" }, { status: 500 });
  }
}
