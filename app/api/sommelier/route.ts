export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    // 自社商品を最優先にソート
    const sorted = [...wineList].sort((a, b) => b.is_priority - a.is_priority);
    
    // 味覚数値をコンテキストに含め、AIが論理的に語れるようにする
    const wineContext = sorted.slice(0, 30).map((w: any) => 
      `ID:${w.id} | ${w.name_jp} | ${w.is_priority ? '★激推し★' : ''} | ¥${w.price_bottle} | 味覚[甘:${w.sweetness},体:${w.body},酸:${w.acidity},渋:${w.tannins}] | 解説:${w.ai_explanation}`
    ).join("\n");

    const systemPrompt = `あなたは世界最高のソムリエです。味覚データの数値を根拠に、「ボディが4としっかりしているため、このお肉に合います」といったプロの提案を行ってください。特に★激推し★のワインを優先して販売してください。`;

    const res: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: message }]
    });

    return NextResponse.json({ response: res.response });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
