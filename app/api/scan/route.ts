export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const API_KEY = process.env.GEMINI_API_KEY; 
    const MODEL_NAME = "gemini-3-flash"; 

    // 診断1: キーの有無を確認
    if (!API_KEY) {
      return NextResponse.json({ error: "API_KEY_NOT_FOUND: Cloudflareの設定でGEMINI_API_KEYが保存されていないか、再ビルドが必要です。" }, { status: 500 });
    }

    const imageRes = await fetch(image);
    const imageData = await imageRes.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageData).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const promptText = "ワインラベルを分析してJSONで返してください。項目: name_jp, name_en, country, region, grape, type, vintage, price, cost, advice";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: promptText },
              { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
          }],
          generationConfig: { response_mime_type: "application/json" }
        })
      }
    );

    const data = await response.json();

    // 診断2: Gemini API側のエラーを確認
    if (data.error) {
      return NextResponse.json({ error: `Gemini API Error: ${data.error.message}` }, { status: 500 });
    }

    const resultText = data.candidates[0].content.parts[0].text;
    return NextResponse.json({ result: resultText });

  } catch (e: any) {
    return NextResponse.json({ error: `Analysis Error: ${e.message}` }, { status: 500 });
  }
}
