export const runtime = 'edge';
import { NextResponse } from 'next/server';
// Cloudflareの環境変数にアクセスするためのツールを読み込む
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    // Cloudflare Pages専用の環境変数取得ルーチン
    const env = getRequestContext().env;
    const API_KEY = env.GEMINI_API_KEY; 
    const MODEL_NAME = "gemini-2.0-flash"; 

    // 診断：もしキーが見つからない場合
    if (!API_KEY) {
      return NextResponse.json({ 
        error: "API_KEY_NOT_FOUND: Cloudflareのダッシュボードで 'GEMINI_API_KEY' が正しく設定されているか確認し、設定後に必ず【再デプロイ】してください。" 
      }, { status: 500 });
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
    if (data.error) {
      return NextResponse.json({ error: `Gemini API Error: ${data.error.message}` }, { status: 500 });
    }

    const resultText = data.candidates[0].content.parts[0].text;
    return NextResponse.json({ result: resultText });

  } catch (e: any) {
    return NextResponse.json({ error: `Analysis Error: ${e.message}` }, { status: 500 });
  }
}
