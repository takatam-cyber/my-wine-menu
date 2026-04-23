// app/api/master/bulk/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error("CSVファイルがありません");

    const buffer = await file.arrayBuffer();
    let text = new TextDecoder("utf-8").decode(buffer);
    if (text.includes('\uFFFD')) text = new TextDecoder("shift-jis").decode(buffer);
    
    text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const rows = text.split('\n').filter(line => line.trim());
    const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
    
    const db = (getRequestContext() as any).env.DB;
    const batch = [];
    
    for (let i = 1; i < rows.length; i++) {
      const values: string[] = [];
      let cell = "", inQuote = false;
      const currentRow = rows[i];

      for (let j = 0; j < currentRow.length; j++) {
        const char = currentRow[j];
        if (char === '"') inQuote = !inQuote;
        else if (char === ',' && !inQuote) {
          values.push(cell.trim().replace(/^"|"$/g, ''));
          cell = "";
        } else cell += char;
      }
      values.push(cell.trim().replace(/^"|"$/g, ''));

      const data: any = {};
      headers.forEach((h, idx) => { if (h) data[h] = values[idx] || ""; });
      if (!data.id) continue;

      const getInt = (key: string) => { const v = parseInt(data[key]); return isNaN(v) ? 0 : v; };
      
      // visible 項目を is_priority に変換
      const isPriority = (data.visible === "ON" || data.visible === "1" || data.id.toString().startsWith('P-')) ? 1 : 0;

      batch.push(
        db.prepare(`
          INSERT INTO wines_master (
            id, name_jp, name_en, country, region, grape, color, type, vintage, alcohol,
            price_bottle, price_glass, cost, stock, ideal_stock, supplier, storage,
            ai_explanation, menu_short, pairing, sweetness, body, acidity, tannins,
            aroma_intensity, complexity, finish, oak, aroma_features, tags,
            best_drinking, image_url, is_priority, filename
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name_jp=excluded.name_jp, name_en=excluded.name_en, country=excluded.country,
            price_bottle=excluded.price_bottle, price_glass=excluded.price_glass,
            ai_explanation=excluded.ai_explanation, image_url=excluded.image_url,
            is_priority=excluded.is_priority, aroma_features=excluded.aroma_features,
            sweetness=excluded.sweetness, body=excluded.body, acidity=excluded.acidity, tannins=excluded.tannins
        `).bind(
          data.id, data.name_jp, data.name_en, data.country, data.region, data.grape, 
          data.color, data.type, data.vintage, data.alcohol,
          getInt('price_bottle'), getInt('price_glass'), getInt('cost'), 
          getInt('stock'), getInt('ideal_stock'), data.supplier, data.storage,
          data.ai_explanation, data.menu_short, data.pairing,
          getInt('sweetness'), getInt('body'), getInt('acidity'), getInt('tannins'),
          getInt('aroma_intensity'), getInt('complexity'), getInt('finish'), getInt('oak'),
          data.aroma_features, data.tags, data.best_drinking, data.image_url, 
          isPriority, data.filename
        )
      );
    }

    if (batch.length > 0) await db.batch(batch);
    return NextResponse.json({ success: true, count: batch.length });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
