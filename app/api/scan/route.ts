export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    // Cloudflareの環境変数から取得
    const API_KEY = process.env.GEMINI_API_KEY; 
    
    // 正式版(v1)で最も安定しているモデル名
    const MODEL_NAME = "gemini-1.5-flash"; 

    if (!API_KEY) {
      return NextResponse.json({ error: "APIキーが設定されていません。Cloudflareの環境変数を確認してください。" }, { status: 500 });
    }

    const imageRes = await fetch(image);
    const imageData = await imageRes.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageData).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // 【重要】URLを v1beta から v1 に変更しました
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "ワインソムリエとしてラベルを分析し、以下の項目を日本語のJSONで返してください。余計な説明は不要です。項目: name_jp, name_en, country, region, grape, type, vintage, price, cost, advice" },
              { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
          }],
          generationConfig: { 
            response_mime_type: "application/json",
            temperature: 0.1 // 回答を安定させる
          }
        })
      }
    );

    const data = await response.json();

    // エラーハンドリング
    if (data.error) {
      return NextResponse.json({ error: `Gemini API Error (${data.error.code}): ${data.error.message}` }, { status: 500 });
    }

    if (!data.candidates || data.candidates.length === 0) {
      return NextResponse.json({ error: "AIがラベルを読み取れませんでした。別の角度から撮影してください。" }, { status: 500 });
    }

    const resultText = data.candidates[0].content.parts[0].text;
    return NextResponse.json({ result: resultText });

  } catch (e: any) {
    return NextResponse.json({ error: `システムエラー: ${e.message}` }, { status: 500 });
  }
}
