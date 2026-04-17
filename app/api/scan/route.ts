// app/api/scan/route.ts (Llama 3.2 Vision 解析用・決定版)
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const env = getRequestContext().env;

    // 1. 画像データのバイナリ化
    let imageBuffer: ArrayBuffer;
    if (image.startsWith('http')) {
      const imgRes = await fetch(image);
      imageBuffer = await imgRes.arrayBuffer();
    } else {
      const base64String = image.replace(/^data:image\/\w+;base64,/, "");
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      imageBuffer = bytes.buffer;
    }

    // 2. Llama 3.2 Vision でワイン情報を解析
    const aiResponse: any = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      prompt: "Analyze this wine label and extract info. Return ONLY a valid JSON in Japanese: {name_jp, name_en, country, region, grape, type, vintage, price, advice}",
      image: [...new Uint8Array(imageBuffer)],
    });

    const resultText = aiResponse.description || aiResponse.response || JSON.stringify(aiResponse);
    
    // Markdownの装飾（```jsonなど）を除去してクリーンなJSONのみ抽出
    const cleanJson = resultText.replace(/```json|```/g, '').trim();

    return NextResponse.json({ result: cleanJson });
  } catch (e: any) {
    console.error("Llama Scan Error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
