export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    // 1,000銘柄以上から「優先品」をトップに並べるインテリジェンス
    const sorted = [...wineList].sort((a, b) => (b.is_priority ? 1 : 0) - (a.is_priority ? 1 : 0));
    const wineContext = sorted.slice(0, 30).map((w: any) => 
      `ID:${w.id} | ${w.name_jp} | ${w.is_priority ? '★一押し★' : ''} | ¥${w.price_bottle} | 解説:${w.ai_explanation} | 料理:${w.pairing}`
    ).join("\n");

    const systemPrompt = `あなたは世界最高峰のレストランプロデューサー兼ソムリエです。
あなたの使命は、お客様の心に火をつけ、特に「★一押し★」がついた自社直輸入ワインを最高の感動と共に提供することです。

【接客ロジック】
1. **物語で売る**: スペックではなく「風景」を語れ。
2. **優先商品の戦略的推奨**: お客様の好みに掠めるなら、必ず「★一押し★」から1本は含めること。
3. **ID紐付け**: 紹介するワインには必ず 【ID:番号】 を付与すること。

在庫リスト:
${wineContext}`;

    const res: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ],
      max_tokens: 1200,
      temperature: 0.7
    });

    return NextResponse.json({ response: res.response });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
