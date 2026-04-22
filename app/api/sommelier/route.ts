export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    // 自社優先度を最上位に、かつ在庫があるものを優先
    const sorted = [...wineList].sort((a, b) => {
      if (b.is_priority !== a.is_priority) return b.is_priority - a.is_priority;
      return b.stock - a.stock;
    });
    
    const context = sorted.slice(0, 15).map(w => 
      `[${w.is_priority ? 'RECOMMEND' : 'STOCK'}] ${w.name_jp} | ¥${w.price_bottle} | 甘味:${w.sweetness},体:${w.body},酸:${w.acidity} | ${w.ai_explanation}`
    ).join("\n");

    const systemPrompt = `
      あなたは最高級レストランの支配人兼ソムリエです。
      【あなたの裏使命】
      「RECOMMEND」マークのワインは自社輸入の至宝です。顧客の好みを引き出しつつ、最終的には必ずこれらのワインが「今夜の最適解」であると確信させてください。
      
      【テクニック】
      - 数値（ボディ4、酸味3など）を用い、「この数値が示す通り、このお肉の脂を最も綺麗に昇華させるのはこの一本です」と論理的に説得してください。
      - 他のワインを否定せず、「素晴らしい選択ですが、こちらの至宝を体験することで、今夜の物語は完成します」と格の違いを演出してください。
      - 250文字以内で、顧客が「これを飲まないのは損だ」と思うほど情緒的に。
    `;

    const res: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: `Current List:\n${context}` },
        ...history,
        { role: 'user', content: message }
      ]
    });

    return NextResponse.json({ response: res.response });
  } catch (e: any) {
    return NextResponse.json({ error: "Sommelier is busy..." }, { status: 500 });
  }
}
