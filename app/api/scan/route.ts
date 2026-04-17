// app/api/scan/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const env = getRequestContext().env;
    const API_KEY = env.GEMINI_API_KEY;

    if (!API_KEY) return NextResponse.json({ error: "APIキーが設定されていません。" }, { status: 500 });

    let base64Data = image.startsWith('http') 
      ? btoa(String.fromCharCode(...new Uint8Array(await (await fetch(image)).arrayBuffer())))
      : image.replace(/^data:image\/\w+;base64,/, "");

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "ワインラベルを分析し、以下の項目を日本語のJSON形式で返してください。{name_jp, name_en, country, region, grape, type, vintage, price, advice}" },
            { inline_data: { mime_type: "image/jpeg", data: base64Data } }
          ]
        }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await response.json();

    // 安全策：データが存在するかチェック
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      // 安全フィルターなどで解析できなかった場合
      throw new Error("AIが画像を読み取れませんでした。別の角度で試してください。");
    }
    
    return NextResponse.json({ result: resultText });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
