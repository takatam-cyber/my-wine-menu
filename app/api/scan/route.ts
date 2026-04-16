export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const imageRes = await fetch(image);
    const arrayBuffer = await imageRes.arrayBuffer();

    // @ts-ignore
    const AI = process.env.AI;

    // STEP 1: Llavaで文字を抽出
    const visionResponse = await AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
      prompt: "Extract producer, wine name, and vintage from this label.",
      image: [...new Uint8Array(arrayBuffer)]
    });
    const labelText = visionResponse.description || visionResponse;

    // STEP 2: Llama 3.3 70B でソムリエ分析
    const expertResponse = await AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      temperature: 0.1,
      messages: [
        { 
          role: 'system', 
          content: 'You are a Master Sommelier. Respond ONLY with a valid JSON object. No preamble, no talk, no markdown. If you fail, the system crashes.' 
        },
        { 
          role: 'user', 
          content: `
          Label: "${labelText}"
          Return this JSON only:
          {
            "name_jp": "カタカナ名",
            "name_en": "English Name",
            "country": "国",
            "region": "産地",
            "grape": "品種",
            "vintage": "年",
            "price": "販売価格数値",
            "pairing": "ペアリング料理",
            "advice": "ソムリエのアドバイス",
            "taste": "味わいの解説",
            "description": "歴史的背景"
          }`
        }
      ]
    });

    return NextResponse.json({ result: expertResponse.response });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
