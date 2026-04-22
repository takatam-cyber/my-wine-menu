export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error("ファイルが見つかりません。");

    let text = await file.text();
    
    // 【対策1】BOM（目に見えないゴミ）と特殊な改行を完全に除去
    text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const rows = text.split('\n').filter(line => line.trim());
    if (rows.length < 2) throw new Error("CSVに有効なデータ行がありません。");

    // 【対策2】ヘッダーの「超」クレンジング
    // などのタグをどこにあっても除去し、引用符や空白を完全に消す
    const rawHeaders = rows[0].split(',');
    const headers = rawHeaders.map(h => 
      h.replace(/\/gi, '') // Geminiのタグを除去
       .replace(/["']/g, '')              // 引用符を除去
       .trim()                             // 前後の空白を除去
    );

    const db = getRequestContext().env.DB;
    const batch = [];

    // 【対策3】ID列を「大文字小文字・位置を問わず」探し出す
    const idIdx = headers.findIndex(h => h.toUpperCase() === "ID");
    if (idIdx === -1) {
      throw new Error(`「ID」という名前の列が見つかりません。システムが認識したヘッダー: ${headers.join(' / ')}`);
    }

    for (let i = 1; i < rows.length; i++) {
      // 引用符内のカンマを保護する高度なパース
      const values: string[] = [];
      let cell = "";
      let inQuote = false;
      const currentRow = rows[i];
      
      for (let j = 0; j < currentRow.length; j++) {
        const char = currentRow[j];
        if (char === '"') inQuote = !inQuote;
        else if (char === ',' && !inQuote) {
          values.push(cell.trim().replace(/^"|"$/g, ''));
          cell = "";
        } else cell += char;
      }
      values.push(cell.trim().replace(/^"|"$/g, ''));

      // データのマッピング（ヘッダー名でアクセスしやすくする）
      const data: any = {};
      headers.forEach((h, idx) => { if (h) data[h] = values[idx] || ""; });

      const wineId = values[idIdx]; // ID列の値を直接取得
      if (!wineId) continue;

      // 各数値データの取得（列名が変わっても対応できるように予備を設ける）
      const getNum = (key: string) => {
        const val = parseFloat(data[key]);
        return isNaN(val) ? 0 : val;
      };

      batch.push(
        db.prepare(`
          INSERT INTO wines_master (
            id, name_jp, name_en, country, region, grape, color, type, vintage, 
            alcohol, ai_explanation, menu_short, pairing, aroma_features, tags, 
            image_url, is_priority, sweetness, body, acidity, tannins, 
            aroma_intensity, complexity, finish, oak
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name_jp=excluded.name_jp, ai_explanation=excluded.ai_explanation,
            image_url=excluded.image_url, is_priority=excluded.is_priority,
            pairing=excluded.pairing, sweetness=excluded.sweetness, body=excluded.body,
            acidity=excluded.acidity, tannins=excluded.tannins
        `).bind(
          wineId, 
          data['ワイン名(日)'] || "", 
          data['ワイン名(英)'] || "", 
          data['生産国'] || "",
          data['地域'] || "", 
          data['主要品種'] || "", 
          data['色'] || "", 
          data['タイプ'] || "", 
          data['ヴィンテージ'] || "",
          data['アルコール'] || "", 
          data['AI解説'] || "", 
          data['メニュー用短文'] || "", 
          data['ペアリング'] || "",
          data['香りの特徴'] || "", 
          data['タグ'] || "", 
          data['画像URL'] || "", 
          (data['仕入先'] || "").includes('ピーロート') ? 1 : 0,
          getNum('甘味'), getNum('ボディ'), getNum('酸味'), getNum('渋み'),
          getNum('香り強'), getNum('複雑性'), getNum('余韻'), getNum('樽感')
        )
      );
    }

    if (batch.length === 0) throw new Error("取り込み可能なデータが0件でした。");

    await db.batch(batch);
    return NextResponse.json({ success: true, count: batch.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
