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

    // 命令：アンダースコアにバックスラッシュを入れないよう強調
    const prompt = `Task: Extract wine label info as PURE JSON.
    Output fields (In Japanese):
    - name_jp: Katakana Name
    - name_en: English Name
    - country: Country
    - region: Region
    - grape: Grape variety
    - vintage: Year
    - taste: Flavor summary
    - description: Background
    
    Constraint: Strictly JSON only. No markdown. Use standard underscores for keys.`;

    const response = await AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
      prompt: prompt,
      image: [...new Uint8Array(arrayBuffer)]
    });

    const resultText = response.description || response;
    console.log("AI_RAW:", resultText);

    return NextResponse.json({ result: resultText });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
