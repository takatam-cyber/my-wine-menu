// app/api/store/inventory/toggle/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * 店舗メニューへのワイン追加・削除を切り替えるAPI
 */
export async function POST(req: Request) {
  try {
    const { slug, wineId } = await req.json();
    if (!slug || !wineId) throw new Error("不足しているパラメータがあります");

    const db = (getRequestContext() as any).env.DB;

    // 現在の状態を確認
    const existing = await db.prepare(
      "SELECT 1 FROM store_inventory WHERE store_slug = ? AND wine_id = ?"
    ).bind(slug, wineId).first();

    if (existing) {
      // 既に存在すれば削除
      await db.prepare(
        "DELETE FROM store_inventory WHERE store_slug = ? AND wine_id = ?"
      ).bind(slug, wineId).run();
      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      // 存在しなければマスターから初期値をコピーして追加
      await db.prepare(`
        INSERT INTO store_inventory (store_slug, wine_id, price_bottle, price_glass, stock, is_visible)
        SELECT ?, id, price_bottle, price_glass, stock, 1
        FROM wines_master WHERE id = ?
      `).bind(slug, wineId).run();
      return NextResponse.json({ success: true, action: 'added' });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
