export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const base64Data = image.split(',')[1];
    const byteString = atob(base64Data);
    const uint8Array = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) uint8Array[i] = byteString.charCodeAt(i);

    // @ts-ignore
    const response = await process.env.AI.run('@cf/microsoft/resnet-50', {
      image: [...uint8Array]
    });

    return NextResponse.json({ result: response });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
