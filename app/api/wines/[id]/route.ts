export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // 1. まずKVから現在のデータを取得して、画像のファイル名を特定する
    // @ts-ignore
    const wineData = await process.env.WINE_KV.get(id);
    if (!wineData) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    const wine = JSON.parse(wineData);
    
    // 2. URLからファイル名を取り出す (例: https://.../12345-image.jpg -> 12345-image.jpg)
    if (wine.image_url) {
      const fileName = wine.image_url.split('/').pop();
      // R2から画像を削除
      // @ts-ignore
      await process.env.WINE_IMAGES.delete(fileName);
    }

    // 3. KVからデータを削除
    // @ts-ignore
    await process.env.WINE_KV.delete(id);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
