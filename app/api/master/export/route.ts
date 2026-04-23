// app/api/master/export/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * 日本のExcelで文字化けせず、かつ全34列をテンプレート通りに出力するAPI
 */
export async function GET() {
  try {
    const db = (getRequestContext() as any).env.DB;
    const { results } = await db.prepare("SELECT * FROM wines_master ORDER BY id ASC").all();

    // 入力テンプレート(入力.csv)と全く同じ全34列の順番を定義
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
        if (h === "visible") {
          val = row.is_priority === 1 ? "ON" : "OFF";
        } else {
          val = row[h] === null || row[h] === undefined ? "" : String(row[h]);
        }
        // CSVエスケープ: ダブルクォートで囲み、中のクォートは2重にする
        return `"${val.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    // Excel用UTF-8 BOM (0xEF, 0xBB, 0xBF)
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const csvContent = csvRows.join('\r\n');
    const contentArray = new TextEncoder().encode(csvContent);
    const blob = new Uint8Array(bom.length + contentArray.length);
    blob.set(bom);
    blob.set(contentArray, bom.length);

    return new Response(blob, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="wine_master_full_export.csv"',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
