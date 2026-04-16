export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const imageRes = await fetch(image);
    const arrayBuffer = await imageRes.arrayBuffer();

    // @ts-ignore
    const AI = process.env.AI;

    // STEP 1: OCR（ラベルを読み取る）
    const visionResponse = await AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
      prompt: "Read all text on this wine label.",
      image: [...new Uint8Array(arrayBuffer)]
    });
    const labelText = visionResponse.description || visionResponse;

    // STEP 2: 超高性能解析（先ほど承認した最強Llamaを使用）
    const expertResponse = await AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: 'あなたは世界最高峰のソムリエです。ラベル情報からワインを特定し、日本語のJSONのみで回答してください。' },
        { role: 'user', content: `
          テキスト: "${labelText}"
          以下のJSONのみ出力せよ（全て日本語、name_enのみ英語）。
          {
            "name_jp": "カタカナ名",
            "name_en": "Alphabet Name",
            "country": "国",
            "region": "産地",
            "grape": "品種",
            "vintage": "年",
            "taste": "味わい解説(日本語2文)",
            "description": "歴史/背景(日本語3文)"
          }` 
        }
      ]
    });

    return NextResponse.json({ result: expertResponse.response });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
