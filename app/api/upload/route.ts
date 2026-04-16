export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    
    // @ts-ignore
    const BUCKET = process.env.WINE_IMAGES;
    if (!BUCKET) throw new Error("R2 Bucket not found");

    // ArrayBufferを使ってより標準的な方法で保存
    const arrayBuffer = await file.arrayBuffer();
    await BUCKET.put(fileName, arrayBuffer, {
      httpMetadata: { contentType: file.type }
    });

    const publicBaseUrl = "https://pub-8c250d9c7f3844fdbb17adeaae8d32b1.r2.dev"; 
    return NextResponse.json({ url: `${publicBaseUrl}/${fileName}` });
  } catch (e) {
    console.error("Upload Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
