// app/api/store/inventory/sync/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * 管理画面からの「メニュー反映」用API
 * その店舗の現在のラインナップをバッチ処理で一括更新します。
 */
export async function POST(req: Request) {
  try {
    const { slug, inventory } = await req.json(); // inventory: { "wineId": { active, price... }, ... }
    const env = getRequestContext().env;

    // トランザクション的な処理を行うため、一旦その店舗の可視フラグをリセットするか、
    // あるいは受け取ったリストに含まれないものを非表示にするロジック
    const wineIds = Object.keys(inventory);
    
    // 全ての更新クエリを準備
    const statements = wineIds.map(id => {
      const item = inventory[id];
      return env.DB.prepare(`
        INSERT INTO store_inventory (store_slug, wine_id, stock, price_bottle, price_glass, is_visible)
        VALUES (?, ?, ?, ?, ?, 1)
        ON CONFLICT(store_slug, wine_id) DO UPDATE SET
          stock = ?,
          price_bottle = ?,
          price_glass = ?,
          is_visible = 1
      `).bind(slug, id, item.stock, item.price_bottle, item.price_glass, item.stock, item.price_bottle, item.price_glass);
    });

    // 採用されていないワインを非表示にする (今回のリストにないものを is_visible = 0 に)
    const placeholders = wineIds.map(() => '?').join(',');
    const cleanup = env.DB.prepare(`
      UPDATE store_inventory 
      SET is_visible = 0 
      WHERE store_slug = ? AND wine_id NOT IN (${placeholders})
    `).bind(slug, ...wineIds);

    // バッチ実行
    await env.DB.batch([...statements, cleanup]);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Inventory Sync Error:", e.message);
    return NextResponse.json({ error: "同期に失敗しました" }, { status: 500 });
  }
}
