export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const slug = formData.get('slug') as string;
    
    if (!file || !slug) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    const text = await file.text();
    const rows = text.split('\n').filter(row => row.trim() !== '');
    const headers = rows[0].split(',').map(h => h.trim());
    
    const env = getRequestContext().env;

    // slugからstore_idを取得
    const store = await env.DB.prepare(`SELECT store_email FROM store_configs WHERE slug = ?`).bind(slug).first();
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });
    const store_id = store.store_email;

    // 一旦その店舗の在庫をクリア（入れ替えのため）
    await env.DB.prepare(`DELETE FROM store_inventory WHERE store_id = ?`).bind(store_id).run();

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(',').map(v => v.trim());
      const data: any = {};
      headers.forEach((h, idx) => { data[h] = values[idx]; });

      // CSVヘッダー: ID, ボトル価格, グラス価格, 在庫
      await env.DB.prepare(`
        INSERT INTO store_inventory (store_id, wine_id, price_bottle, price_glass, stock, is_visible)
        VALUES (?, ?, ?, ?, ?, 1)
      `).bind(
        store_id, data['ID'], data['ボトル価格'], data['グラス価格'], data['在庫']
      ).run();
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
