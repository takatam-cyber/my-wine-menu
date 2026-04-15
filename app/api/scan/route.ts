export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // @ts-ignore
    const response = await process.env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      image: Array.from(uint8Array),
      prompt: "You are a sommelier. Identify this wine label. Return ONLY a JSON object: { \"name_jp\": \"...\", \"name_en\": \"...\", \"vintage\": 2020, \"variety\": \"...\", \"sub_region\": \"...\", \"category\": \"Red/White/Sparkling\", \"description\": \"日本語の短い説明\" }",
    });

    let resultText = response.response;
    
    // 【重要】AIが余計な説明を書いてもJSONだけを抽出するロジック
    const jsonStart = resultText.indexOf('{');
    const jsonEnd = resultText.lastIndexOf('}') + 1;
    const jsonString = resultText.substring(jsonStart, jsonEnd);
    
    const result = JSON.parse(jsonString);

    return NextResponse.json(result);
  } catch (e) {
    console.error("Scan error:", e);
    return NextResponse.json({ error: "解析に失敗しました。もう一度お試しください。" }, { status: 500 });
  }
}
