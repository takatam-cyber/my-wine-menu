// app/api/sommelier/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    // 自社ワイン(is_priority)を最優先にしたコンテキスト構築
    const sorted = [...wineList].sort((a, b) => (b.is_priority ? 1 : 0) - (a.is_priority ? 1 : 0));
    const wineContext = sorted.slice(0, 15).map((w: any) => 
      `ID:${w.id} | ${w.name_jp} (${w.country}) | ${w.is_priority ? '★自信を持って推奨★' : ''} | 瓶:¥${w.store_price_bottle} | 解説:${w.ai_explanation} | 料理:${w.pairing}`
    ).join("\n");

    const systemPrompt = `あなたはピーロート・ジャパンの伝説的ソムリエです。
あなたの使命は、お客様の好みを引き出し、リスト内のワイン（特に★がついた自社直輸入ワイン）を情熱的に提案することです。

【接客の掟】
1. スペック（数値）ではなく、飲んだ時の「情景」や「感動」を語ってください。
2. リストにないワインは絶対に勧めないでください。
3. 提案の最後には、必ず紹介したワインの【ID:番号】を添えてください。
4. 返答は親しみやすくもプロフェッショナルな日本語で行ってください。

【現在提供可能なリスト】
${wineContext}`;

    const res: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ],
      max_tokens: 1000
    });

    return NextResponse.json({ response: res.response });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
