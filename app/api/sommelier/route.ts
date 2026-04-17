// app/api/sommelier/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList, storeId } = await req.json();
    const env = getRequestContext().env;

    // AIに今の在庫状況と詳細な味わいを教え込む
    const wineContext = wineList.map((w: any) => 
      `- ${w.name_jp}(${w.color}/${w.type}): ${w.advice} [味わい：甘味${w.sweetness}, ボディ${w.body}, 酸味${w.acidity}, ${w.color==='赤'?'渋み':'香り'}:${w.color==='赤'?w.tannin:w.aroma}]。料理相性:${w.pairing}`
    ).join("\n");

    const systemPrompt = `あなたは一流ソムリエです。リストのワインから最適な一本を選び、エレガントな日本語で提案してください。リストにないワインは絶対に提案しないでください。\n\n現在のワインリスト:\n${wineContext}`;

    const llamaRes: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ]
    });

    return NextResponse.json({ response: llamaRes.response });
  } catch (e) {
    return NextResponse.json({ error: "Sommelier is busy" }, { status: 500 });
  }
}
