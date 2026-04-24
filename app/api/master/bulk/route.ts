// app/api/master/bulk/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error("CSVファイルが必要です。");

    const text = await file.text();
    const rows = text.split(/\r?\n/).filter(line => line.trim());
    if (rows.length < 2) throw new Error("有効なデータがありません。");

    const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const db = getRequestContext().env.DB;
    const batch = [];

    for (let i = 1; i < rows.length; i++) {
      // 引用符対応の正規表現パース
      const values = rows[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || [];
      const data: any = {};
      headers.forEach((h, idx) => { data[h] = values[idx] || ""; });

      if (!data['ID']) continue;

      const isPriority = data['仕入先']?.includes('ピーロート') ? 1 : 0;

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
            region=excluded.region, grape=excluded.grape, color=excluded.color,
            vintage=excluded.vintage, ai_explanation=excluded.ai_explanation,
            menu_short=excluded.menu_short, pairing=excluded.pairing,
            is_priority=excluded.is_priority, image_url=excluded.image_url
        `).bind(
          data['ID'], data['ワイン名(日)'], data['ワイン名(英)'], data['生産国'],
          data['地域'], data['主要品種'], data['色'], data['タイプ'], data['ヴィンテージ'],
          data['アルコール'], data['仕入先'], data['AI解説'], data['メニュー用短文'],
          data['ペアリング'], data['香りの特徴'], data['タグ'], data['画像URL'], isPriority,
          parseInt(data['甘味'] || '0'), parseInt(data['ボディ'] || '0'), 
          parseInt(data['酸味'] || '0'), parseInt(data['タンニン'] || '0'),
          parseInt(data['香りの強さ'] || '0'), parseInt(data['複雑さ'] || '0'),
          parseInt(data['余韻'] || '0'), parseInt(data['樽感'] || '0')
        )
      );
    }

    if (batch.length > 0) await db.batch(batch);
    return NextResponse.json({ success: true, count: batch.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
