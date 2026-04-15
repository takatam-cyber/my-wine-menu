export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const blob = await file.arrayBuffer();

    // Cloudflare Workers AI を呼び出し（Llama 3.2 Vision モデルを使用）
    // @ts-ignore
    const response = await process.env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      image: [...new Uint8Array(blob)],
      prompt: "Identify this wine label. Return ONLY a JSON object with: {name_jp, name_en, vintage, variety, sub_region, category, description(short in Japanese)}. If category is Red, White or Sparkling, specify it.",
    });

    // AIの回答からJSON部分を抽出して返す
    return NextResponse.json(response);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
