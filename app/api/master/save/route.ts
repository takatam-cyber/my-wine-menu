// app/api/master/save/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const wine = await req.json();
    const env = getRequestContext().env;

    await env.DB.prepare(`
      INSERT INTO wines_master (
        id, name_jp, name_en, country, region, grape, color, vintage, 
        image_url, ai_explanation, price_bottle, price_glass,
        body, aroma_intensity, sweetness, complexity, tannins, finish, acidity, oak,
        is_priority
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name_jp = excluded.name_jp,
        name_en = excluded.name_en,
        country = excluded.country,
        region = excluded.region,
        grape = excluded.grape,
        color = excluded.color,
        vintage = excluded.vintage,
        image_url = excluded.image_url,
        ai_explanation = excluded.ai_explanation,
        price_bottle = excluded.price_bottle,
        price_glass = excluded.price_glass,
        body = excluded.body,
        aroma_intensity = excluded.aroma_intensity,
        sweetness = excluded.sweetness,
        complexity = excluded.complexity,
        tannins = excluded.tannins,
        finish = excluded.finish,
        acidity = excluded.acidity,
        oak = excluded.oak,
        is_priority = excluded.is_priority
    `).bind(
      wine.id, wine.name_jp, wine.name_en, wine.country, wine.region, wine.grape, wine.color, wine.vintage,
      wine.image_url, wine.ai_explanation, wine.price_bottle, wine.price_glass,
      wine.body, wine.aroma_intensity, wine.sweetness, wine.complexity, wine.tannins, wine.finish, wine.acidity, wine.oak,
      wine.is_priority
    ).run();

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Master Save Error:", e.message);
    return NextResponse.json({ error: "マスタの保存に失敗しました" }, { status: 500 });
  }
}
