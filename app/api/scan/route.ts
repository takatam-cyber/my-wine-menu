export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "No image" }, { status: 400 });

    // Base64デコード（標準的なWeb APIを使用）
    const base64Data = image.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // @ts-ignore
    const AI = process.env.AI;
    if (!AI) throw new Error("AI binding is missing");

    /**
     * 最新の強力なVisionモデル（Llama 3.2 11B）を使用します。
     * 写真を見て、ワインのラベル情報を解析するよう指示しています。
     */
    const response = await AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      prompt: "Analyze this wine label. Tell me the wine name, country, region, grape variety, and vintage. Return the result in a clear format.",
      image: [...bytes]
    });

    return NextResponse.json({ result: response });
  } catch (e) {
    console.error("Scan Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
