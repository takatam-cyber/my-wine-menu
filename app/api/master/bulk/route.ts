// app/api/master/bulk/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error("CSVファイルが必要です");

    const text = await file.text();
    // CSVパース（簡易版: カンマ区切り、クォート対応）
    const rows = text.split(/\r?\n/).filter(line => line.trim());
    const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    const db = getRequestContext().env.DB;
    const batch = [];

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || [];
      const d: any = {};
      headers.forEach((h, idx) => { d[h] = values[idx] || ""; });

      if (!d['id'] && !d['ID']) continue;
      const id = d['id'] || d['ID'];

      // 自社輸入品（ピーロート）判定
      const isPriority = d['supplier']?.includes('ピーロート') || d['仕入先']?.includes('ピーロート') ? 1 : 0;

      batch.push(
        db.prepare(`
          INSERT INTO wines_master (
            id, name_jp, name_en, country, region, grape, color, type, vintage, 
            alcohol, price_bottle, price_glass, cost, stock, ideal_stock,
            supplier, storage, ai_explanation, menu_short, pairing,
            sweetness, body, acidity, tannins, aroma_intensity, complexity, finish, oak,
            aroma_features, tags, best_drinking, image_url, is_priority
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name_jp=excluded.name_jp, name_en=excluded.name_en, country=excluded.country,
            region=excluded.region, vintage=excluded.vintage, ai_explanation=excluded.ai_explanation,
            pairing=excluded.pairing, image_url=excluded.image_url, is_priority=excluded.is_priority
        `).bind(
          id, d['name_jp'] || "", d['name_en'] || "", d['country'] || "", d['region'] || "", 
          d['grape'] || "", d['color'] || "", d['type'] || "", d['vintage'] || "", d['alcohol'] || "",
          parseInt(d['price_bottle'] || '0'), parseInt(d['price_glass'] || '0'), parseInt(d['cost'] || '0'),
          parseInt(d['stock'] || '0'), parseInt(d['ideal_stock'] || '0'),
          d['supplier'] || "", d['storage'] || "", d['ai_explanation'] || "", d['menu_short'] || "", d['pairing'] || "",
          parseInt(d['sweetness'] || '0'), parseInt(d['body'] || '0'), parseInt(d['acidity'] || '0'),
          parseInt(d['tannins'] || '0'), parseInt(d['aroma_intensity'] || '0'), parseInt(d['complexity'] || '0'),
          parseInt(d['finish'] || '0'), parseInt(d['oak'] || '0'),
          d['aroma_features'] || "", d['tags'] || "", d['best_drinking'] || "", d['image_url'] || "", isPriority
        )
      );
    }

    if (batch.length > 0) await db.batch(batch);
    return NextResponse.json({ success: true, count: batch.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
