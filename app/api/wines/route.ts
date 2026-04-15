export const runtime = 'edge';
import { NextResponse } from 'next/server';

// ワイン一覧を取得する (GET)
export async function GET() {
  // @ts-ignore
  const { results } = await process.env.DB.prepare("SELECT * FROM wines ORDER BY id DESC").all();
  return NextResponse.json(results);
}

// ワイン情報を更新する (POST)
export async function POST(req: Request) {
  const body = await req.json();
  const { id, price, stock, category, vintage, image_url, variety, sub_region, description } = body;

  // @ts-ignore
  await process.env.DB.prepare(
    "UPDATE wines SET price = ?, stock = ?, category = ?, vintage = ?, image_url = ?, variety = ?, sub_region = ?, description = ? WHERE id = ?"
  ).bind(price, stock, category, vintage, image_url, variety, sub_region, description, id).run();

  return NextResponse.json({ success: true });
}
