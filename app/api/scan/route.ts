// app/api/scan/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json(); // base64データ、またはURLを受け取る
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return NextResponse.json({ error: "Cloudflareの環境変数にGEMINI_API_KEYが設定されていません" }, { status: 500 });
    }

    // 画像がURL形式の場合、データを取得する
    let base64Data = "";
    if (image.startsWith('http')) {
      const imgRes = await fetch(image);
      const buffer = await imgRes.arrayBuffer();
      // Edge RuntimeでのBase64変換
      base64Data = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    } else {
      // すでにbase64（data:image/...）の場合はヘッダーを除去
      base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "ワインラベルを分析し、以下の項目を日本語のJSON形式で返してください。余計な解説は不要です。項目: {name_jp, name_en, country, region, grape, type, vintage, price, advice}" },
            { inline_data: { mime_type: "image/jpeg", data: base64Data } }
          ]
        }],
        generationConfig: {
          response_mime_type: "application/json", // JSONモードを明示的に指定
        }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));

    const resultText = data.candidates[0].content.parts[0].text;
    return NextResponse.json({ result: resultText });
  } catch (e: any) {
    console.error("AI Scan Error:", e.message);
    return NextResponse.json({ error: "AI解析に失敗しました: " + e.message }, { status: 500 });
  }
}
