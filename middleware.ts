// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/auth';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const { pathname, searchParams } = req.nextUrl;
  
  // Cloudflareの環境変数を取得
  const env = (getRequestContext() as any)?.env;
  const secret = env?.JWT_SECRET || "fallback_secret";

  // --- 【重要】認証除外リスト（ここを通さないとログインできない） ---
  if (
    pathname === '/admin/login' || 
    pathname === '/' ||
    pathname === '/api/auth' || // ログインAPIを除外
    pathname.startsWith('/api/store/config/public') || // 公開設定APIを除外
    (pathname === '/api/wines' && searchParams.has('slug')) // 公開メニューAPIを除外
  ) {
    return NextResponse.next();
  }

  // 管理画面とAPI全般を保護
  const isProtectedRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/');

  if (isProtectedRoute) {
    const payload = token ? await verifyJWT(token, secret) : null;
    if (!payload) {
      // APIリクエストの場合は401エラーを返す
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // 画面アクセスの場合はログイン画面へリダイレクト
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
