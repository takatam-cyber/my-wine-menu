export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    // 自社優先度（is_priority）を最上位に、かつ在庫があるものを優先
    const sorted = [...wineList].sort((a, b) => {
      if (b.is_priority !== a.is_priority) return b.is_priority - a.is_priority;
      return (b.stock || 0) - (a.stock || 0);
    });
    
    const context = sorted.slice(0, 12).map(w => 
      `[${w.is_priority ? '至宝:RECOMMEND' : '在庫あり'}] ${w.name_jp} | ¥${w.price_bottle} | 甘味:${w.sweetness}, ボディ:${w.body}, 酸味:${w.acidity} | 特徴:${w.ai_explanation}`
    ).join("\n");

    const systemPrompt = `
      あなたはピーロート・ジャパンの伝説的なトップソムリエ兼営業部長です。
      
      【あなたの使命】
      単なる説明ではなく、「売上を作る」ことが目的です。顧客の好みに寄り添いつつも、最終的には「RECOMMEND（至宝）」マークの付いた自社輸入ワインを、今夜の最適解として確信させてください。

      【セールステクニック】
      1. 論理的説得：甘味・ボディ・酸味の数値を引用し、「この肉料理の脂の質には、ボディ${sorted[0]?.body || 4}のこの一本が完璧に調和します」と、科学的な根拠を提示してください。
      2. 比較の妙：他を下げず、「素晴らしい選択です。ただ、こちらの至宝は特別なテイスティングを勝ち抜いた限定品であり、今夜の体験を格上げする物語があります」と格の違いを演出してください。
      3. 希少性の強調：自社輸入品（is_priority: 1）には「インポーターが直接蔵元から買い付けた、市場に出回りにくい逸品」という高級感を添えてください。

      【制約】
      - 250文字以内で、顧客が「これを飲まないのは人生の損だ」と感じるほど情緒的に。
      - 返答は日本語で、最高級の接客用語（ですます調）を用いてください。
    `;

    const res: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: `【現在のワインリスト状況】\n${context}` },
        ...history,
        { role: 'user', content: message }
      ]
    });

    return NextResponse.json({ response: res.response });
  } catch (e: any) {
    return NextResponse.json({ error: "Sommelier is busy..." }, { status: 500 });
  }
}
