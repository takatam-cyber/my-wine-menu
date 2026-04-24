// app/api/master/bulk/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * インポーター（ピーロート）管理のマスターデータをCSVから一括登録するAPI
 * スキーマ: wines_master
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error("CSVファイルが添付されていません。");

    const text = await file.text();
    // 簡易的なCSVパース（引用符内のカンマには非対応。必要に応じてPapaParse等を利用検討）
    const rows = text.split(/\r?\n/).filter(line => line.trim());
    if (rows.length < 2) throw new Error("CSVデータが空、またはヘッダーのみです。");

    const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const db = getRequestContext().env.DB;
    const batch = [];

    for (let i = 1; i < rows.length; i++) {
      // 引用符対応のパースロジック
      const values = rows[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || [];
      const data: any = {};
      headers.forEach((h, idx) => { data[h] = values[idx] || ""; });

      if (!data['ID']) continue;

      // 自社（ピーロート）輸入品かどうかの判定
      const isPriority = data['仕入先']?.includes('ピーロート') ? 1 : 0;

      // D1スキーマに基づいたパラメータバインド
      batch.push(
        db.prepare(`
          INSERT INTO wines_master (
            id, name_jp, name_en, country, region, grape, color, type, vintage, 
            alcohol, supplier, ai_explanation, menu_short, pairing, aroma_features, 
            tags, image_url, is_priority
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name_jp=excluded.name_jp, 
            name_en=excluded.name_en,
            country=excluded.country,
            region=excluded.region,
            grape=excluded.grape,
            color=excluded.color,
            type=excluded.type,
            vintage=excluded.vintage,
            alcohol=excluded.alcohol,
            supplier=excluded.supplier,
            ai_explanation=excluded.ai_explanation,
            menu_short=excluded.menu_short,
            pairing=excluded.pairing,
            aroma_features=excluded.aroma_features,
            tags=excluded.tags,
            image_url=excluded.image_url,
            is_priority=excluded.is_priority
        `).bind(
          data['ID'], 
          data['ワイン名(日)'] || '名称未設定', 
          data['ワイン名(英)'] || '', 
          data['生産国'] || '',
          data['地域'] || '', 
          data['主要品種'] || '', 
          data['色'] || '', 
          data['タイプ'] || '', 
          data['ヴィンテージ'] || '',
          data['アルコール'] || '', 
          data['仕入先'] || '',
          data['AI解説'] || '', 
          data['メニュー用短文'] || '', 
          data['ペアリング'] || '',
          data['香りの特徴'] || '', 
          data['タグ'] || '', 
          data['画像URL'] || '', 
          isPriority
        )
      );
    }

    if (batch.length > 0) {
      await db.batch(batch);
    }

    return NextResponse.json({ success: true, count: batch.length });
  } catch (e: any) {
    console.error("Master Bulk Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
