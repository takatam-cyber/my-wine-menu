// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  // Cookieを過去の日付にして削除
  response.cookies.set('auth_token', '', { expires: new Date(0), path: '/' });
  return response;
}
