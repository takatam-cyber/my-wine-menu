export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const slug = formData.get('slug') as string;
    
    if (!file || !slug) throw new Error("Missing data");

    const buffer = await file.arrayBuffer();
    let text = new TextDecoder("utf-8").decode(buffer);
    if (text.includes('')) {
      text = new TextDecoder("shift-jis").decode(buffer);
    }

    text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const rows = text.split('\n').filter(row => row.trim());
    const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
    
    const db = getRequestContext().env.DB;
    const batchRequests = [];

    const store = await db.prepare("SELECT store_email FROM store_configs WHERE slug = ?").bind(slug).first();
    if (!store) throw new Error(`店舗が登録されていません。`);

    batchRequests.push(db.prepare(`DELETE FROM store_inventory WHERE store_id = ?`).bind(store.store_email));

    for (let i = 1; i < rows.length; i++) {
      const values: string[] = [];
      let cell = "";
      let inQuote = false;
      const currentRow = rows[i];
      for (const char of currentRow) {
        if (char === '"') inQuote = !inQuote;
        else if (char === ',' && !inQuote) { values.push(cell.trim()); cell = ""; }
        else cell += char;
      }
      values.push(cell.trim());

      const data: any = {};
      headers.forEach((h, idx) => { data[h] = values[idx]?.replace(/^"|"$/g, ''); });

      const wineId = data['id'] || data['ワインid'];
      if (!wineId) continue;

      batchRequests.push(
        db.prepare(`
          INSERT INTO store_inventory (store_id, wine_id, price_bottle, price_glass, stock, is_visible)
          VALUES (?, ?, ?, ?, ?, 1)
        `).bind(
          store.store_email, wineId, 
          parseInt(data['ボトル価格'] || data['price_bottle'] || '0'), 
          parseInt(data['グラス価格'] || data['price_glass'] || '0'),
          parseInt(data['在庫数'] || data['stock'] || '0')
        )
      );
    }

    await db.batch(batchRequests);
    return NextResponse.json({ success: true, count: batchRequests.length - 1 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
