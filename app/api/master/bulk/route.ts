export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error("No file");

    const buffer = await file.arrayBuffer();
    let text = new TextDecoder("utf-8").decode(buffer);
    // 置換文字が含まれていればShift-JISとして再読込
    if (text.includes('\uFFFD')) text = new TextDecoder("shift-jis").decode(buffer);

    text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const rows = text.split('\n').filter(r => r.trim());
    const headers = rows[0].split(',').map(h => h.replace(/["']/g, '').trim().toLowerCase());
    
    const db = getRequestContext().env.DB;
    const batch = [];
    const idIdx = headers.indexOf("id");

    for (let i = 1; i < rows.length; i++) {
      const values: string[] = [];
      let cell = "", inQuote = false;
      const r = rows[i];
      for (let j = 0; j < r.length; j++) {
        if (r[j] === '"') inQuote = !inQuote;
        else if (r[j] === ',' && !inQuote) { values.push(cell.trim()); cell = ""; }
        else cell += r[j];
      }
      values.push(cell.trim());

      const data: any = {};
      headers.forEach((h, idx) => { data[h] = values[idx]?.replace(/^"|"$/g, '') || ""; });
      if (!data.id) continue;

      batch.push(
        db.prepare(`
          INSERT INTO wines_master (id, name_jp, name_en, country, is_priority, sweetness, body, acidity, tannins, ai_explanation, image_url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET name_jp=excluded.name_jp, is_priority=excluded.is_priority, ai_explanation=excluded.ai_explanation
        `).bind(
          data.id, data.name_jp, data.name_en, data.country,
          (data.supplier || "").includes('ピーロート') ? 1 : 0, // 自社商品を自動識別
          parseFloat(data.sweetness || '0'), parseFloat(data.body || '0'),
          parseFloat(data.acidity || '0'), parseFloat(data.tannins || '0'),
          data.ai_explanation || "", data.image_url || ""
        )
      );
    }
    await db.batch(batch);
    return NextResponse.json({ success: true, count: batch.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
