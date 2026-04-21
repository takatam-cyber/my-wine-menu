export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET() {
  try {
    const db = getRequestContext().env.DB;
    const { results } = await db.prepare("SELECT * FROM wines_master").all();

    if (!results || results.length === 0) throw new Error("データがありません");

    // CSVヘッダーの作成
    const headers = Object.keys(results[0]);
    const csvRows = [headers.join(',')];

    // データの正規化（カンマや改行の処理）
    for (const row of results as any[]) {
      const values = headers.map(h => {
        const val = row[h] === null ? "" : String(row[h]);
        return `"${val.replace(/"/g, '""')}"`; // 引用符で囲み、内部の引用符をエスケープ
      });
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    return new Response(csvString, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="current_wine_master.csv"'
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
