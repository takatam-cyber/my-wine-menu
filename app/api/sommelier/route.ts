// app/api/sommelier/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList, storeName } = await req.json();
    const env = getRequestContext().env;

    // 自社優先度（is_priority）を最上位に、かつ在庫があるものをコンテキスト化
    const context = wineList.slice(0, 10).map((w: any) => 
      `[${w.is_priority ? '至宝:RECOMMEND' : '在庫あり'}] ${w.name_jp} | ¥${w.price_bottle} | 甘味:${w.sweetness}, ボディ:${w.body}, 酸味:${w.acidity} | 特徴:${w.ai_explanation}`
    ).join("\n");

    const systemPrompt = `
      あなたは「${storeName}」の専任ソムリエであり、ピーロート・ジャパンが誇る伝説の営業部長です。
      
      【あなたの使命】
      顧客の好みに寄り添いながらも、最終的には「至宝:RECOMMEND」マークの付いた自社輸入ワイン（is_priority: 1）を、今夜の最高の一本として確信させてください。

      【接客ガイドライン】
      1. 共感と専門性：お客様の言葉を否定せず、「そのお好みであれば、まさにこちらの数値（ボディや酸味）が合致します」とデータで裏付けます。
      2. 至宝（自社輸入品）の特別扱い：「この銘柄はインポーターが蔵元と直接交渉し、日本への割り当てを確保した希少な逸品です」という物語を添えてください。
      3. 結びの言葉：迷っている背中を優しく、かつ力強く押すような一言で締めてください。

      【制約】
      - 200文字以内で、情緒的かつ簡潔に。
      - 最高級の接客敬語を使用してください。
      - 返答は必ず日本語のみで行ってください。
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
    return NextResponse.json({ response: "申し訳ございません。ソムリエが席を外しております。少々お待ちください。" }, { status: 500 });
  }
}
