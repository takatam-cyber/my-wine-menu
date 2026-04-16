export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    // @ts-ignore
    const AI = process.env.AI;

    // 命令を「余計な言葉を一切省け」という指示に強化
    const visionResponse = await AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
      prompt: "Extract the wine producer and the vintage year. Output ONLY the names, no labels like 'Producer Name:' or 'Vintage:'. Example: Mouton Cadet, 2018",
      image: [...new Uint8Array(await (await fetch(image)).arrayBuffer())]
    });

    const result = visionResponse.description || visionResponse;
    return NextResponse.json({ result: result.replace(/Producer Name:|Vintage:/gi, '').trim() });
  } catch (e) {
    return NextResponse.json({ error: "OCR Failed" }, { status: 500 });
  }
}
