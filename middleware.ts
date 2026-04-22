import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // ホワイトリスト：認証なしでアクセス可能
  if (
    pathname === '/' ||
    pathname === '/admin/login' ||
    pathname === '/admin/register' ||
    pathname === '/api/auth' ||
    pathname === '/api/auth/register' ||
    pathname.startsWith('/api/store/config/public') ||
    pathname.startsWith('/api/wines') // 公開メニュー用
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
