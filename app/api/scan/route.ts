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

    const aiResponse: any = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      prompt: `Analyze this wine label and return a JSON object in Japanese.
      Required JSON structure:
      {
        "name_jp": "カタカナ名",
        "name_en": "Alphabet Name",
        "country": "国",
        "region": "産地",
        "grape": "品種",
        "color": "赤/白/ロゼ/泡",
        "type": "フルボディ/辛口など",
        "vintage": "年",
        "price": 5000,
        "advice": "ソムリエ風の解説",
        "aroma": "香りの特徴",
        "pairing": "合う料理",
        "sweetness": 1-5,
        "body": 1-5,
        "acidity": 1-5,
        "tannin": 1-5
      }
      Return ONLY the raw JSON object.`,
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
