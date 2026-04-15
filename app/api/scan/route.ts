export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();

    // TypeScriptのエラーを回避するために Array.from を使用します
    // @ts-ignore
    const response = await process.env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      image: Array.from(new Uint8Array(arrayBuffer)),
      prompt: "Identify this wine label. Return ONLY a JSON object with: {name_jp, name_en, vintage, variety, sub_region, category, description(short in Japanese)}. If category is Red, White or Sparkling, specify it.",
    });

    // AIの回答を解析（文字列で返ってきた場合を考慮）
    let result = response.response;
    if (typeof result === 'string') {
      try {
        result = JSON.parse(result.replace(/```json|```/g, '').trim());
      } catch (e) {
        // パース失敗時はそのまま返す
      }
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
