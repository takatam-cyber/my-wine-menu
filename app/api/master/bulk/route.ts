export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error("CSVファイルが選択されていません。");

    let text = await file.text();
    
    // 【重要】BOMとゴミ文字の徹底除去
    text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const rows = text.split('\n').filter(line => line.trim());
    if (rows.length < 2) throw new Error("CSVに有効なデータが含まれていません。");

    // ヘッダーのクレンジング（や空白、引用符を除去）
    const headers = rows[0].split(',').map(h => 
      h.replace(/\/gi, '').replace(/["']/g, '').trim().toLowerCase()
    );
    
    const db = getRequestContext().env.DB;
    const batch = [];

    // "id"列が何番目にあるか探す
    const idIdx = headers.findIndex(h => h === "id");
    if (idIdx === -1) throw new Error(`「id」列が見つかりません。認識したヘッダー: ${headers.join('/')}`);

    for (let i = 1; i < rows.length; i++) {
      const values: string[] = [];
      let cell = "";
      let inQuote = false;
      for (const char of rows[i]) {
        if (char === '"') inQuote = !inQuote;
        else if (char === ',' && !inQuote) { values.push(cell.trim()); cell = ""; }
        else cell += char;
      }
      values.push(cell.trim());

      const data: any = {};
      headers.forEach((h, idx) => { if (h) data[h] = values[idx]?.replace(/^"|"$/g, '') || ""; });

      const wineId = values[idIdx]?.replace(/^"|"$/g, '');
      if (!wineId) continue;

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
            sweetness=excluded.sweetness, body=excluded.body, acidity=excluded.acidity,
            tannins=excluded.tannins, aroma_intensity=excluded.aroma_intensity,
            complexity=excluded.complexity, finish=excluded.finish, oak=excluded.oak
        `).bind(
          wineId, data.name_jp, data.name_en, data.country, data.region, data.grape, 
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
