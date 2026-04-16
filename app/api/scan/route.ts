export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const API_KEY = process.env.GEMINI_API_KEY; 

    // 最も安定している 1.5 Flash モデルに変更
    const MODEL_NAME = "gemini-1.5-flash"; 

    if (!API_KEY) {
      return NextResponse.json({ error: "APIキーが設定されていません" }, { status: 500 });
    }

    const imageRes = await fetch(image);
    const imageData = await imageRes.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageData).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const promptText = "世界最高のソムリエとしてラベルを分析し、JSONで返してください。項目: name_jp, name_en, country, region, grape, type, vintage, price, cost, advice";

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
          generationConfig: { 
            response_mime_type: "application/json",
            temperature: 0.4 // 精度を上げるために少し低めに設定
          }
        })
      }
    );

    const data = await response.json();

    // クォータエラーなどの詳細なエラーハンドリング
    if (data.error) {
      if (data.error.code === 429) {
        return NextResponse.json({ error: "AIが少し混み合っています。1分ほど待ってからもう一度お試しください。" }, { status: 429 });
      }
      return NextResponse.json({ error: `Gemini API Error: ${data.error.message}` }, { status: 500 });
    }

    const resultText = data.candidates[0].content.parts[0].text;
    return NextResponse.json({ result: resultText });

  } catch (e: any) {
    return NextResponse.json({ error: `システムエラー: ${e.message}` }, { status: 500 });
  }
}
