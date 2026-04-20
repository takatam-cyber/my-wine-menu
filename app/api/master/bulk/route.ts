export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const wines = await req.json();
    const db = getRequestContext().env.DB;

    const statements = wines.map((w: any) => {
      const flavor = JSON.stringify({
        sweetness: w.sweetness, body: w.body, acidity: w.acidity, 
        tannin: w.tannin, aroma_intensity: w.aroma_intensity,
        complexity: w.complexity, aftertaste: w.aftertaste, oak: w.oak
      });

      return db.prepare(`
        INSERT OR REPLACE INTO wines_master 
        (id, name_jp, name_en, country, region, grape, color, type, vintage, alcohol, 
         ai_explanation, menu_short, pairing, flavor_profile, aroma_features, tags, best_drinking, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        String(w.id), w.name_jp, w.name_en, w.country, w.region, w.grape, w.color, w.type, w.vintage, w.alcohol,
        w.ai_explanation, w.menu_short, w.pairing, flavor, w.aroma_features, w.tags, w.best_drinking, w.image_url
      );
    });

    await db.batch(statements);
    return NextResponse.json({ success: true, count: wines.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
