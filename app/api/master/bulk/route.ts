export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error("ファイルが見つかりません。");

    const text = await file.text();
    // 行分割（空行除外）
    const rows = text.split(/\r?\n/).filter(line => line.trim());
    if (rows.length < 2) throw new Error("CSVにデータ行がありません。");

    // ヘッダーのクレンジング（等の除去）
    const headers = rows[0].split(',').map(h => 
      h.trim().replace(/^"|"$/g, '').replace(/^\\s*/, '')
    );
    
    const db = getRequestContext().env.DB;
    const batch = [];

    for (let i = 1; i < rows.length; i++) {
      // プロ仕様のCSV行パース（空フィールドを正確に保持）
      const values: string[] = [];
      let cell = "";
      let inQuote = false;
      for (let j = 0; j < rows[i].length; j++) {
        const char = rows[i][j];
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          values.push(cell.trim().replace(/^"|"$/g, ''));
          cell = "";
        } else {
          cell += char;
        }
      }
      values.push(cell.trim().replace(/^"|"$/g, '')); // 最後の列を追加

      const data: any = {};
      headers.forEach((h, idx) => {
        data[h] = values[idx] || "";
      });

      // 必須の「ID」が空ならスキップ
      if (!data['ID']) {
        console.warn(`Row ${i}: ID missing. Data:`, data);
        continue;
      }

      const isPriority = data['仕入先']?.includes('ピーロート') ? 1 : 0;
      const getNum = (key: string) => {
        const val = parseFloat(data[key]);
        return isNaN(val) ? 0 : val;
      };

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
          getNum('甘味'), getNum('ボディ'), getNum('酸味'), getNum('渋み'),
          getNum('香り強'), getNum('複雑性'), getNum('余韻'), getNum('樽感')
        )
      );
    }

    if (batch.length === 0) {
      return NextResponse.json({ error: "有効なデータ（ID列あり）が1件も見つかりませんでした。CSVの形式を確認してください。" }, { status: 400 });
    }

    await db.batch(batch);
    return NextResponse.json({ success: true, count: batch.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
