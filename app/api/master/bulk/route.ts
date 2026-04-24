// app/api/master/bulk/route.ts の完全版
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error("ファイルが見つかりません。");

    const text = await file.text();
    // 【プロの対策】正規表現による高度なCSVパース（引用符内のカンマにも対応）
    const rows = text.split(/\r?\n/).filter(line => line.trim());
    const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    const db = getRequestContext().env.DB;
    const batch = [];

    for (let i = 1; i < rows.length; i++) {
      // 引用符対応の高度な分割
      const values = rows[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || [];
      const data: any = {};
      headers.forEach((h, idx) => { data[h] = values[idx] || ""; });

      if (!data['ID']) continue;

      const isPriority = data['仕入先']?.includes('ピーロート') ? 1 : 0;

      batch.push(
        db.prepare(`
          INSERT INTO wines_master (
            id, name_jp, name_en, country, region, grape, color, type, vintage, 
            alcohol, ai_explanation, menu_short, pairing, aroma_features, tags, 
            image_url, is_priority
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name_jp=excluded.name_jp, ai_explanation=excluded.ai_explanation, 
            image_url=excluded.image_url, is_priority=excluded.is_priority,
            pairing=excluded.pairing, country=excluded.country
        `).bind(
          data['ID'], data['ワイン名(日)'], data['ワイン名(英)'], data['生産国'],
          data['地域'], data['主要品種'], data['色'], data['タイプ'], data['ヴィンテージ'],
          data['アルコール'], data['AI解説'], data['メニュー用短文'], data['ペアリング'],
          data['香りの特徴'], data['タグ'], data['画像URL'], isPriority
        )
      );
    }

    // 【プロの対策】バッチ処理で高速化
    await db.batch(batch);
    return NextResponse.json({ success: true, count: batch.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
