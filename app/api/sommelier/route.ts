// app/api/sommelier/route.ts (堅牢化・完全版)
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    // 1. キーワードによる動的絞り込み (RAG-lite)
    const keywords = ["赤", "白", "泡", "ロゼ", "肉", "魚", "パスタ", "チーズ", "重", "軽", "辛", "甘"];
    const relevantKeywords = keywords.filter(k => message.includes(k));

    let filteredList = wineList;
    if (relevantKeywords.length > 0) {
      filteredList = wineList.filter((w: any) => 
        relevantKeywords.some(k => 
          // null安全な結合とチェック
          `${w.name_jp || ''} ${w.ai_explanation || ''} ${w.pairing || ''} ${w.color || ''}`.includes(k)
        )
      ).slice(0, 15); // トークン節約のため最大15件
    } else {
      filteredList = wineList.slice(0, 15); // デフォルト
    }

    // 2. コンテキストの構築
    const wineContext = filteredList.map((w: any) => 
      `- ID:${w.id} | ${w.name_jp} | ¥${w.price_bottle || 'ASK'} | 解説:${w.ai_explanation || 'なし'} | 料理:${w.pairing || 'なし'}`
    ).join("\n");

    // 3. プロンプト生成
    const systemPrompt = `あなたは銀座の高級レストランの伝説的ソムリエです。
優雅で温かい日本語で接客してください。お客様の好みに寄り添い、情熱的にワインを語ってください。
提案するワインのIDを、必ず回答の最後に 【ID:番号】 形式で添えてください。

【ID表示の例】
「〜こちらの一本はいかがでしょうか。
【ID:123】」

現在の提供可能リスト:
${wineContext}`;

    // 4. AI実行 (Meta Llama 3.1)
    const llamaRes: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ],
      max_tokens: 800
    });

    return NextResponse.json({ response: llamaRes.response });
  } catch (e: any) {
    console.error("Sommelier Logic Error:", e);
    return NextResponse.json({ error: "Sommelier is currently unavailable" }, { status: 500 });
  }
}
