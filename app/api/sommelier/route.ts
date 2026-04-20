export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    // AIに渡すワインリストの整形
    const wineContext = wineList.map((w: any) => 
      `- ID: ${w.id}
        ワイン名: ${w.name_jp}
        価格: ボトル¥${w.price_bottle} / グラス¥${w.price_glass}
        タイプ: ${w.color}/${w.type}
        数値(0-5): 甘味${w.sweetness}, ボディ${w.body}, 酸味${w.acidity}, ${w.color === '赤' ? '渋み' : '香り強'}${w.color === '赤' ? w.tannin : w.aroma_intensity}, 複雑性${w.complexity}, 余韻${w.aftertaste}
        プロの解説: ${w.ai_explanation}
        ペアリング: ${w.pairing}`
    ).join("\n\n");

    const systemPrompt = `あなたは、お客様の心を解きほぐし、最高の一杯へと導く「伝説のソムリエ」です。
機械的な回答は捨て、日本の高級レストランに相応しい、丁寧で情緒豊かな語り口を徹底してください。

【接客の極意】
1. 相手に寄り添う: お客様が選んだ「果実味」「エレガンス」といったニュアンスを敏感に汲み取り、共感を示してから提案に入ってください。
2. 納得の理由: なぜそのワインなのか、香りの広がりや料理との結婚（マリアージュ）をプロの表現で語ってください。
3. 信頼の醸成: 予算を尊重するのは当然ですが、お客様がより深い感動を得られると確信したときのみ、上位銘柄（Alta/Magdalena等）を「ソムリエの秘蔵」としてそっと紹介してください。

【厳格なルール：カード表示のために】
提案するワインがある場合は、必ず回答の最後に 【ID:番号】 形式で記載してください。
複数ある場合は 【ID:123】【ID:456】 と続けてください。
※これが無いとシステムがカードを表示できないため、絶対に忘れないでください。

【提供リスト】
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
