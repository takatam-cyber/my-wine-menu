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

    // 【日本語強制プロンプト】
    // ステップバイステップで指示し、「翻訳」ではなく「日本語で作成」することを強調します。
    const prompt = `Task: Analyze wine label and generate a Japanese report.
    
    Instructions for JSON values:
    1. name_en: Copy the full name from the label in English (Alphabet).
    2. name_jp: Transliterate name_en into Japanese Katakana.
    3. country: Country name in Japanese (e.g., フランス, イタリア).
    4. region: Region name in Japanese (e.g., ボルドー, トスカーナ).
    5. grape: Varieties in Japanese (e.g., カベルネ・ソーヴィニヨン).
    6. vintage: The year number.
    7. taste: Describe flavors in JAPANESE ONLY. Example: "ベリーの香りと滑らかなタンニンが特徴のフルボディです。"
    8. description: Write history/facts in JAPANESE ONLY. Example: "シャトー・ラフィットを所有する家系が手掛ける高品質なワインです。"

    Constraint: For 'taste' and 'description', DO NOT use English. They MUST be 100% natural Japanese sentences.
    Output: Raw JSON only.`;

    const response = await AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
      prompt: prompt,
      image: [...new Uint8Array(arrayBuffer)]
    });

    const resultText = response.description || response;
    return NextResponse.json({ result: resultText });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
