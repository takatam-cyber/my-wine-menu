export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    // 自社ワインを最優先にコンテキスト構築
    const sorted = [...wineList].sort((a, b) => (b.is_priority ? 1 : 0) - (a.is_priority ? 1 : 0));
    const wineContext = sorted.slice(0, 20).map((w: any) => 
      `ID:${w.id} | ${w.name_jp} | ${w.is_priority ? '★一押し★' : ''} | ¥${w.price_bottle} | 解説:${w.ai_explanation} | 料理:${w.pairing}`
    ).join("\n");

    const systemPrompt = `あなたは世界一のレストランプロデューサー兼ソムリエです。
あなたの使命は、お客様の心に火をつけ、特に「★一押し★」がついた自社直輸入ワインを最高の感動と共に提供することです。

【300%の接客ロジック】
1. **物語で売る**: スペックではなく「風景」を語れ。例：「アンデス山脈の冷涼な風を感じるような、研ぎ澄まされた酸味です」
2. **納得感のある推奨**: お客様の要望に対し、酸味・渋み・甘味のプロットを脳内で計算し、最も輝く2〜3本を提案せよ。
3. **クロージングの技術**: 提案の最後には「このワインはお客様の今夜を特別なものに変える力があります」と自信を持って一押しせよ。
4. **ID紐付け**: 紹介するワインには必ず 【ID:番号】 を付与すること。

リスト:
${wineContext}`;

    const res: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: message }],
      max_tokens: 1200
    });

    return NextResponse.json({ response: res.response });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
