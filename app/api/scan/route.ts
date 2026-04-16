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

    // AIへの究極の指示：name_en以外は徹底して日本語化
    const prompt = `You are a professional translator and sommelier. Analyze this wine label and output ONLY a JSON object.
    
    Data Requirements:
    - name_en: Keep as is in English Alphabet (exact transcription from the label).
    - name_jp: Transliterate the wine name into Japanese Katakana (e.g., "Baron de Rothschild" -> "バロン・ド・ロートシルト").
    - country: Country name in Japanese (e.g., "France" -> "フランス").
    - region: Production region in Japanese (e.g., "Bordeaux" -> "ボルドー").
    - grape: Main varieties in Japanese (e.g., "Cabernet Sauvignon" -> "カベルネ・ソーヴィニヨン").
    - vintage: The year (number only).
    - taste: A professional sensory profile in Japanese (2 sentences).
    - description: Interesting facts or history of this wine in Japanese (3 sentences).

    Constraint: All fields except 'name_en' MUST be in Japanese. Return raw JSON only.`;

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
