export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const db = (getRequestContext() as any).env.DB;
    const { results } = await db.prepare(`
      SELECT i.wine_id as id, m.name_jp, i.price_bottle, i.price_glass, i.stock 
      FROM store_inventory i
      JOIN wines_master m ON i.wine_id = m.id
      WHERE i.store_id = (SELECT staff_email FROM store_configs WHERE slug = ?)
    `).bind(params.slug).all();

    const headers = ["id", "name_jp", "price_bottle", "price_glass", "stock"];
    const csvRows = [headers.join(',')];

    results.forEach((row: any) => {
      csvRows.push(`${row.id},"${row.name_jp}",${row.price_bottle},${row.price_glass},${row.stock}`);
    });

    return new Response(csvRows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="inventory_${params.slug}.csv"`
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
