export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error("CSVファイルが選択されていません。");

    const buffer = await file.arrayBuffer();
    let text = new TextDecoder("utf-8").decode(buffer);
    
    // 文字化け（置換文字）がある場合はShift-JISで再試行
    if (text.includes('\uFFFD')) {
      text = new TextDecoder("shift-jis").decode(buffer);
    }

    text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const rows = text.split('\n').filter(line => line.trim());
    
    // 【修正済】正規表現のリテラルエラーを解消
    const headers = rows[0].split(',').map(h => 
      h.replace(/【\d+†source】/gi, '').replace(/["']/g, '').trim().toLowerCase()
    );
    
    const db = getRequestContext().env.DB;
    const batch = [];
    const idIdx = headers.findIndex(h => h === "id");

    for (let i = 1; i < rows.length; i++) {
      const values: string[] = [];
      let cell = "";
      let inQuote = false;
      const currentRow = rows[i];
      for (let j = 0; j < currentRow.length; j++) {
        const char = currentRow[j];
        if (char === '"') inQuote = !inQuote;
        else if (char === ',' && !inQuote) {
          values.push(cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          cell = "";
        } else cell += char;
      }
      values.push(cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

      const data: any = {};
      headers.forEach((h, idx) => { if (h) data[h] = values[idx] || ""; });
      if (!data.id) continue;

      batch.push(
        db.prepare(`
          INSERT INTO wines_master (id, name_jp, name_en, country, supplier, is_priority, sweetness, body, acidity, tannins)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET name_jp=excluded.name_jp, is_priority=excluded.is_priority
        `).bind(
          data.id, data.name_jp, data.name_en, data.country, data.supplier,
          (data.supplier || "").includes('ピーロート') ? 1 : 0,
          parseFloat(data.sweetness || '0'), parseFloat(data.body || '0'), 
          parseFloat(data.acidity || '0'), parseFloat(data.tannins || '0')
        )
      );
    }
    await db.batch(batch);
    return NextResponse.json({ success: true, count: batch.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
