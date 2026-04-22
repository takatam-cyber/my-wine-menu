export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const env = getRequestContext().env;
    const RESEND_API_KEY = "42e2e0de-4ac0-4ff6-a9b3-0b436f85b240"; // ユーザー提供のID

    if (!email.toLowerCase().endsWith("@pieroth.jp")) {
      return NextResponse.json({ error: "ピーロート社員限定です" }, { status: 400 });
    }

    const tempPassword = Math.random().toString(36).substring(2, 8).toUpperCase();

    // データベース保存
    await env.DB.prepare(`
      INSERT INTO users (email, temp_password) VALUES (?, ?)
      ON CONFLICT(email) DO UPDATE SET temp_password = excluded.temp_password
    `).bind(email, tempPassword).run();

    // Resend APIでメール送信
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Wine Menu System <onboarding@resend.dev>', // 独自ドメイン設定前はこの送信元
        to: email,
        subject: '【重要】ログイン用パスワードの発行',
        html: `<strong>ピーロート社員 認証システム</strong><p>ログイン用の仮パスワードは <b>${tempPassword}</b> です。</p>`
      })
    });

    if (!res.ok) throw new Error("メール送信に失敗しました");

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
