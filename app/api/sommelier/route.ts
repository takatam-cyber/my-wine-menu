// app/api/sommelier/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    // 有効なワインのみをコンテキストに含める（トークン節約と精度向上）
    const wineContext = wineList
      .filter((w: any) => w.name_jp && w.name_jp.trim() !== "")
      .map((w: any) => 
        `ID:${w.id}|名称:${w.name_jp}|価格:¥${w.price_bottle}|特徴:${w.menu_short}|解説:${w.ai_explanation}|相性:${w.pairing}`
      ).join("\n");

    const systemPrompt = `あなたは伝説のソムリエです。
【重要ルール】
1. 回答は300文字程度で簡潔に、かつ優雅に行ってください（長すぎると途切れます）。
2. おすすめするワインのIDを、必ず回答の最後に 【ID:番号】 形式で書いてください。
3. 予算と好みを尊重し、お客様を否定せず、最高の一本を導いてください。

提供リスト:
${wineContext}`;

    const llamaRes: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ],
      max_tokens: 600 // 十分な長さを確保しつつ途切れを防止
    });

    return NextResponse.json({ response: llamaRes.response });
  } catch (e) {
    return NextResponse.json({ error: "Sommelier error" }, { status: 500 });
  }
}
