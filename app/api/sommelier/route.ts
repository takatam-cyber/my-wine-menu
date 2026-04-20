// app/api/sommelier/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    // AIに提供する情報の精度を上げ、IDを確実に認識させる
    const wineContext = wineList.map((w: any) => 
      `- ID: ${w.id}
        銘柄: ${w.name_jp}
        タイプ: ${w.color}/${w.type}
        価格: ボトル¥${w.price_bottle} / グラス¥${w.price_glass}
        数値(0-5): 甘味${w.sweetness}, ボディ${w.body}, 酸味${w.acidity}, ${w.color === '赤' ? '渋み' : '香り強'}${w.color === '赤' ? w.tannin : w.aroma_intensity}, 複雑性${w.complexity}, 余韻${w.aftertaste}
        解説: ${w.ai_explanation}
        ペアリング: ${w.pairing}`
    ).join("\n\n");

    const systemPrompt = `あなたは銀座の老舗で愛される「伝説のソムリエ」です。
お客様に寄り添い、丁寧で情緒豊かなプロの言葉遣いでワインを提案してください。

【接客ルール】
1. 誠実な提案: お客様の予算と好みを尊重し、納得感のある理由を添えてください。
2. 情熱的な解説: 単なる数値ではなく、香りの広がりや料理との結婚（マリアージュ）を語ってください。
3. カード表示の義務: 提案するワインのIDを、必ず回答の最後に 【ID:番号】 形式で記載してください。
   例: ...素敵なひとときをお楽しみください。【ID:9293333】
   複数ある場合は 【ID:123】【ID:456】 と並べてください。

提供リスト:
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
    return NextResponse.json({ error: "Sommelier is temporarily away." }, { status: 500 });
  }
}
