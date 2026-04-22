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
    
    // 【重要】文字コード自動判別ロジック
    let text = new TextDecoder("utf-8").decode(buffer);
    if (text.includes('\uFFFD')) {
      // UTF-8でデコードして置換文字が含まれる場合、Shift-JISとして再試行
      text = new TextDecoder("shift-jis").decode(buffer);
    }

    // クレンジング：BOM削除と改行コード統一
    text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const rows = text.split('\n').filter(row => row.trim());
    if (rows.length < 2) throw new Error("CSVに有効なデータが含まれていません");

    // ヘッダー解析（小文字化・スペース除去）
    const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
    
    const db = getRequestContext().env.DB;

    // 店舗の存在確認
    const store = await db.prepare("SELECT slug FROM store_configs WHERE slug = ?").bind(slug).first();
    if (!store) throw new Error(`店舗「${slug}」が見つかりません`);

    // トランザクション的にバッチ処理を構築
    const batchRequests = [];
    
    // 既存の在庫設定を一度クリア（または更新ロジック）
    // 今回は「CSVの状態を正」とするため、既存を消して入れ直す設計
    batchRequests.push(db.prepare(`DELETE FROM store_inventory WHERE store_slug = ?`).bind(slug));

    for (let i = 1; i < rows.length; i++) {
      const values: string[] = [];
      let cell = "", inQuote = false;
      
      // カンマ区切りのパース（クォート対応）
      for (const char of rows[i]) {
        if (char === '"') inQuote = !inQuote;
        else if (char === ',' && !inQuote) { values.push(cell.trim()); cell = ""; }
        else cell += char;
      }
      values.push(cell.trim());

      const data: any = {};
      headers.forEach((h, idx) => { data[h] = values[idx]?.replace(/^"|"$/g, ''); });

      // IDの特定（複数の呼称に対応）
      const wineId = data['id'] || data['ワインid'] || data['wine_id'];
      if (!wineId) continue;

      batchRequests.push(
        db.prepare(`
          INSERT INTO store_inventory (store_slug, wine_id, price_bottle, price_glass, stock, is_visible)
          VALUES (?, ?, ?, ?, ?, 1)
        `).bind(
          slug, 
          wineId, 
          parseInt(data['ボトル価格'] || data['price_bottle'] || '0'), 
          parseInt(data['グラス価格'] || data['price_glass'] || '0'),
          parseInt(data['在庫数'] || data['stock'] || '0')
        )
      );
    }

    await db.batch(batchRequests);
    return NextResponse.json({ success: true, count: batchRequests.length - 1 });
  } catch (e: any) {
    console.error("Bulk upload error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
