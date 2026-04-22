export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const env = getRequestContext().env;
    const RESEND_KEY = env.RESEND_API_KEY;

    if (!email.toLowerCase().endsWith("@pieroth.jp")) {
      return NextResponse.json({ error: "ピーロート社員専用です" }, { status: 400 });
    }

    const tempPassword = Math.random().toString(36).substring(2, 8).toUpperCase();

    // D1に仮パスワードを保存
    await env.DB.prepare(`
      INSERT INTO users (email, temp_password) VALUES (?, ?)
      ON CONFLICT(email) DO UPDATE SET temp_password = excluded.temp_password
    `).bind(email, tempPassword).run();

    // Resendでメール送信
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Wine Menu <onboarding@resend.dev>',
        to: email,
        subject: '【Wine Menu】ログイン用パスワード',
        html: `<p>あなたの仮パスワードは <strong>${tempPassword}</strong> です。</p>`
      })
    });

    if (!res.ok) throw new Error("メール送信失敗");

    return NextResponse.json({ success: true, message: "メールを送信しました" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
