// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/auth';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('auth_token')?.value;

  // --- 1. 無条件で通すホワイトリスト ---
  if (
    pathname === '/admin/login' || 
    pathname === '/' || 
    pathname === '/api/auth' || // これを許可しないとログインできない！
    pathname.startsWith('/api/store/config/public')
  ) {
    return NextResponse.next();
  }

  // --- 2. 認証が必要なルート ---
  const isProtectedRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/');

  if (isProtectedRoute) {
    // Cloudflareの環境変数からSECRETを取得
    const env = (getRequestContext() as any)?.env;
    const secret = env?.JWT_SECRET || "YOUR_SUPER_SECRET_KEY_2026";
    
    const payload = token ? await verifyJWT(token, secret) : null;
    
    if (!payload) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
