export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const imageRes = await fetch(image);
    const arrayBuffer = await imageRes.arrayBuffer();

    // @ts-ignore
    const AI = process.env.AI;

    // STEP 1: OCR（文字抽出）
    const visionResponse = await AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
      prompt: "Transcribe everything on this wine label. Producer, Name, Region, Vintage.",
      image: [...new Uint8Array(arrayBuffer)]
    });
    const labelText = visionResponse.description || visionResponse;

    // STEP 2: 超精密ソムリエ解析 (Llama 3.3 70B)
    const expertResponse = await AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      temperature: 0.1,
      messages: [
        { 
          role: 'system', 
          content: 'あなたは世界最高峰のソムリエです。解析結果は必ず純粋なJSON形式のみで出力してください。挨拶や説明は一切不要です。' 
        },
        { 
          role: 'user', 
          content: `
          【ラベル情報】: "${labelText}"
          上記に基づき、プロの視点で特定し、以下のJSON形式を埋めてください。
          
          {
            "name_jp": "カタカナ名",
            "name_en": "Alphabet Name",
            "country": "国",
            "region": "産地",
            "grape": "品種",
            "vintage": "年",
            "price": "飲食店での予想税込販売価格（数値のみ）",
            "pairing": "最高のペアリング料理（2つ）",
            "advice": "お客様への選び方のアドバイス（1文）",
            "taste": "味わいの精密解説（2文）",
            "description": "歴史と背景（3文）"
          }`
        }
      ]
    });

    // Llama 3.3はresponseというキーで文字列を返します
    return NextResponse.json({ result: expertResponse.response });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
