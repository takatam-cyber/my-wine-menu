// app/api/scan/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const storeId = req.headers.get('x-store-id');
    const env = getRequestContext().env;
    
    // 1. KVから店舗設定を取得
    const configData = await env.WINE_KV.get(`config:${storeId}`);
    const config = configData ? JSON.parse(configData) : {};
    const CUSTOM_KEY = config.gemini_key;

    // 2. 画像のバイナリ化
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

    let resultText = "";

    if (CUSTOM_KEY) {
      // --- パターンA: 店舗独自のGeminiキーを使用 (最高精度) ---
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${CUSTOM_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "ワインラベルを分析し日本語のJSONで返してください。白/泡なら渋み(tannin)を0にしフルーティ(aroma)を高くしてください。{name_jp, name_en, country, region, grape, color, type, vintage, price, advice, aroma, pairing, sweetness, body, acidity, tannin}" },
              { inline_data: { mime_type: "image/jpeg", data: btoa(String.fromCharCode(...new Uint8Array(imageBuffer))) } }
            ]
          }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await geminiRes.json();
      resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      // --- パターンB: キーがないのでLlama 3.2 Visionを使用 (完全無料) ---
      const llamaRes: any = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
        prompt: "Analyze this wine label. Output ONLY a raw JSON in Japanese: {name_jp, name_en, country, region, grape, color, type, vintage, price, advice, aroma, pairing, sweetness, body, acidity, tannin}",
        image: [...new Uint8Array(imageBuffer)],
      });
      resultText = llamaRes.response || llamaRes.description || JSON.stringify(llamaRes);
    }

    // JSON部分のみを抽出（Llamaのお喋り対策）
    const firstBrace = resultText.indexOf('{');
    const lastBrace = resultText.lastIndexOf('}');
    const cleanJson = resultText.substring(firstBrace, lastBrace + 1);

    return NextResponse.json({ result: cleanJson });
  } catch (e: any) {
    return NextResponse.json({ error: "解析失敗: " + e.message }, { status: 500 });
  }
}
