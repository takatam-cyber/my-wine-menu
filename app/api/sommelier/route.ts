export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    // 1. D1データベースから「在庫があるワイン」だけを取得
    // @ts-ignore
    const { results: wines } = await process.env.DB.prepare(
      "SELECT name_jp, category, variety, sub_region, description FROM wines WHERE stock > 0"
    ).all();

    // 2. AIに渡すための在庫リストをテキスト化
    const wineListContext = wines.map((w: any) => 
      `- ${w.name_jp} (${w.category}): ${w.variety}種、${w.sub_region}産。特徴: ${w.description}`
    ).join('\n');

    // 3. AIへの「役割」と「知識（在庫）」の指示
    const systemPrompt = `
      あなたは高級レストランの「AIソムリエ」です。
      以下の【在庫リスト】にあるワインの中から、お客様の要望に最適なものを提案してください。
      リストにないワインは絶対に勧めないでください。
      
      【在庫リスト】
      ${wineListContext}

      【接客のルール】
      ・優雅で非常に丁寧な日本語（敬語）で回答してください。
      ・具体的になぜそのワインが合うのか、香りや味わいの特徴を交えて解説してください。
      ・回答は200〜300文字程度にまとめてください。
    `;

    // 4. Cloudflare Workers AI を実行
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
