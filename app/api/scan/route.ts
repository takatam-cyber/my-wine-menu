export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    // Cloudflareのコンテキストから環境変数を取得
    const env = getRequestContext().env;
    const API_KEY = env.GEMINI_API_KEY;

    if (!API_KEY) {
      return NextResponse.json({ 
        error: "APIキーが設定されていません。" 
      }, { status: 500 });
    }

    // 画像データの準備
    let base64Data = "";
    if (image.startsWith('http')) {
      const imgRes = await fetch(image);
      const buffer = await imgRes.arrayBuffer();
      base64Data = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    } else {
      base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    }

    // Gemini API 呼び出し
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "ワインラベルを分析し、以下の日本語のJSON形式のみを返してください。項目: {name_jp, name_en, country, region, grape, type, vintage, price, advice}" },
            { inline_data: { mime_type: "image/jpeg", data: base64Data } }
          ]
        }],
        generationConfig: {
          // ここを修正：response_mime_type -> responseMimeType
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Gemini API Error");
    }

    const resultText = data.candidates[0].content.parts[0].text;
    
    return NextResponse.json({ result: resultText });
  } catch (e: any) {
    console.error("AI Scan Error:", e.message);
    return NextResponse.json({ error: "AI解析失敗: " + e.message }, { status: 500 });
  }
}
