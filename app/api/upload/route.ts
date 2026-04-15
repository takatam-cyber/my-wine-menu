export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    
    // @ts-ignore
    await process.env.WINE_IMAGES.put(fileName, file.stream(), {
      httpMetadata: { contentType: file.type }
    });

    // 先ほど確認したあなたのURLをセット
    const publicBaseUrl = "https://pub-442c135c4d904338a3b472495ae21ddb.r2.dev"; 
    const imageUrl = `${publicBaseUrl}/${fileName}`;

    return NextResponse.json({ url: imageUrl });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
