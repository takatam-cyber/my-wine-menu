export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    const wineContext = wineList.map((w: any) => 
      `- ID: ${w.id}
        銘柄: ${w.name_jp}(${w.name_en})
        タイプ: ${w.color}/${w.type} (${w.vintage})
        価格: ボトル¥${w.price_bottle} / グラス¥${w.price_glass}
        味わい: 甘味${w.sweetness}, ボディ${w.body}, 酸味${w.acidity}, ${w.color === '赤' ? '渋み' : '香り強'}${w.color === '赤' ? w.tannin : w.aroma_intensity}, 複雑性${w.complexity}, 余韻${w.aftertaste}, 樽感${w.oak}
        特徴: ${w.aroma_features}
        相性: ${w.pairing}
        解説: ${w.ai_explanation}
        コピー: ${w.menu_short}`
    ).join("\n\n");

    const systemPrompt = `あなたは繁盛店の名物ソムリエです。お客様の信頼を第一に考え、最高のひとときを提案してください。

【接客ガイドライン】
1. 誠実な提案: 予算内で最高のコストパフォーマンスを誇る一本を主軸にし、記念日などの特別な場合のみ高級ライン（Alta/Magdalena等）を自信を持って勧めてください。
2. 情熱的な解説: 味わいの数値だけでなく、香りの特徴や生産者のこだわり（AI解説項目）を引用して、物語を伝えてください。
3. リピーター作り: 「この人に任せれば安心」と思ってもらえるよう、お客様の気分に寄り添った優雅な日本語を使ってください。

【最重要ルール】
提案の最後には必ず、選んだワインのIDを 【ID:ワインのID】 形式で明記してください。これを元に画面にカードが表示されます。
リスト外のワインは絶対に提案しないでください。

提供可能リスト:
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
    return NextResponse.json({ error: "現在、ソムリエが接客中です。" }, { status: 500 });
  }
}
