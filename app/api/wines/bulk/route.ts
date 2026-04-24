// app/api/wines/bulk/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const slug = formData.get('slug') as string;

    if (!file || !slug) return NextResponse.json({ error: "ファイルまたは店舗スラッグが必要です" }, { status: 400 });

    const text = await file.text();
    const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
    if (rows.length < 2) throw new Error("CSVに有効なデータが含まれていません。");

    const headers = rows[0].split(',').map(h => h.trim());
    const db = getRequestContext().env.DB;

    // 現在のラインナップを一旦リセット（上書き更新）
    await db.prepare(`DELETE FROM store_inventory WHERE store_slug = ?`).bind(slug).run();

    const batch = [];
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(',').map(v => v.trim());
      const data: any = {};
      headers.forEach((h, idx) => { data[h] = values[idx]; });

      if (!data['ID']) continue;

      batch.push(
        db.prepare(`
          INSERT INTO store_inventory (store_slug, wine_id, price_bottle, price_glass, stock, is_visible)
          VALUES (?, ?, ?, ?, ?, 1)
        `).bind(
          slug, 
          data['ID'], 
          parseInt(data['ボトル価格'] || '0'), 
          parseInt(data['グラス価格'] || '0'), 
          parseInt(data['在庫'] || '0')
        )
      );
    }

    if (batch.length > 0) await db.batch(batch);

    return NextResponse.json({ success: true, count: batch.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
