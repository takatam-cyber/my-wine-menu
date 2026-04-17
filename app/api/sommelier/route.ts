// app/api/sommelier/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    const wineContext = wineList.map((w: any) => 
      `- ${w.name_jp}: ${w.advice} [甘味:${w.sweetness}, ボディ:${w.body}, 酸味:${w.acidity}, ${w.color==='赤'?'渋み':'香り'}:${w.color==='赤'?w.tannin:w.aroma}]`
    ).join("\n");

    const response: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: `あなたはレストランの一流ソムリエです。お客様の好みに合わせ、以下のリストから最適なワインを一つ選び、その魅力を日本語でエレガントに説明してください。\n\nリスト:\n${wineContext}` },
        ...history, { role: 'user', content: message }
      ]
    });

    return NextResponse.json({ response: response.response });
  } catch (e) { return NextResponse.json({ error: "Sommelier is busy" }, { status: 500 }); }
}
