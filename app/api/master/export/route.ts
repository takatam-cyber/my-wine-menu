// app/api/master/export/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * 日本のExcelで文字化けせず、かつ全34列をテンプレート通りに出力するAPI
 */
export async function GET() {
  try {
    const env = (getRequestContext() as any).env;
    const db = env.DB;
    
    // 全マスターデータを取得
    const { results } = await db.prepare("SELECT * FROM wines_master ORDER BY id ASC").all();

    // 黄金の約束: 入力テンプレート(入力.csv)と全く同じ全34列の順序を厳守
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
        
        // 特殊マッピング: DBの is_priority を CSVの visible (ON/OFF) に変換
        if (h === "visible") {
          val = row.is_priority === 1 ? "ON" : "OFF";
        } else {
          const rawVal = row[h];
          val = (rawVal === null || rawVal === undefined) ? "" : String(rawVal);
        }

        // CSVエスケープ: 
        // 1. すべてのフィールドをダブルクォートで囲む
        // 2. 値の中にあるダブルクォートは2重化する (" -> "")
        // 3. 改行やカンマが含まれていても列ズレしないようにする
        const escaped = val.replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    // 1. Excel用UTF-8 BOM (0xEF, 0xBB, 0xBF) の作成
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    
    // 2. CSV内容をUTF-8でエンコード (Excel対応のため改行は \r\n)
    const csvContent = csvRows.join('\r\n');
    const contentArray = new TextEncoder().encode(csvContent);
    
    // 3. BOMとコンテンツを結合
    const blob = new Uint8Array(bom.length + contentArray.length);
    blob.set(bom);
    blob.set(contentArray, bom.length);

    return new Response(blob, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="pieroth_master_export.csv"',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
