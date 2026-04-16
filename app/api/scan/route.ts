export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const API_KEY = process.env.GEMINI_API_KEY; 

    // 安定版の 1.5 Flash を指定
    const MODEL_NAME = "gemini-1.5-flash"; 

    if (!API_KEY) {
      return NextResponse.json({ error: "APIキーが設定されていません" }, { status: 500 });
    }

    // 画像データの取得
    const imageRes = await fetch(image);
    const imageData = await imageRes.arrayBuffer();
    
    // Edge Runtime で効率的に Base64 変換を行う手法
    const base64Image = Buffer.from(imageData).toString('base64');

    const promptText = "世界最高のソムリエとしてラベルを分析し、JSONで返してください。項目: name_jp, name_en, country, region, grape, type, vintage, price, cost, advice";

    // エンドポイントを v1beta から v1 へ変更（安定版を利用）
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
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
            temperature: 0.4
          }
        })
      }
    );

    const data = await response.json();

    // エラーハンドリングの強化
    if (!response.ok || data.error) {
      console.error("Gemini API Error Detail:", data.error);
      const errorMessage = data.error?.message || "不明なAPIエラーが発生しました";
      
      if (data.error?.code === 429) {
        return NextResponse.json({ error: "AIが少し混み合っています。1分ほど待ってからもう一度お試しください。" }, { status: 429 });
      }
      return NextResponse.json({ error: `Gemini API Error: ${errorMessage}` }, { status: 500 });
    }

    // 候補が存在するかチェック
    if (!data.candidates || data.candidates.length === 0) {
      return NextResponse.json({ error: "AIからの回答が得られませんでした。別の画像を試してください。" }, { status: 500 });
    }

    const resultText = data.candidates[0].content.parts[0].text;
    return NextResponse.json({ result: resultText });

  } catch (e: any) {
    console.error("System Error:", e);
    return NextResponse.json({ error: `システムエラー: ${e.message}` }, { status: 500 });
  }
}
