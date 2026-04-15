export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    // 1. 現在の在庫リストを取得する
    // @ts-ignore
    const { results: wines } = await process.env.DB.prepare(
      "SELECT name_jp, category, variety, sub_region, description FROM wines WHERE stock > 0"
    ).all();

    // 2. AIへの指示書（プロンプト）を作成
    const wineListContext = wines.map((w: any) => 
      `- ${w.name_jp} (${w.category}): ${w.variety}産、${w.sub_region}。特徴: ${w.description}`
    ).join('\n');

    const systemPrompt = `
      あなたは一流ホテルの「AIソムリエ」です。
      以下の在庫リストにあるワインのみをお客様に提案してください。
      在庫にないワインは絶対に勧めないでください。
      
      【在庫リスト】
      ${wineListContext}

      【ルール】
      ・優雅で丁寧な日本語で接客してください。
      ・お客様の料理や好みに合わせて、具体的になぜそのワインが合うのか解説してください。
      ・300文字以内で回答してください。
    `;

    // 3. Cloudflare Workers AI を呼び出し
    // @ts-ignore
    const response = await process.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
    });

    return NextResponse.json({ answer: response.response });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
