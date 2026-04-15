export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function GET() {
  // @ts-ignore
  const { results } = await process.env.DB.prepare("SELECT * FROM wines ORDER BY id DESC").all();
  return NextResponse.json(results);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name_jp, name_en, price, stock, category, vintage, image_url, variety, sub_region, description } = body;

    if (id) {
      // 既存のワインを更新
      // @ts-ignore
      await process.env.DB.prepare(
        "UPDATE wines SET name_jp=?, name_en=?, price=?, stock=?, category=?, vintage=?, image_url=?, variety=?, sub_region=?, description=? WHERE id = ?"
      ).bind(name_jp, name_en, price, stock, category, vintage, image_url, variety, sub_region, description, id).run();
    } else {
      // 新しいワインを追加
      // @ts-ignore
      await process.env.DB.prepare(
        "INSERT INTO wines (name_jp, name_en, price, stock, category, vintage, image_url, variety, sub_region, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(name_jp, name_en, price, stock, category, vintage, image_url, variety, sub_region, description).run();
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
