export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "No image URL" }, { status: 400 });

    // URL（R2）から画像を取得
    const imageRes = await fetch(image);
    const arrayBuffer = await imageRes.arrayBuffer();

    // @ts-ignore
    const AI = process.env.AI;
    if (!AI) throw new Error("AI binding missing");

    // 日本語で出力するよう厳密に指示
    const response = await AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
      prompt: `Analyze this wine label. 
      Return ONLY a JSON object with these keys:
      - name_jp: ワイン名（カタカナ）
      - name_en: Wine name (Alphabet)
      - country: 国名（日本語）
      - region: 産地（日本語）
      - grape: 品種（日本語）
      - vintage: 西暦
      - taste: 味わいの特徴（日本語で2〜3行）
      - description: ワインの紹介文（日本語で3〜4行）
      
      IMPORTANT: All fields except 'name_en' MUST be in Japanese.`,
      image: [...new Uint8Array(arrayBuffer)]
    });

    return NextResponse.json({ result: response });
  } catch (e) {
    console.error("Scan Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
