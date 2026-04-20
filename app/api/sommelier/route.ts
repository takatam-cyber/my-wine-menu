// app/api/sommelier/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    const wineContext = wineList.map((w: any) => 
      `- ID: ${w.id} | ${w.name_jp} | ボトル¥${w.price_bottle} | 解説:${w.ai_explanation} | 相性:${w.pairing}`
    ).join("\n");

    const systemPrompt = `あなたは銀座の伝説的ソムリエです。
お客様に寄り添い、優雅で自然な日本語でワインをご案内してください。

【厳守：システムルール】
1. 回答は簡潔に（300文字以内）。
2. お勧めするワインのIDを、必ず回答の最後に 【ID:番号】 の形式で記載してください。
   例：...是非ご賞味ください。【ID:9293333】
   複数ある場合は 【ID:123】【ID:456】 と並べてください。
3. リスト外のワインは絶対に提案しないでください。

【ワインリスト】
${wineContext}`;

    const llamaRes: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ],
      max_tokens: 800
    });

    return NextResponse.json({ response: llamaRes.response });
  } catch (e) {
    return NextResponse.json({ error: "API Error" }, { status: 500 });
  }
}
