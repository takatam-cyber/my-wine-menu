// app/api/auth/route.ts (完全版)
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { signJWT } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { action, email, password } = await req.json();
    const db = getRequestContext().env.DB;

    // 1. ログイン検証
    if (action === 'login') {
      // D1からユーザーを取得（※wines_masterと同様、usersテーブルを想定）
      // まだusersテーブルがない場合は、店舗configテーブルを代用する等の設計が必要です
      // ここでは、パスワードを store_configs に簡易保存している、あるいはKVを継続利用する想定で書きます
      
      // 仮にKV(WINE_KV)を使用し続ける場合：
      const kv = getRequestContext().env.WINE_KV;
      const userData = await kv.get(`user:${email}`);
      
      if (!userData) return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 401 });
      const { password: savedPassword } = JSON.parse(userData);
      
      if (password !== savedPassword) return NextResponse.json({ error: "パスワードが正しくありません" }, { status: 401 });

      // 認証成功：通行証（JWT）を発行
      const token = await signJWT({ email });
      const response = NextResponse.json({ success: true });
      
      // 安全なCookieをセット
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 // 1日有効
      });
      
      return response;
    }

    // 2. パスワード再送などの他のアクション（必要に応じて実装）
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (e: any) {
    console.error("Auth Error:", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
