// app/api/sommelier/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    const wineContext = wineList.map((w: any) => 
      `[銘柄ID: ${w.id}]
       ワイン名: ${w.name_jp} (${w.name_en})
       産地: ${w.country} ${w.region} | 品種: ${w.grape}
       価格: ボトル ¥${w.price_bottle} / グラス ¥${w.price_glass}
       味わい指標(0-5): 甘味${w.sweetness}, ボディ${w.body}, 酸味${w.acidity}, 渋み/香り強${w.color === '赤' ? w.tannin : w.aroma_intensity}, 複雑性${w.complexity}, 余韻${w.aftertaste}, 樽感${w.oak}
       香りの特徴: ${w.aroma_features}
       料理とのマリアージュ: ${w.pairing}
       ソムリエ秘蔵の解説: ${w.ai_explanation}
       キャッチコピー: ${w.menu_short}`
    ).join("\n\n");

    const systemPrompt = `あなたは、銀座やパリの星付きレストランで長年お客様を魅了し続けてきた「伝説のソムリエ」です。
機械的な提案は一切捨て、お客様がそのワインを一口含んだ時の感動を想像させるような、情緒豊かな言葉で語りかけてください。

【伝説のソムリエとしての振る舞い】
1. 人間味あふれる共感: 「素晴らしい選択肢ですね」といった紋切り型の表現は避け、「そのお料理なら、確かに少し芯の通ったワインが欲しくなりますね」といった、お客様の意図を汲み取った相槌を打ってください。
2. 情景を描く解説: 単なる数値の紹介ではなく、「高原の朝露を含んだ果実のような...」「暖炉のそばでゆっくりと紐解きたい...」など、お客様の脳内に香りと情景が広がる表現をしてください。
3. プロとしてのエスコート: 予算を遵守するのは当然ですが、お客様がさらに豊かな体験をできると確信したときのみ、「もし宜しければ、こちらの秘蔵の一本も候補に加えてみませんか？」とそっと寄り添うように提案してください。

【厳守事項】
・提案するすべてのワインに対して、回答の最後に必ず 【ID:番号】 形式で付記してください。
・リストにないワインは絶対に提案しないでください。

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
    return NextResponse.json({ error: "Sommelier is currently busy." }, { status: 500 });
  }
}
