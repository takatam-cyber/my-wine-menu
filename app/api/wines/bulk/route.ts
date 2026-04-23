// app/api/wines/bulk/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const slug = formData.get('slug') as string;
    
    if (!file || !slug) throw new Error("データまたは店舗識別子が不足しています");

    const buffer = await file.arrayBuffer();
    
    // 文字コード判別
    let text = new TextDecoder("utf-8").decode(buffer);
    if (text.includes('\uFFFD')) {
      text = new TextDecoder("shift-jis").decode(buffer);
    }

    text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const rows = text.split('\n').filter(row => row.trim());
    if (rows.length < 2) throw new Error("CSVに有効なデータが含まれていません");

    const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
    const db = (getRequestContext() as any).env.DB;

    // 店舗の存在確認
    const store = await db.prepare("SELECT slug FROM store_configs WHERE slug = ?").bind(slug).first();
    if (!store) throw new Error(`店舗「${slug}」が見つかりません`);

    const batchRequests = [];
    
    // 今回のCSVを「正」とするため、一旦削除（または必要に応じてフラグ管理）
    batchRequests.push(db.prepare(`DELETE FROM store_inventory WHERE store_slug = ?`).bind(slug));

    for (let i = 1; i < rows.length; i++) {
      const currentRow = rows[i];
      const values: string[] = [];
      let cell = "", inQuote = false;
      
      for (const char of currentRow) {
        if (char === '"') inQuote = !inQuote;
        else if (char === ',' && !inQuote) { values.push(cell.trim()); cell = ""; }
        else cell += char;
      }
      values.push(cell.trim());

      const data: any = {};
      headers.forEach((h, idx) => { data[h] = values[idx]?.replace(/^"|"$/g, ''); });

      const wineId = data.id || data.wine_id;
      if (!wineId) continue;

      batchRequests.push(
        db.prepare(`
          INSERT INTO store_inventory (store_slug, wine_id, price_bottle, price_glass, stock, is_visible)
          VALUES (?, ?, ?, ?, ?, 1)
        `).bind(
          slug, 
          wineId, 
          parseInt(data.price_bottle || '0'), 
          parseInt(data.price_glass || '0'),
          parseInt(data.stock || '0')
        )
      );
    }

    await db.batch(batchRequests);
    return NextResponse.json({ success: true, count: batchRequests.length - 1 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
