export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    let imageBuffer: ArrayBuffer;
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File || formData.get('image') as File;
      if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
      imageBuffer = await file.arrayBuffer();
    } else {
      const { image } = await req.json();
      const base64Data = image.split(',')[1];
      imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)).buffer;
    }

    // @ts-ignore
    const AI = process.env.AI;
    
    // サイン不要で「目」を持っているモデルに変更
    const response = await AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
      prompt: "This is a wine label. Extract: name, country, region, grape, vintage. Return as JSON.",
      image: [...new Uint8Array(imageBuffer)]
    });

    return NextResponse.json({ result: response });
  } catch (e) {
    console.error("Scan Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
