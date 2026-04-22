export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET() {
  try {
    const db = (getRequestContext() as any).env.DB;
    const { results } = await db.prepare("SELECT * FROM wines_master ORDER BY id ASC").all();

    if (!results || results.length === 0) throw new Error("データがありません");

    const headers = Object.keys(results[0]);
    const csvRows = [headers.join(',')];

    for (const row of results as any[]) {
      const values = headers.map(h => {
        const val = row[h] === null ? "" : String(row[h]);
        return `"${val.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    return new Response(csvRows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="wine_master_all.csv"'
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
