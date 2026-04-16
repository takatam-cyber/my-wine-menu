export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    // コードに直接書かず、Cloudflareの「金庫」から呼び出す
    const API_KEY = process.env.GEMINI_API_KEY; 
    const MODEL_NAME = "gemini-3-flash"; 

    if (!API_KEY) {
      return NextResponse.json({ error: "APIキーが設定されていません" }, { status: 500 });
    }

    const imageRes = await fetch(image);
    const imageData = await imageRes.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageData).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const promptText = `あなたは世界最高峰のソムリエです。このワインラベルを分析し、指定された形式のJSONでのみ回答してください。
      項目: name_jp, name_en, country, region, grape, type, vintage, price, cost, advice`;

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
    const resultText = data.candidates[0].content.parts[0].text;
    return NextResponse.json({ result: resultText });
  } catch (e) {
    return NextResponse.json({ error: "Analysis Failed" }, { status: 500 });
  }
}
