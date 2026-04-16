export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    // Cloudflareの環境変数、または直接記述
    const API_KEY = "AIzaSyDGgqblldNSZ5KlA2bmHYNSO4ulUzBkkg0"; 
    const MODEL_NAME = "gemini-3-flash"; 

    const imageRes = await fetch(image);
    const imageData = await imageRes.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageData).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // スプレッドシートの項目（画像から抽出した構成）に基づいた指示
    const promptText = `
      あなたは世界最高峰のソムリエです。このワインラベルを分析し、指定された形式のJSONでのみ回答してください。
      
      【抽出項目とルール】
      1. name_jp: ワインのカタカナ正式名称
      2. name_en: ワインのアルファベット表記
      3. country: 生産国
      4. region: 産地（詳細な地区まで）
      5. grape: 使用品種（複数の場合はカンマ区切り。例: メルロ、シラー）
      6. type: タイプ（例: 赤 / フルボディ、白 / 辛口 など）
      7. vintage: ヴィンテージ（西暦4桁）
      8. price: 日本のレストランでの標準的な販売価格の数値予想
      9. cost: 一般的な卸値（仕入れ値）の数値予想
      10. advice: 「オススメ解説」欄に入れる、お客様の心を掴むプロのテイスティングノートとペアリング提案（2〜3文）

      返信は必ず純粋なJSONオブジェクトのみにしてください。説明文は不要です。
    `;

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
