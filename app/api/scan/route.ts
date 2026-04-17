export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const API_KEY = process.env.GEMINI_API_KEY; 

    // v1beta エンドポイントを使用し、モデル名は以下を指定します
    const MODEL_NAME = "gemini-1.5-flash"; 

    if (!API_KEY) {
      return NextResponse.json({ error: "APIキーが設定されていません。CloudflareのSecretsを確認してください。" }, { status: 500 });
    }

    // 1. 画像を取得してバイナリデータにする
    const imageRes = await fetch(image);
    if (!imageRes.ok) {
      return NextResponse.json({ error: "画像の取得に失敗しました。" }, { status: 400 });
    }
    const imageData = await imageRes.arrayBuffer();
    
    // 2. Base64変換（Edge Runtimeで最も安全な手法）
    const base64Image = Buffer.from(imageData).toString('base64');

    // 3. プロンプト（JSONでの出力を厳命する）
    const promptText = "世界最高のソムリエとしてラベルを分析し、JSON形式で返してください。項目: name_jp, name_en, country, region, grape, type, vintage, price, cost, advice";

    // 4. APIリクエスト
    // JSONモード (response_mime_type) を使うため必ず v1beta を使用します
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
            temperature: 0.1 // 誤字を防ぐため低めに設定
          }
        })
      }
    );

    const data = await response.json();

    // 5. エラーハンドリング
    if (!response.ok || data.error) {
      console.error("Gemini API Error Detail:", data.error);
      const errorMessage = data.error?.message || "Gemini APIでエラーが発生しました";
      return NextResponse.json({ error: `Gemini API Error: ${errorMessage}` }, { status: response.status || 500 });
    }

    // 6. 結果の抽出と返却
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) {
      return NextResponse.json({ error: "解析結果が空でした。" }, { status: 500 });
    }

    // 文字列をJSONオブジェクトにパースしてフロントエンドに返す
    try {
      const parsedResult = JSON.parse(resultText);
      return NextResponse.json({ result: parsedResult });
    } catch (e) {
      // 万が一パースに失敗した場合のフォールバック
      return NextResponse.json({ result: resultText });
    }

  } catch (e: any) {
    console.error("Critical System Error:", e);
    return NextResponse.json({ error: `システムエラー: ${e.message}` }, { status: 500 });
  }
}
