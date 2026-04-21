export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const slug = formData.get('slug') as string;
    
    if (!file || !slug) return NextResponse.json({ error: "Data missing" }, { status: 400 });

    const text = await file.text();
    const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
    const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
    
    const db = getRequestContext().env.DB;
    const batchRequests = [];

    // 1. その店舗の既存データをクリアするリクエスト
    batchRequests.push(db.prepare(`DELETE FROM store_inventory WHERE store_id = (SELECT store_email FROM store_configs WHERE slug = ?)`).bind(slug));

    // 2. CSVデータを一気に構築
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(',').map(v => v.trim());
      const data: any = {};
      headers.forEach((h, idx) => { data[h] = values[idx]; });

      const wineId = data['id'] || data['ワインid'];
      if (!wineId) continue;

      batchRequests.push(
        db.prepare(`
          INSERT INTO store_inventory (store_id, wine_id, price_bottle, price_glass, stock, is_visible)
          SELECT store_email, ?, ?, ?, ?, 1 FROM store_configs WHERE slug = ?
        `).bind(
          wineId, 
          parseInt(data['ボトル価格'] || data['price_bottle'] || '0'), 
          parseInt(data['グラス価格'] || data['price_glass'] || '0'),
          parseInt(data['在庫'] || data['stock'] || '0'),
          slug
        )
      );
    }

    // 【プロの改善】1トランザクションで1,000件以上を高速処理
    await db.batch(batchRequests);

    return NextResponse.json({ success: true, count: batchRequests.length - 1 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
