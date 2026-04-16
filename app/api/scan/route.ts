export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    // シンプルに環境変数から取得（これが一番エラーになりません）
    const API_KEY = process.env.GEMINI_API_KEY; 
    const MODEL_NAME = "gemini-1.5-flash"; 

    if (!API_KEY) {
      return NextResponse.json({ 
        error: "API_KEY_MISSING: Cloudflareの『環境変数』に GEMINI_API_KEY が設定されていないか、反映されていません。" 
      }, { status: 500 });
    }

    const imageRes = await fetch(image);
    const imageData = await imageRes.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageData).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // Gemini APIへのリクエスト
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "ワインラベルを分析してJSONで返してください。項目: name_jp, name_en, country, region, grape, type, vintage, price, cost, advice" },
              { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
          }],
          generationConfig: { response_mime_type: "application/json" }
        })
      }
    );

    const data = await response.json();
    if (data.error) {
      return NextResponse.json({ error: `Gemini API Error: ${data.error.message}` }, { status: 500 });
    }

    const resultText = data.candidates[0].content.parts[0].text;
    return NextResponse.json({ result: resultText });

  } catch (e: any) {
    return NextResponse.json({ error: `System Error: ${e.message}` }, { status: 500 });
  }
}
