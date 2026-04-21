export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const text = await file.text();
    const rows = text.split('\n').filter(row => row.trim() !== '');
    const headers = rows[0].split(',').map(h => h.trim());
    
    const env = getRequestContext().env;

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(',').map(v => v.trim());
      const data: any = {};
      headers.forEach((h, idx) => { data[h] = values[idx]; });

      // CSVの日本語ヘッダーをDBのカラム名にマッピング
      const wineId = data['ID'];
      if (!wineId) continue;

      // インポーター主導権：自社ワイン(ピーロートなど)なら優先フラグを立てる
      const isPriority = data['仕入先']?.includes('ピーロート') ? 1 : 0;

      await env.DB.prepare(`
        INSERT INTO wines_master (
          id, name_jp, name_en, country, region, grape, color, type, vintage, 
          alcohol, ai_explanation, menu_short, pairing, aroma_features, tags, 
          image_url, is_priority
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name_jp=excluded.name_jp, ai_explanation=excluded.ai_explanation, 
          image_url=excluded.image_url, is_priority=excluded.is_priority
      `).bind(
        wineId, data['ワイン名(日)'], data['ワイン名(英)'], data['生産国'],
        data['地域'], data['主要品種'], data['色'], data['タイプ'], data['ヴィンテージ'],
        data['アルコール'], data['AI解説'], data['メニュー用短文'], data['ペアリング'],
        data['香りの特徴'], data['タグ'], data['画像URL'], isPriority
      ).run();
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
