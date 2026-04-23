// app/api/master/bulk/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * 日本のExcelユーザー向け：堅牢なCSV一括インポート
 * - カンマ入りのダブルクォート囲みを厳密に解析
 * - Shift-JIS / UTF-8 / UTF-8 BOM の自動判別
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error("CSVファイルが添付されていません。");

    const buffer = await file.arrayBuffer();
    
    // 【重要】文字コード自動判別ロジック
    let text = new TextDecoder("utf-8").decode(buffer);
    // UTF-8デコードで置換文字()が含まれる場合、Shift-JISとして再試行
    if (text.includes('\uFFFD')) {
      text = new TextDecoder("shift-jis").decode(buffer);
    }
    
    // クレンジング：BOM(U+FEFF)削除と改行コードの統一
    text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const rows = text.split('\n').filter(line => line.trim());
    if (rows.length < 2) throw new Error("CSVに有効なデータ行が含まれていません。");

    // ヘッダー解析（小文字化・スペース・引用符除去）
    const headers = rows[0].split(',').map(h => 
      h.trim().toLowerCase().replace(/["']/g, '')
    );
    
    const db = (getRequestContext() as any).env.DB;
    const batch = [];
    
    for (let i = 1; i < rows.length; i++) {
      const values: string[] = [];
      let cell = "";
      let inQuote = false;
      const currentRow = rows[i];
      
      // RFC4180準拠のCSVパースロジック（引用符内のカンマを保護）
      for (let j = 0; j < currentRow.length; j++) {
        const char = currentRow[j];
        if (char === '"') {
          // ダブルクォートの連続はエスケープされたダブルクォートとして扱う
          if (inQuote && currentRow[j + 1] === '"') {
            cell += '"';
            j++; 
          } else {
            inQuote = !inQuote;
          }
        } else if (char === ',' && !inQuote) {
          values.push(cell.trim());
          cell = "";
        } else {
          cell += char;
        }
      }
      values.push(cell.trim());

      const data: any = {};
      headers.forEach((h, idx) => { 
        if (h) data[h] = values[idx] || ""; 
      });

      if (!data.id) continue;

      const getInt = (key: string) => {
        const v = parseInt(data[key]);
        return isNaN(v) ? 0 : v;
      };

      // 優先度判定：入力CSVの 'visible' カラムが 'ON' または '1' なら優先(1)とする
      const isPriority = (data.visible === "ON" || data.visible === "1" || data.is_priority === "1" || data.id.toString().startsWith('P-')) ? 1 : 0;

      batch.push(
        db.prepare(`
          INSERT INTO wines_master (
            id, name_jp, name_en, country, region, grape, color, type, vintage, 
            alcohol, ai_explanation, menu_short, pairing, aroma_features, tags, 
            best_drinking, image_url, is_priority, sweetness, body, acidity, tannins,
            aroma_intensity, complexity, finish, oak
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name_jp=excluded.name_jp, name_en=excluded.name_en, country=excluded.country,
            region=excluded.region, grape=excluded.grape, color=excluded.color,
            type=excluded.type, vintage=excluded.vintage, alcohol=excluded.alcohol,
            ai_explanation=excluded.ai_explanation, menu_short=excluded.menu_short,
            pairing=excluded.pairing, aroma_features=excluded.aroma_features,
            tags=excluded.tags, best_drinking=excluded.best_drinking,
            image_url=excluded.image_url, is_priority=excluded.is_priority,
            sweetness=excluded.sweetness, body=excluded.body, acidity=excluded.acidity,
            tannins=excluded.tannins, aroma_intensity=excluded.aroma_intensity,
            complexity=excluded.complexity, finish=excluded.finish, oak=excluded.oak
        `).bind(
          data.id, data.name_jp, data.name_en, data.country, data.region, data.grape, 
          data.color, data.type, data.vintage, data.alcohol, data.ai_explanation, 
          data.menu_short, data.pairing, data.aroma_features, data.tags, 
          data.best_drinking, data.image_url, isPriority, 
          getInt('sweetness'), getInt('body'), getInt('acidity'), getInt('tannins'),
          getInt('aroma_intensity'), getInt('complexity'), getInt('finish'), getInt('oak')
        )
      );
    }

    if (batch.length > 0) {
      await db.batch(batch);
    }
    
    return NextResponse.json({ success: true, count: batch.length });
  } catch (e: any) { 
    console.error("Master import error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 }); 
  }
}
