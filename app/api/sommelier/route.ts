export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    // キーワードによる簡易フィルタリング（RAGの初期段階）
    // ユーザーの質問に関連しそうなワイン（色や料理名）だけでコンテキストを構成する
    const keywords = ["赤", "白", "泡", "ロゼ", "肉", "魚", "パスタ", "チーズ"];
    const relevantKeywords = keywords.filter(k => message.includes(k));

    let filteredList = wineList;
    if (relevantKeywords.length > 0) {
      filteredList = wineList.filter((w: any) => 
        relevantKeywords.some(k => w.name_jp.includes(k) || w.ai_explanation.includes(k) || w.pairing.includes(k))
      ).slice(0, 15); // 最大15件に絞ってトークンを節約
    } else {
      filteredList = wineList.slice(0, 15);
    }

    const wineContext = filteredList.map((w: any) => 
      `- ID:${w.id} | ${w.name_jp} | ¥${w.price_bottle} | 解説:${w.ai_explanation} | 料理:${w.pairing}`
    ).join("\n");

    const systemPrompt = `あなたは銀座の高級レストランの一流ソムリエです。
優雅な日本語で接客してください。提案するワインのIDを、必ず回答の最後に 【ID:番号】 形式で添えてください。

提供リスト（現在のおすすめ）:
${wineContext}`;

    const llamaRes: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ],
      max_tokens: 600
    });

    return NextResponse.json({ response: llamaRes.response });
  } catch (e) {
    return NextResponse.json({ error: "Sommelier error" }, { status: 500 });
  }
}
