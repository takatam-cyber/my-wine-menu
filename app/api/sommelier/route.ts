export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    // ユーザーの質問に関連するワインを15件以内に絞り込む（トークン節約）
    const keywords = ["赤", "白", "泡", "ロゼ", "肉", "魚", "パスタ", "チーズ", "重", "軽", "辛"];
    const relevantKeywords = keywords.filter(k => message.includes(k));

    let filteredList = wineList;
    if (relevantKeywords.length > 0) {
      filteredList = wineList.filter((w: any) => 
        relevantKeywords.some(k => 
          (w.name_jp + w.ai_explanation + w.pairing + w.color).includes(k)
        )
      ).slice(0, 15);
    } else {
      filteredList = wineList.slice(0, 15);
    }

    const wineContext = filteredList.map((w: any) => 
      `- ID:${w.id} | ${w.name_jp} | ¥${w.price_bottle} | 解説:${w.ai_explanation} | 料理:${w.pairing}`
    ).join("\n");

    const systemPrompt = `あなたは銀座の高級レストランの超一流ソムリエです。
お客様の要望を汲み取り、優雅な日本語でエスコートしてください。
提案するワインのIDを、必ず回答の最後に 【ID:番号】 形式で添えてください。これがないとカードが表示されません。

提供可能リスト:
${wineContext}`;

    const llamaRes: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ],
      max_tokens: 800
    });

    return NextResponse.json({ response: llamaRes.response });
  } catch (e) {
    return NextResponse.json({ error: "Sommelier error" }, { status: 500 });
  }
}
