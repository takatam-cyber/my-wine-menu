// app/api/store/export/[slug]/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * 店舗別の在庫CSVエクスポート
 * マスターの全項目を維持しつつ、該当店舗の価格・在庫を反映して出力
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const env = (getRequestContext() as any).env;
    const db = env.DB;

    // 店舗在庫(store_inventory)とマスター(wines_master)をJOIN
    // 店舗固有の値がない場合はマスターの値をフォールバックとして取得
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

    // 黄金の約束: 34列の順序を完全に一致させる
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
        
        // 店舗固有の数値を優先マッピング
        if (h === "price_bottle") {
          val = String(row.store_price_bottle ?? row.price_bottle ?? 0);
        } else if (h === "price_glass") {
          val = String(row.store_price_glass ?? row.price_glass ?? 0);
        } else if (h === "stock") {
          val = String(row.store_stock ?? row.stock ?? 0);
        } else if (h === "visible") {
          val = row.is_priority === 1 ? "ON" : "OFF";
        } else {
          const rawVal = row[h];
          val = (rawVal === null || rawVal === undefined) ? "" : String(rawVal);
        }

        // CSVエスケープ処理
        const escaped = val.replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    // Excel対応: UTF-8 BOM + \r\n
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const csvContent = csvRows.join('\r\n');
    const contentArray = new TextEncoder().encode(csvContent);
    const responseArray = new Uint8Array(bom.length + contentArray.length);
    responseArray.set(bom);
    responseArray.set(contentArray, bom.length);

    return new Response(responseArray, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="inventory_${slug}.csv"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
