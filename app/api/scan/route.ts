export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    // Cloudflareの環境変数に登録するか、直接ここに貼り付けてください
    const API_KEY = "AIzaSyDGgqblldNSZ5KlA2bmHYNSO4ulUzBkkg0"; 
    const MODEL_NAME = "gemini-3-flash"; // 2026年最新の高速思考モデル

    // 画像データの準備
    const imageRes = await fetch(image);
    const imageData = await imageRes.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageData).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // Gemini APIへのリクエスト (JSONモード)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "あなたは世界最高峰のソムリエです。このワインラベル画像を詳細に分析し、以下の項目を正確に抽出して日本語のJSON形式でのみ返してください。余計な説明（'Producer Name:'など）は一切不要です。\n\n項目:\nname_jp(カタカナ名),\nname_en(正式英語名),\ncountry(国),\nregion(産地),\ngrape(品種),\ntype(赤/白/泡/ロゼ/甘口),\nvintage(年),\nadvice(味わいと、このワインを最高に楽しむためのお客様へのオススメ提案)" },
              { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
          }],
          generationConfig: { response_mime_type: "application/json" }
        })
      }
    );

    const data = await response.json();
    if (!data.candidates) throw new Error("Gemini API Error");
    
    const resultText = data.candidates[0].content.parts[0].text;
    return NextResponse.json({ result: resultText });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gemini Analysis Failed" }, { status: 500 });
  }
}
