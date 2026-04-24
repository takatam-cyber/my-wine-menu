export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const env = getRequestContext().env;
    const BUCKET = env.WINE_IMAGES; // 環境変数から取得

    const arrayBuffer = await file.arrayBuffer();
    await BUCKET.put(fileName, arrayBuffer, {
      httpMetadata: { contentType: file.type }
    });

    const publicBaseUrl = "https://pub-8c250d9c7f3844fdbb17adeaae8d32b1.r2.dev"; 
    return NextResponse.json({ url: `${publicBaseUrl}/${fileName}` });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
