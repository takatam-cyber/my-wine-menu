// app/api/sommelier/route.ts
export const runtime = 'edge'; // この行を必ず追加します
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    const wineContext = wineList.map((w: any) => 
      `- ${w.name_jp}(${w.color}/${w.type}): ${w.menu_short || w.advice}
        [詳細] 香り:${w.aroma_features}, 複雑性:${w.complexity}/5, 余韻:${w.aftertaste}/5, 飲み頃:${w.best_drinking}
        [解説] ${w.ai_explanation || w.advice}
        [相性] ${w.pairing}`
    ).join("\n");

    const systemPrompt = `あなたはレストランの一流ソムリエです。提供可能なワインリストをもとに、お客様の気分や料理に合わせて最適な一本を選び、エレガントな日本語で提案してください。リストにないワインは絶対に提案しないでください。\n\n現在のワインリスト:\n${wineContext}`;

    const llamaRes: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ]
    });

    return NextResponse.json({ response: llamaRes.response });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sommelier is busy" }, { status: 500 });
  }
}
