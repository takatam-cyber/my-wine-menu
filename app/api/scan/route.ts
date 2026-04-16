export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "No image" }, { status: 400 });

    const base64Data = image.split(',')[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // @ts-ignore
    const AI = process.env.AI;
    if (!AI) throw new Error("AI binding is missing");

    // 写真を見てワインの情報をJSONで返してもらう指示
    const response = await AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      prompt: "Analyze this wine label and return the information in JSON format with keys: name, country, region, grape, vintage, category.",
      image: [...binaryData]
    });

    // AIの回答を整理して返す
    return NextResponse.json({ result: response });
  } catch (e) {
    console.error("Sommelier AI Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
