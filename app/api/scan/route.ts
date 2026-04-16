export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "No image URL" }, { status: 400 });

    const imageRes = await fetch(image);
    const arrayBuffer = await imageRes.arrayBuffer();

    // @ts-ignore
    const AI = process.env.AI;

    /**
     * プロフェッショナル・ソムリエ・プロンプト
     * AIに対して、各項目の役割と言語、フォーマットを厳密に指定します。
     */
    const prompt = `You are a professional sommelier. Analyze the wine label image provided and extract information into the following JSON format.
    
    Rules:
    1. name_jp: Wine name in Japanese Katakana.
    2. name_en: Full wine name in English Alphabet (exactly as written on the label).
    3. country: Country of origin in Japanese (e.g., フランス, イタリア).
    4. region: Production region in Japanese (e.g., ボルドー, トスカーナ).
    5. grape: Main grape varieties in Japanese.
    6. vintage: The year printed on the label (number only).
    7. taste: A 2-sentence professional description of the wine's profile in Japanese.
    8. description: A 3-sentence interesting fact or history about this wine in Japanese.

    Constraint: Return ONLY the raw JSON object. Do not include any introductory text or markdown code blocks.`;

    const response = await AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
      prompt: prompt,
      image: [...new Uint8Array(arrayBuffer)]
    });

    // AIの返答をログに記録（デバッグ用）
    console.log("AI_EXTRACTED_DATA:", response.description || response);

    return NextResponse.json({ result: response.description || response });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
