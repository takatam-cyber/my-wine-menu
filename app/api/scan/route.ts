export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    let imageBuffer: ArrayBuffer;

    // データの受け取り方を柔軟にします
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // 封筒（FormData）で届いた場合
      const formData = await req.formData();
      const file = formData.get('file') as File || formData.get('image') as File;
      if (!file) return NextResponse.json({ error: "No file in form" }, { status: 400 });
      imageBuffer = await file.arrayBuffer();
    } else {
      // JSONで届いた場合
      const { image } = await req.json();
      const base64Data = image.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      imageBuffer = bytes.buffer;
    }

    // @ts-ignore
    const AI = process.env.AI;
    if (!AI) throw new Error("AI binding is missing");

    // 写真を見て情報を抽出する「Llama 3.2 Vision」を使用
    const response = await AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      prompt: "Extract wine details from this image. Return ONLY a JSON object with keys: name, country, region, grape, vintage, category.",
      image: [...new Uint8Array(imageBuffer)]
    });

    return NextResponse.json({ result: response });
  } catch (e) {
    console.error("Scan Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
