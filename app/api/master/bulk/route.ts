export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error("CSVファイルが選択されていません。");

    // バイナリとして読み込む
    const buffer = await file.arrayBuffer();
    let text = new TextDecoder("utf-8").decode(buffer);

    // 文字化け（置換文字 \uFFFD）が含まれる場合はShift-JISでデコードし直す
    if (text.includes('\uFFFD')) {
      text = new TextDecoder("shift-jis").decode(buffer);
    }
    
    text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const rows = text.split('\n').filter(line => line.trim());
    if (rows.length < 2) throw new Error("CSVに有効なデータが含まれていません。");

    // ヘッダーのクリーニング（ビルドエラーを修正）
    const headers = rows[0].split(',').map(h => 
      h.replace(/【\d+†source】/gi, '').replace(/["']/g, '').trim().toLowerCase()
    );
    
    const db = getRequestContext().env.DB;
    const batch = [];
    const idIdx = headers.findIndex(h => h === "id");
    if (idIdx === -1) throw new Error("「id」列が見つかりません。");

    for (let i = 1; i < rows.length; i++) {
      const values: string[] = [];
      let cell = "";
      let inQuote = false;
      const currentRow = rows[i];
      
      for (let j = 0; j < currentRow.length; j++) {
        const char = currentRow[j];
        if (char === '"') inQuote = !inQuote;
        else if (char === ',' && !inQuote) {
          values.push(cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          cell = "";
        } else cell += char;
      }
      values.push(cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

      const data: any = {};
      headers.forEach((h, idx) => { if (h) data[h] = values[idx] || ""; });
      if (!values[idIdx]) continue;

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
            name_jp=excluded.name_jp, name_en=excluded.name_en, ai_explanation=excluded.ai_explanation,
            image_url=excluded.image_url, is_priority=excluded.is_priority,
            sweetness=excluded.sweetness, body=excluded.body, acidity=excluded.acidity
        `).bind(
          values[idIdx], data.name_jp, data.name_en, data.country, data.region, data.grape, 
          data.color, data.type, data.vintage, data.alcohol, data.ai_explanation, 
          data.menu_short, data.pairing, data.aroma_features, data.tags, data.image_url,
          (data.supplier || "").includes('ピーロート') ? 1 : 0,
          getNum('sweetness'), getNum('body'), getNum('acidity'), getNum('tannins'),
          getNum('aroma_intensity'), getNum('complexity'), getNum('finish'), getNum('oak')
        )
      );
    }

    await db.batch(batch);
    return NextResponse.json({ success: true, count: batch.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
