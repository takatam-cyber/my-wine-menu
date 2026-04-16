export const runtime = 'edge';
import { NextResponse } from 'next/server';

// Next.js 15 では params を Promise として扱う必要があります
type Props = {
  params: Promise<{ id: string }>;
};

// GET: 特定のワインを取得
export async function GET(request: Request, props: Props) {
  try {
    const params = await props.params;
    const id = params.id;
    // @ts-ignore
    const wine = await process.env.WINE_KV.get(id);
    if (!wine) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(JSON.parse(wine));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE: 特定のワインを削除
export async function DELETE(request: Request, props: Props) {
  try {
    const params = await props.params;
    const id = params.id;
    // @ts-ignore
    await process.env.WINE_KV.delete(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
