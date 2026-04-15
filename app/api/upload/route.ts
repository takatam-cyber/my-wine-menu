export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    // ファイル名を重複させないための処理
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    
    // Cloudflare R2に画像を保存
    // @ts-ignore
    await process.env.WINE_IMAGES.put(fileName, file.stream(), {
      httpMetadata: { contentType: file.type }
    });

    // 新しく作成されたあなたのURL
    const publicBaseUrl = "https://pub-8c250d9c7f3844fdbb17adeaae8d32b1.r2.dev"; 
    const imageUrl = `${publicBaseUrl}/${fileName}`;

    return NextResponse.json({ url: imageUrl });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
