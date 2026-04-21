export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error("ファイルが見つかりません。");

    const text = await file.text();
    const rows = text.split(/\r?\n/).filter(line => line.trim());
    if (rows.length < 2) throw new Error("CSVデータが不足しています。");

    // ヘッダーの取得とクレンジング
    const headers = rows[0].split(',').map(h => 
      h.trim().replace(/^"|"$/g, '').replace(/^\\s*/, '')
    );
    
    const db = getRequestContext().env.DB;
    const batch = [];

    for (let i = 1; i < rows.length; i++) {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      for (const char of rows[i]) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else current += char;
      }
      values.push(current.trim());

      const data: any = {};
      headers.forEach((h, idx) => {
        data[h] = values[idx]?.replace(/^"|"$/g, '') || "";
      });

      if (!data['ID']) continue;

      const isPriority = data['仕入先']?.includes('ピーロート') ? 1 : 0;

      batch.push(
        db.prepare(`
          INSERT INTO wines_master (
            id, name_jp, name_en, country, region, grape, color, type, vintage, 
            alcohol, ai_explanation, menu_short, pairing, aroma_features, tags, 
            image_url, is_priority, sweetness, body, acidity, tannins, 
            aroma_intensity, complexity, finish, oak
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name_jp=excluded.name_jp, ai_explanation=excluded.ai_explanation,
            image_url=excluded.image_url, is_priority=excluded.is_priority,
            pairing=excluded.pairing, sweetness=excluded.sweetness, body=excluded.body,
            acidity=excluded.acidity, tannins=excluded.tannins, 
            aroma_intensity=excluded.aroma_intensity, complexity=excluded.complexity,
            finish=excluded.finish, oak=excluded.oak
        `).bind(
          data['ID'], data['ワイン名(日)'], data['ワイン名(英)'], data['生産国'],
          data['地域'], data['主要品種'], data['色'], data['タイプ'], data['ヴィンテージ'],
          data['アルコール'], data['AI解説'], data['メニュー用短文'], data['ペアリング'],
          data['香りの特徴'], data['タグ'], data['画像URL'], isPriority,
          parseFloat(data['甘味'] || "0"), parseFloat(data['ボディ'] || "0"),
          parseFloat(data['酸味'] || "0"), parseFloat(data['渋み'] || "0"),
          parseFloat(data['香り強'] || "0"), parseFloat(data['複雑性'] || "0"),
          parseFloat(data['余韻'] || "0"), parseFloat(data['樽感'] || "0")
        )
      );
    }

    if (batch.length === 0) throw new Error("有効なデータ行が見つかりませんでした。");

    await db.batch(batch);
    return NextResponse.json({ success: true, count: batch.length });
  } catch (e: any) {
    console.error("Bulk error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
