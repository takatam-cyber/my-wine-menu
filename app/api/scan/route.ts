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
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      imageBuffer = bytes.buffer;
    }

    // AIへの指示を詳細化
    const aiResponse: any = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      prompt: `Analyze this wine label and return a JSON object in Japanese.
      Fields: {
        name_jp, name_en, country, region, grape, color (e.g. 赤, 白, ロゼ), 
        type (e.g. フルボディ, 辛口), vintage, price (estimate if not on label), 
        advice (sommelier style), aroma (tags), pairing (matching dishes),
        sweetness (1-5), body (1-5), acidity (1-5), tannin (1-5)
      }
      Return ONLY raw JSON.`,
      image: [...new Uint8Array(imageBuffer)],
    });

    let resultText = aiResponse.response || aiResponse.description || JSON.stringify(aiResponse);
    const firstBrace = resultText.indexOf('{');
    const lastBrace = resultText.lastIndexOf('}');
    const cleanJson = resultText.substring(firstBrace, lastBrace + 1);

    return NextResponse.json({ result: cleanJson });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
