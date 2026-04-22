export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const slug = formData.get('slug') as string;
    
    if (!file || !slug) throw new Error("Missing data");

    const text = await file.text();
    const rows = text.replace(/\r/g, '').split('\n').filter(row => row.trim());
    const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
    
    const db = getRequestContext().env.DB;
    const batchRequests = [];

    // 店舗が存在するかまずチェック
    const store = await db.prepare("SELECT store_email FROM store_configs WHERE slug = ?").bind(slug).first();
    if (!store) throw new Error(`店舗スラグ「${slug}」が登録されていません。先に店舗設定を作成してください。`);

    batchRequests.push(db.prepare(`DELETE FROM store_inventory WHERE store_id = ?`).bind(store.store_email));

    for (let i = 1; i < rows.length; i++) {
      // 引用符対応のパース
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
      headers.forEach((h, idx) => { data[h] = values[idx]?.replace(/^"|"$/g, ''); });

      const wineId = data['id'] || data['ワインid'];
      if (!wineId) continue;

      batchRequests.push(
        db.prepare(`
          INSERT INTO store_inventory (store_id, wine_id, price_bottle, price_glass, stock, is_visible)
          VALUES (?, ?, ?, ?, ?, 1)
        `).bind(
          store.store_email, wineId, 
          parseInt(data['ボトル価格'] || '0'), 
          parseInt(data['グラス価格'] || '0'),
          parseInt(data['在庫数'] || '0')
        )
      );
    }

    await db.batch(batchRequests);
    return NextResponse.json({ success: true, count: batchRequests.length - 1 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
