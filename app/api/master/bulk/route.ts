export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error("ファイルが見つかりません。");

    let text = await file.text();
    
    // 【対策1】BOM（目に見えないゴミ）や特殊な改行を徹底除去
    text = text.replace(/^\uFEFF/, '').replace(/\r/g, '');
    const rows = text.split('\n').filter(line => line.trim());
    if (rows.length < 2) throw new Error("CSVに有効なデータがありません。");

    // 【対策2】ヘッダーの「超」クレンジング
    // などのタグ除去、前後の空白除去、ダブルクォート除去
    const rawHeaders = rows[0].split(',');
    const headers = rawHeaders.map(h => 
      h.trim()
       .replace(/^"|"$/g, '')
       .replace(/^\\s*/i, '') // 大文字小文字問わず除去
       .trim()
    );

    // デバッグ用：システムが認識したヘッダー名をログに出す
    console.log("Parsed Headers:", headers);

    const db = getRequestContext().env.DB;
    const batch = [];

    for (let i = 1; i < rows.length; i++) {
      // 【対策3】引用符内のカンマを保護しながら分割するプロ仕様パサー
      const values: string[] = [];
      let cell = "";
      let inQuote = false;
      const currentRow = rows[i];
      
      for (let j = 0; j < currentRow.length; j++) {
        const char = currentRow[j];
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          values.push(cell.trim().replace(/^"|"$/g, ''));
          cell = "";
        } else {
          cell += char;
        }
      }
      values.push(cell.trim().replace(/^"|"$/g, ''));

      // データのマッピング
      const data: any = {};
      headers.forEach((h, idx) => {
        if (h) data[h] = values[idx] || "";
      });

      // 【対策4】「ID」というキーを大文字小文字・空白問わず探し出す
      const idKey = Object.keys(data).find(k => k.toUpperCase().trim() === "ID");
      const wineId = idKey ? data[idKey] : null;

      if (!wineId) {
        // エラー詳細を具体的に投げる
        throw new Error(`Row ${i} でIDが見つかりません。ヘッダー名を確認してください。認識中のヘッダー: ${headers.join('/')}`);
      }

      const isPriority = (data['仕入先'] || '').includes('ピーロート') ? 1 : 0;
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
          wineId, data['ワイン名(日)'], data['ワイン名(英)'], data['生産国'],
          data['地域'], data['主要品種'], data['色'], data['タイプ'], data['ヴィンテージ'],
          data['アルコール'], data['AI解説'], data['メニュー用短文'], data['ペアリング'],
          data['香りの特徴'], data['タグ'], data['画像URL'], isPriority,
          getNum('甘味'), getNum('ボディ'), getNum('酸味'), getNum('渋み'),
          getNum('香り強'), getNum('複雑性'), getNum('余韻'), getNum('樽感')
        )
      );
    }

    if (batch.length === 0) throw new Error("取り込み可能なデータが0件です。");

    await db.batch(batch);
    return NextResponse.json({ success: true, count: batch.length });
  } catch (e: any) {
    console.error("Bulk Import Fatal Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
