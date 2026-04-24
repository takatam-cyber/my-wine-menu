// app/api/scan/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const env = getRequestContext().env;

    let imageBuffer: ArrayBuffer;
    if (image.startsWith('http')) {
      const imgRes = await fetch(image);
      imageBuffer = await imgRes.arrayBuffer();
    } else {
      const base64String = image.replace(/^data:image\/\w+;base64,/, "");
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      imageBuffer = bytes.buffer;
    }

    const aiResponse: any = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      prompt: `Analyze this wine label. 
      1. Extract the full English Name.
      2. Determine the wine color (Red, White, Rosé, or Sparkling).
      Return ONLY a raw JSON object: {"name_en": "...", "color": "赤/白/ロゼ/泡"}`,
      image: [...new Uint8Array(imageBuffer)],
    });

    let resultText = aiResponse.response || aiResponse.description || JSON.stringify(aiResponse);
    const firstBrace = resultText.indexOf('{');
    const lastBrace = resultText.lastIndexOf('}');
    const cleanJson = resultText.substring(firstBrace, lastBrace + 1);

    return NextResponse.json({ result: cleanJson });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, result: "{}" }, { status: 200 });
  }
}
