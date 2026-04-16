export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    // @ts-ignore
    const AI = process.env.AI;

    const response = await AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
      prompt: "Analyze this wine label. Return JSON in Japanese with keys: name, country, region, grape, vintage, taste (describe body, tannins, acidity, aromas), description (general background).",
      image: [...new Uint8Array(await (await fetch(image)).arrayBuffer())]
    });

    return NextResponse.json({ result: response });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
