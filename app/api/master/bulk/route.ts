export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error("CSVファイルが見つかりません。");

    let text = await file.text();
    
    // 【対策1】BOM（目に見えないゴミ文字）と特殊な改行コードを完全に除去
    text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // 引用符内の改行を考慮した行分割
    const rows: string[] = [];
    let currentRow = "";
    let inQuote = false;
    for (const char of text) {
      if (char === '"') inQuote = !inQuote;
      if (char === '\n' && !inQuote) {
        if (currentRow.trim()) rows.push(currentRow);
        currentRow = "";
      } else {
        currentRow += char;
      }
    }
    if (currentRow.trim()) rows.push(currentRow);

    if (rows.length < 2) throw new Error("CSVに有効なデータが含まれていません。");

    // 【対策2】ヘッダーの「超」クレンジング
    const rawHeaders = rows[0].split(',');
    const headers = rawHeaders.map(h => 
      h.replace(/\/gi, '').replace(/["']/g, '').trim()
    );

    // 【対策3】「ID」列を位置を問わず特定
    const idIdx = headers.findIndex(h => h.toUpperCase() === "ID");
    if (idIdx === -1) {
      throw new Error(`「ID」列が見つかりません。認識したヘッダー: ${headers.join(' / ')}`);
    }

    const db = getRequestContext().env.DB;
    const batch = [];

    for (let i = 1; i < rows.length; i++) {
      // 引用符内のカンマを保護するパース
      const values: string[] = [];
      let cell = "";
      let inCellQuote = false;
      for (const char of rows[i]) {
        if (char === '"') inCellQuote = !inCellQuote;
        else if (char === ',' && !inCellQuote) {
          values.push(cell.trim().replace(/^"|"$/g, ''));
          cell = "";
        } else cell += char;
      }
      values.push(cell.trim().replace(/^"|"$/g, ''));

      const data: any = {};
      headers.forEach((h, idx) => { if (h) data[h] = values[idx] || ""; });

      const wineId = values[idIdx];
      if (!wineId) continue;

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

    await db.batch(batch);
    return NextResponse.json({ success: true, count: batch.length });
  } catch (e: any) {
    console.error("Bulk Import Fatal Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
