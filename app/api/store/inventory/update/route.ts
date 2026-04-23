// app/api/store/inventory/update/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { slug, wineId, price_bottle, price_glass, stock } = await req.json();
    const db = (getRequestContext() as any).env.DB;

    let query = "UPDATE store_inventory SET ";
    const params: any[] = [];
    const sets: string[] = [];

    if (price_bottle !== undefined) {
      sets.push("price_bottle = ?");
      params.push(price_bottle);
    }
    if (price_glass !== undefined) {
      sets.push("price_glass = ?");
      params.push(price_glass);
    }
    if (stock !== undefined) {
      sets.push("stock = ?");
      params.push(stock);
    }

    if (sets.length === 0) return NextResponse.json({ success: true });

    query += sets.join(", ") + " WHERE store_slug = ? AND wine_id = ?";
    params.push(slug, wineId);

    await db.prepare(query).bind(...params).run();

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
