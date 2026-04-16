export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "No image" }, { status: 400 });

    const base64Data = image.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // @ts-ignore
    const AI = process.env.AI;
    if (!AI) throw new Error("AI binding is missing");

    const response = await AI.run('@cf/microsoft/resnet-50', {
      image: [...bytes]
    });

    return NextResponse.json({ result: response });
  } catch (e) {
    console.error("Scan Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
