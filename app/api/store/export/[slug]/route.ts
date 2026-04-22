// app/api/store/export/[slug]/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const db = getRequestContext().env.DB;

    // store_inventoryにマスターデータを紐付けて全項目取得
    const { results } = await db.prepare(`
      SELECT 
        m.id, m.name_jp, m.country, 
        i.price_bottle, i.price_glass, i.stock, i.is_visible
      FROM store_inventory i
      JOIN wines_master m ON i.wine_id = m.id
      WHERE i.store_slug = ?
      ORDER BY m.id ASC
    `).bind(slug).all();

    if (!results || results.length === 0) {
      // 在庫がない場合はテンプレート的にマスターから数件出すか、空で返す
      return NextResponse.json({ error: "データがありません。先にマスターから追加してください。" }, { status: 404 });
    }

    const headers = ["id", "name_jp", "country", "price_bottle", "price_glass", "stock", "is_visible"];
    const csvRows = [headers.join(',')];

    results.forEach((row: any) => {
      const values = headers.map(h => {
        const val = row[h] === null ? "" : String(row[h]);
        return `"${val.replace(/"/g, '""')}"`; // CSVエスケープ
      });
      csvRows.push(values.join(','));
    });

    // 日本のExcelのためにBOM(Byte Order Mark)を付与してUTF-8で返す
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const csvContent = csvRows.join('\r\n');
    const blob = new Blob([bom, csvContent], { type: 'text/csv; charset=utf-8' });

    return new Response(blob, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="inventory_${slug}.csv"`
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
