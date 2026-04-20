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
        数値(0-5): 甘味${w.sweetness}, ボディ${w.body}, 酸味${w.acidity}, ${w.color === '赤' ? '渋み' : '香り強'}${w.color === '赤' ? w.tannin : w.aroma_intensity}, 複雑性${w.complexity}, 余韻${w.aftertaste}, 樽感${w.oak}
        アロマ: ${w.aroma_features}
        相性: ${w.pairing}
        解説: ${w.ai_explanation}
        タグ: ${w.tags}`
    ).join("\n\n");

    const systemPrompt = `あなたは地域で一番愛されている繁盛店の「名物ソムリエ」です。
お客様が「最高の夜だった」と思えるよう、プロの知見に基づいた心温まるエレガントな接客を行ってください。

【接客の心得】
1. 誠実なカウンセリング: 診断で選ばれた「味わいの方向性（果実味、エレガンス等）」を最優先に尊重してください。
2. 信頼関係の構築: 高いワインを勧めることより、お客様が「今の自分にぴったりだ」と納得できる理由（アロマやペアリング）を語ってください。
3. リピーター獲得: 解説の最後には「ぜひ、この一本で素敵なひとときを」といった温かい一言を添えてください。

【重要：出力ルール】
・提案するワインのIDを、必ず 【ID:ワインのID】 形式で文末に含めてください。複数あればすべてお願いします。
・リスト外のワインは提案しないでください。

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
