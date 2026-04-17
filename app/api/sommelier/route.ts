// app/api/sommelier/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList, storeId } = await req.json();
    const env = getRequestContext().env;

    const configData = await env.WINE_KV.get(`config:${storeId}`);
    const config = configData ? JSON.parse(configData) : {};
    const CUSTOM_KEY = config.gemini_key;

    const wineContext = wineList.map((w: any) => 
      `- ${w.name_jp}(${w.color}): ${w.advice} [甘味${w.sweetness},ボディ${w.body},${w.color==='赤'?'渋み':'香り'}:${w.color==='赤'?w.tannin:w.aroma}]。料理相性:${w.pairing}`
    ).join("\n");

    let responseText = "";
    const systemPrompt = `あなたは一流ソムリエです。リストのワインから最適な一本を選び、日本語で提案してください。リストにないワインは提案しないでください。\n\nリスト:\n${wineContext}`;

    if (CUSTOM_KEY) {
      // Geminiでの高品質回答
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${CUSTOM_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            ...history.map((h: any) => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] })),
            { role: 'user', parts: [{ text: message }] }
          ]
        })
      });
      const data = await geminiRes.json();
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "申し訳ありません。現在ソムリエが席を外しております。";
    } else {
      // 無料版Llamaでの回答
      const llamaRes: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: message }]
      });
      responseText = llamaRes.response;
    }

    return NextResponse.json({ response: responseText });
  } catch (e) { return NextResponse.json({ error: "Sommelier is busy" }, { status: 500 }); }
}
