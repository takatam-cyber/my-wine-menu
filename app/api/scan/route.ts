export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // AIへの指示を「飲食店メニュー用」に強化
    // @ts-ignore
    const response = await process.env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      image: Array.from(uint8Array),
      prompt: "You are an expert sommelier. Identify this wine. Return ONLY a JSON object: { \"name_jp\": \"ワイン名\", \"name_en\": \"Name\", \"vintage\": 2020, \"country\": \"国名\", \"region\": \"産地詳細\", \"variety\": \"品種\", \"category\": \"Red/White/Rose/Sparkling\", \"description\": \"味わいの特徴を100文字以内の日本語で\" }",
    });

    let resultText = response.response;
    const jsonStart = resultText.indexOf('{');
    const jsonEnd = resultText.lastIndexOf('}') + 1;
    const result = JSON.parse(resultText.substring(jsonStart, jsonEnd));

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: "解析失敗" }, { status: 500 });
  }
}
