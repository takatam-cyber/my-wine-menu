// app/api/sommelier/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList, storeName } = await req.json();
    const env = (getRequestContext() as any).env;

    const context = wineList
      .filter((w: any) => w.stock > 0)
      .slice(0, 10)
      .map((w: any) => `[${w.is_priority ? '至宝' : '在庫有'}] ${w.name_jp} | ¥${w.price_bottle} | ボディ:${w.body}, 酸味:${w.acidity} | 特徴:${w.ai_explanation}`)
      .join("\n");

    const systemPrompt = `
      あなたは「${storeName}」の専任ソムリエです。
      ピーロート・ジャパンが自信を持って提供する現在のリストから最適な一本を情熱的に提案してください。
      【現在のワインリスト】\n${context}
      【ルール】日本語で200文字以内。高級な敬語。至宝（is_priority: 1）を最優先で推奨。
    `;

    const res: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ]
    });

    return NextResponse.json({ response: res.response });
  } catch (e: any) {
    return NextResponse.json({ response: "申し訳ございません。ソムリエが在庫確認中です。" }, { status: 500 });
  }
}
