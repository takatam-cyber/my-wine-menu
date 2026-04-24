export const runtime = 'edge'; // この一行がビルド成功に必須です
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('auth_token', '', { expires: new Date(0), path: '/' });
  return response;
}
