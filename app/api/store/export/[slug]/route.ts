// app/api/store/export/[slug]/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * 店舗別の在庫CSVエクスポート（マスターの全項目を維持しつつ、店舗価格・在庫を反映）
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const db = (getRequestContext() as any).env.DB;

    // 店舗在庫とマスターをJOINして、全項目をマスターテンプレートの形式で取得
    const { results } = await db.prepare(`
      SELECT 
        m.*,
        i.price_bottle as store_price_bottle,
        i.price_glass as store_price_glass,
        i.stock as store_stock
      FROM wines_master m
      LEFT JOIN store_inventory i ON m.id = i.wine_id AND i.store_slug = ?
      ORDER BY m.id ASC
    `).bind(slug).all();

    const headers = [
      "id", "name_jp", "name_en", "country", "region", "grape", "color", "type", 
      "vintage", "alcohol", "price_bottle", "price_glass", "cost", "stock", 
      "ideal_stock", "supplier", "storage", "ai_explanation", "menu_short", 
      "pairing", "sweetness", "body", "acidity", "tannins", "aroma_intensity", 
      "complexity", "finish", "oak", "aroma_features", "tags", "best_drinking", 
      "image_url", "visible", "filename"
    ];

    const csvRows = [headers.join(',')];

    (results as any[]).forEach(row => {
      const values = headers.map(h => {
        let val = "";
        // 店舗固有の値を優先（存在する場合）
        if (h === "price_bottle") val = String(row.store_price_bottle ?? row.price_bottle ?? 0);
        else if (h === "price_glass") val = String(row.store_price_glass ?? row.price_glass ?? 0);
        else if (h === "stock") val = String(row.store_stock ?? row.stock ?? 0);
        else if (h === "visible") val = row.is_priority === 1 ? "ON" : "OFF";
        else val = row[h] === null || row[h] === undefined ? "" : String(row[h]);

        return `"${val.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const csvArray = new TextEncoder().encode(csvRows.join('\r\n'));
    const responseArray = new Uint8Array(bom.length + csvArray.length);
    responseArray.set(bom);
    responseArray.set(csvArray, bom.length);

    return new Response(responseArray, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="inventory_${slug}.csv"`
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
