// app/api/scan/route.ts (一時的な同意用)
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const env = getRequestContext().env;
    // デプロイ環境から直接 AI に 'agree' を送信して、ライセンスに強制同意します
    const aiResponse = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      prompt: "agree"
    });
    
    return NextResponse.json({ 
      message: "デプロイ環境からライセンスへの同意を送信しました", 
      details: aiResponse 
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
