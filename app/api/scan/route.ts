export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) return NextResponse.json({ error: "APIキー未設定" }, { status: 500 });

    const imageRes = await fetch(image);
    const imageData = await imageRes.arrayBuffer();
    const base64Image = Buffer.from(imageData).toString('base64');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "ワインラベルを分析し、以下の純粋なJSON形式で返してください: {name_jp, name_en, country, region, grape, type, vintage, price, advice}" },
            { inline_data: { mime_type: "image/jpeg", data: base64Image } }
          ]
        }]
      })
    });

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '');
    return NextResponse.json({ result: resultText });
  } catch (e) {
    return NextResponse.json({ error: "解析失敗" }, { status: 500 });
  }
}
