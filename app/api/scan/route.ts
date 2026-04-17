// app/api/scan/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const env = getRequestContext().env;

    // 画像データのバイナリ化
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

    // Llama 3.2 Vision による解析（無料・無制限枠）
    const llamaRes: any = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      prompt: "Analyze this wine label and return ONLY a valid raw JSON object in Japanese. Fields: {name_jp, name_en, country, region, grape, color, type, vintage, price, cost, advice, aroma, pairing, sweetness, body, acidity, tannin}. Do not include markdown code blocks or conversational text.",
      image: [...new Uint8Array(imageBuffer)],
    });

    let resultText = llamaRes.response || llamaRes.description || JSON.stringify(llamaRes);

    // 解析失敗を防ぐためのJSON抽出ロジック
    const firstBrace = resultText.indexOf('{');
    const lastBrace = resultText.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) throw new Error("有効な解析データが得られませんでした。");
    
    const cleanJson = resultText.substring(firstBrace, lastBrace + 1);

    return NextResponse.json({ result: cleanJson });
  } catch (e: any) {
    console.error("Scan Error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
