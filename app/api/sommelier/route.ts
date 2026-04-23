// app/api/sommelier/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList, storeName, language } = await req.json();
    const env = (getRequestContext() as any).env;

    // 在庫があるワインをコンテキストとして抽出
    const context = wineList
      .filter((w: any) => w.stock > 0)
      .slice(0, 10)
      .map((w: any) => {
        const name = language === 'en' ? w.name_en : w.name_jp;
        return `[${w.is_priority ? 'Premium' : 'Available'}] ${name} | Price: ¥${w.price_bottle} | Body:${w.body}, Acid:${w.acidity} | Desc:${w.ai_explanation}`;
      })
      .join("\n");

    // 言語に応じたシステム指示の構築
    const isEnglish = language === 'en';
    const systemPrompt = isEnglish 
      ? `You are the exclusive sommelier for "${storeName}". 
         Based on the current wine list below, passionately recommend the perfect bottle.
         
         【Current Wine List】
         ${context}
         
         【Rules】
         - Respond in English.
         - Maximum 200 words.
         - Use elegant and professional language.
         - Prioritize "Premium" (is_priority: 1) wines if they match the user's request.`
      : `あなたは「${storeName}」の専任ソムリエです。
         ピーロート・ジャパンが提供する以下のリストから、お客様に最適な一本を情熱的に提案してください。
         
         【現在のワインリスト】
         ${context}
         
         【ルール】
         - 日本語で回答してください。
         - 200文字以内にまとめる。
         - 高級感のある丁寧な敬語を使用。
         - 「Premium」（至宝）を最優先で推奨してください。`;

    const res: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ]
    });

    return NextResponse.json({ response: res.response });
  } catch (e: any) {
    const errorMsg = "申し訳ございません。ソムリエが席を外しております。 / I am sorry, the sommelier is currently unavailable.";
    return NextResponse.json({ response: errorMsg }, { status: 500 });
  }
}
