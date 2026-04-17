// app/api/sommelier/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    // AIに今の在庫状況をコンテキストとして教え込む
    const wineContext = wineList.map((w: any) => 
      `- ${w.name_jp} (${w.color}/${w.type}): ${w.advice}. 味わい[甘味${w.sweetness},ボディ${w.body}]. 相性:${w.pairing}`
    ).join("\n");

    const response: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: `あなたは高級レストランの一流ソムリエです。以下のワインリストから、お客様の要望（料理との相性や気分）に最適なものを提案してください。リストにないワインは提案しないでください。回答は短くエレガントに日本語で行ってください。\n\n現在のリスト:\n${wineContext}` },
        ...history,
        { role: 'user', content: message }
      ]
    });

    return NextResponse.json({ response: response.response });
  } catch (e) {
    return NextResponse.json({ error: "Sommelier is busy" }, { status: 500 });
  }
}
