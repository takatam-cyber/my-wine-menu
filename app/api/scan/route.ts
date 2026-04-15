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
      prompt: "Analyze this wine label. Return ONLY a valid JSON: { \"name_jp\": \"ワイン名(日本語)\", \"name_en\": \"Wine Name(English)\", \"vintage\": 2020, \"variety\": \"品種\", \"sub_region\": \"産地\", \"category\": \"Red/White/Sparkling\", \"description\": \"日本語での短い説明\" }",
    });

    // AIの返答をきれいに掃除してJSONにする
    let result = response.response;
    if (typeof result === 'string') {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) result = JSON.parse(jsonMatch[0]);
    }

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: "AI Scan failed" }, { status: 500 });
  }
}
