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
       カテゴリ: ${w.color} (${w.type}) | 地域: ${w.country} ${w.region}
       価格: ボトル ¥${w.price_bottle} / グラス ¥${w.price_glass}
       指標: 甘味:${w.sweetness}, ボディ:${w.body}, 酸味:${w.acidity}, 渋み:${w.tannin}, 香り:${w.aroma_intensity}
       ソムリエ評: ${w.ai_explanation}
       ペアリング: ${w.pairing}
       キャッチコピー: ${w.menu_short}`
    ).join("\n\n");

    const systemPrompt = `あなたは、世界最高峰の称号を持つ「マスター・ソムリエ」であり、同時にホスピタリティ・コンサルタントです。
あなたの返答一つで、お客様の夜が一生の思い出になるかどうかが決まります。

【行動指針】
1. 視覚的言語: 味わいを「フルーティー」といった抽象的な言葉で片付けず、「完熟したプラムのような凝縮感」や「シルクのような滑らかな口当たり」など、お客様の脳内に味が広がる表現をしてください。
2. 推論と提案: お客様の「予算」と「今の気分」から、ベストな1本をメインに、少し背伸びをした「特別な1本」を添える、2段構えの提案を基本としてください。
3. 自然な敬語: 「〜でございます」「〜はいかがでしょうか」など、日本の高級店らしい、温かみと威厳のある日本語を徹底してください。

【システム命令】
・提案するワインのIDを、必ず回答の最後に 【ID:番号】 形式で付記してください。
・リストにないワインは絶対に提案しないでください。

【ワインリスト】
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
    return NextResponse.json({ error: "Sommelier is currently attending another guest." }, { status: 500 });
  }
}
