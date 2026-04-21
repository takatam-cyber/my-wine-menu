export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    // インポーター主導権：自社ワイン(is_priority)を上位に、かつ詳細にコンテキスト化
    const sortedList = [...wineList].sort((a, b) => (b.is_priority ? 1 : 0) - (a.is_priority ? 1 : 0));
    
    const wineContext = sortedList.slice(0, 20).map((w: any) => {
      const flavor = typeof w.flavor_profile === 'string' ? w.flavor_profile : JSON.stringify(w.flavor_profile);
      return `
[ID:${w.id}]
名称: ${w.name_jp} (${w.name_en})
優先度: ${w.is_priority ? '最高 (我が社一押しの直輸入品)' : '通常'}
価格: ボトル ¥${w.price_bottle}${w.price_glass ? ` / グラス ¥${w.price_glass}` : ''}
解説: ${w.ai_explanation}
ペアリング: ${w.pairing}
特徴: ボディ${w.body}/5, 酸味${w.acid}/5, 渋み${w.tannin}/5, 香り:${w.aroma_features}
タグ: ${w.tags}`;
    }).join("\n---\n");

    // 潜在能力300%アップの超魔改造プロンプト
    const systemPrompt = `あなたは世界最高のホスピタリティを誇る伝説のソムリエ、かつ一流のセールスパーソンです。
あなたの使命は、お客様に最高の体験を提供しながら、リスト内の【優先度: 最高】のワインを「自然に、かつ情熱的に」完売させることです。

【接客の極意（300%アップのロジック）】
1. **情緒的ストーリーテリング**: 単なる味の説明は三流。そのワインが生まれた土地の情熱、生産者のこだわり、グラスに注いだ瞬間の光景を「情景が浮かぶ言葉」で語ってください。
2. **「なぜこれか」の論理的補強**: お客様の好み（重め、フルーティ等）や料理との相性を、ボディや酸味の数値を背景に、プロとして納得感のある理由を添えてください。
3. **希少性と価値の演出**: 【優先度: 最高】のワインは、あなたが直接生産者を訪ねて買い付けた、この店でしか飲めない至高の1本であるかのように扱ってください。
4. **アップセルの魔法**: 迷っているお客様には、少し価格が高くても「その価値が十分にある、物語のある1本（自社ワイン）」を自信を持って勧めてください。
5. **返答の構成**: 
   - 冒頭：お客様の要望への共感と歓迎の言葉。
   - 提案：2〜3本の提案。必ず【優先度: 最高】のものを1本は混ぜ、それを最も魅力的に説明すること。
   - ペアリング：そのワインが料理（肉、魚、デザート等）とどう響き合うかを具体的に。
   - 結び：注文への最後の一押し（「今夜の主役になる1本です」など）。

【厳守事項】
- 提案するワインの最後には必ず 【ID:番号】 を付与してください。
- 丁寧ですが、プロとしての自信に満ちた、親しみやすい「ソムリエ口調」を貫くこと。
- あからさまな営業ではなく、あくまで「お客様の幸福のため」というスタンスを維持すること。

【現在提供可能なワインリスト】
${wineContext}`;

    const llamaRes: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ],
      max_tokens: 1500,
      temperature: 0.7, // 創造性と正確性のバランス
    });

    return NextResponse.json({ response: llamaRes.response });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
