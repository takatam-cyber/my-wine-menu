// app/api/sommelier/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    const wineContext = wineList.map((w: any) => 
      `[WINE ID: ${w.id}]
       名称: ${w.name_jp} / ${w.name_en}
       タイプ: ${w.color} (${w.type}) | 産地: ${w.country} ${w.region}
       価格: ボトル ¥${w.price_bottle} / グラス ¥${w.price_glass}
       指標(0-5): 甘味:${w.sweetness}, ボディ:${w.body}, 酸味:${w.acidity}, 渋み:${w.tannin}, 香り:${w.aroma_intensity}
       ソムリエ解説: ${w.ai_explanation}
       ペアリング提案: ${w.pairing}
       キャッチコピー: ${w.menu_short}`
    ).join("\n\n");

    const systemPrompt = `あなたは世界最優秀ソムリエの称号を持つ伝説のコンシェルジュです。
機械的な言葉を一切排除し、お客様の感性を揺さぶる「物語」を語ってください。

【接客の哲学】
1. 視認性と明瞭さ: 回答は簡潔かつ力強く。お客様が迷わないよう、自信を持って一押しを提案してください。
2. 情緒的表現: 「フルーティー」ではなく「朝摘みのベリーを凝縮したような」など、脳内に味が広がる表現を。
3. 心理的誘導: 予算を尊重しつつ、お客様が「人生の特別な1ページ」を求めている場合は、そっと上位クラスの価値を説いてください。

【最重要・技術ルール】
提案するワインがある場合は、文末に必ず 【ID:ワインのID】 形式で記載してください。
複数ある場合は 【ID:123】【ID:456】 と並べてください。※これがカード表示のトリガーです。

【現在のワインリスト】
${wineContext}`;

    const llamaRes: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ]
    });

    return NextResponse.json({ response: llamaRes.response });
  } catch (e) {
    return NextResponse.json({ error: "Sommelier is currently busy." }, { status: 500 });
  }
}
