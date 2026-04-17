// app/api/sommelier/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    const wineContext = wineList.map((w: any) => 
      `- ${w.name_jp}(${w.color}): ${w.advice} [味わい：甘味${w.sweetness}, ボディ${w.body}, 酸味${w.acidity}, ${w.color==='赤'?'渋み':'香り'}:${w.color==='赤'?w.tannin:w.aroma}]。料理相性：${w.pairing}`
    ).join("\n");

    const response: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: `あなたは一流ソムリエです。提供可能なワインリストをもとに、お客様の気分や料理に合わせて最適な一本を選び、エレガントな日本語で提案してください。リストにないワインは絶対に提案しないでください。\n\nリスト:\n${wineContext}` },
        ...history, { role: 'user', content: message }
      ]
    });

    return NextResponse.json({ response: response.response });
  } catch (e) { return NextResponse.json({ error: "Sommelier is busy" }, { status: 500 }); }
}
