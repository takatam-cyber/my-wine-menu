// app/api/store/inventory/quick-update/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * 取引先飲食店が自ら在庫や価格を「即時」更新するためのAPI
 * パフォーマンスを重視し、必要なフィールドのみをUPSERTします。
 */
export async function POST(req: Request) {
  try {
    const { slug, wineId, stock, price_bottle, price_glass } = await req.json();
    const env = getRequestContext().env;

    // 既存のレコードがあるか確認し、なければ作成、あれば更新 (UPSERT)
    // Cloudflare D1 では ON CONFLICT 句が使用可能です
    await env.DB.prepare(`
      INSERT INTO store_inventory (store_slug, wine_id, stock, price_bottle, price_glass, is_visible)
      VALUES (?, ?, ?, ?, ?, 1)
      ON CONFLICT(store_slug, wine_id) DO UPDATE SET
        stock = COALESCE(?, stock),
        price_bottle = COALESCE(?, price_bottle),
        price_glass = COALESCE(?, price_glass)
    `).bind(
      slug, wineId, stock, price_bottle, price_glass,
      stock, price_bottle, price_glass
    ).run();

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Quick Update Error:", e.message);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
