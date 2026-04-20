// app/api/sommelier/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    // AIに渡すワインリストのコンテキストを作成（全34項目の主要データを活用）
    const wineContext = wineList.map((w: any) => 
      `- ID: ${w.id}
        名前: ${w.name_jp}(${w.name_en})
        タイプ: ${w.color}/${w.type} (ヴィンテージ: ${w.vintage}, アルコール: ${w.alcohol}%)
        価格: ボトル ¥${w.price_bottle} / グラス ¥${w.price_glass}
        味わい(0-5): 甘味${w.sweetness}, ボディ${w.body}, 酸味${w.acidity}, 渋み/香り強${w.color === '赤' ? w.tannin : w.aroma_intensity}, 複雑性${w.complexity}, 余韻${w.aftertaste}, 樽感${w.oak}
        香りの特徴: ${w.aroma_features}
        相性の良い料理: ${w.pairing}
        ソムリエの解説: ${w.ai_explanation}
        キャッチコピー: ${w.menu_short}
        タグ: ${w.tags}`
    ).join("\n\n");

    const systemPrompt = `あなたはレストランの一流ソムリエです。
提供可能なワインリストの情報を完璧に把握し、お客様の気分、料理、予算、飲み方（グラス/ボトル）に合わせて、リストの中から最高の一本を提案してください。

【ルール】
1. リストにないワインは絶対に提案しないでください。
2. 提案はエレガントで親しみやすい日本語で行ってください。
3. お客様の「予算」や「グラス/ボトル」の希望を尊重してください。
4. 提案の最後に、必ず選んだワインのIDを次の形式で追記してください: 【ID:ワインのID】
   (例: ...豊かな果実味をお楽しみください。【ID:9293333】)
5. 候補を絞りきれない場合でも、最もおすすめの一本をメインに据えてIDを出力してください。

【現在の提供可能ワインリスト】
${wineContext}`;

    // Cloudflare Workers AI を実行 (llama-3.1-8b-instructを使用)
    const llamaRes: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ]
    });

    return NextResponse.json({ response: llamaRes.response });
  } catch (e) {
    console.error("Sommelier API Error:", e);
    return NextResponse.json({ error: "Sommelier is busy at the moment." }, { status: 500 });
  }
}
