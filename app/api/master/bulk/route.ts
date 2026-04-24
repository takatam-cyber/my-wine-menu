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
    const rows = text.split(/\r?\n/).filter(line => line.trim());
    const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    const db = getRequestContext().env.DB;
    const batch = [];

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || [];
      const d: any = {};
      headers.forEach((h, idx) => { d[h] = values[idx] || ""; });

      if (!d['ID']) continue;

      // 自社ブランド（ピーロート）を自動で優先フラグ立て
      const isPriority = d['supplier']?.includes('ピーロート') || d['仕入先']?.includes('ピーロート') ? 1 : 0;

      batch.push(
        db.prepare(`
          INSERT INTO wines_master (
            id, name_jp, name_en, country, region, grape, color, type, vintage, 
            alcohol, supplier, ai_explanation, menu_short, pairing, aroma_features, 
            tags, image_url, is_priority, sweetness, body, acidity, tannins, 
            aroma_intensity, complexity, finish, oak
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name_jp=excluded.name_jp, name_en=excluded.name_en, country=excluded.country,
            region=excluded.region, vintage=excluded.vintage, ai_explanation=excluded.ai_explanation,
            pairing=excluded.pairing, image_url=excluded.image_url, is_priority=excluded.is_priority
        `).bind(
          d['ID'], d['name_jp'] || d['ワイン名(日)'], d['name_en'] || d['ワイン名(英)'], d['country'] || d['生産国'],
          d['region'] || d['地域'], d['grape'] || d['主要品種'], d['color'] || d['色'], d['type'] || d['タイプ'], d['vintage'] || d['ヴィンテージ'],
          d['alcohol'] || d['アルコール'], d['supplier'] || d['仕入先'], d['ai_explanation'] || d['AI解説'], d['menu_short'] || d['メニュー用短文'],
          d['pairing'] || d['ペアリング'], d['aroma_features'] || d['香りの特徴'], d['tags'] || d['タグ'], d['image_url'] || d['画像URL'], isPriority,
          parseInt(d['sweetness'] || d['甘味'] || '0'), parseInt(d['body'] || d['ボディ'] || '0'), 
          parseInt(d['acidity'] || d['酸味'] || '0'), parseInt(d['tannins'] || d['タンニン'] || '0'),
          parseInt(d['aroma_intensity'] || d['香りの強さ'] || '0'), parseInt(d['complexity'] || d['複雑さ'] || '0'),
          parseInt(d['finish'] || d['余韻'] || '0'), parseInt(d['oak'] || d['樽感'] || '0')
        )
      );
    }

    if (batch.length > 0) await db.batch(batch);
    return NextResponse.json({ success: true, count: batch.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
