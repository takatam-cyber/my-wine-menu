export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    // @ts-ignore
    const AI = process.env.AI;

    // Llavaに「文字の書き写し」だけを命じる（一番エラーが少ない方法）
    const visionResponse = await AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
      prompt: "Read the wine label and list only the Producer Name and Vintage Year clearly.",
      image: [...new Uint8Array(await (await fetch(image)).arrayBuffer())]
    });

    return NextResponse.json({ result: visionResponse.description || visionResponse });
  } catch (e) {
    return NextResponse.json({ error: "OCR Failed" }, { status: 500 });
  }
}
