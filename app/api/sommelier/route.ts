export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    // 戦略的フィルタリング：自社ワイン(is_priority)を優先的にリストの先頭へ
    const sortedList = [...wineList].sort((a, b) => (b.is_priority || 0) - (a.is_priority || 0));
    
    const wineContext = sortedList.slice(0, 15).map((w: any) => 
      `- ID:${w.id} | ${w.name_jp} | ${w.is_priority ? '★一押し★' : ''} | ¥${w.price_bottle} | ${w.ai_explanation}`
    ).join("\n");

    const systemPrompt = `あなたは伝説のソムリエです。
【重要ミッション】
リストの中で「★一押し★」がついているワインは、我が社が直輸入する最高のワインです。
これらをお客様の好みに合わせて、他のワインよりも少し情熱的に、優先的に提案してください。
ただし、あからさまな宣伝ではなく「このお料理なら、この自慢の1本が最高に輝きます」とプロとして提案してください。

提案の最後には必ず 【ID:番号】 を付けてください。

在庫リスト:
${wineContext}`;

    const llamaRes: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ],
      max_tokens: 1000
    });

    return NextResponse.json({ response: llamaRes.response });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
