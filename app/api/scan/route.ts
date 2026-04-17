// app/api/scan/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const env = getRequestContext().env;

    // 画像データのバイナリ化処理
    let imageBuffer: ArrayBuffer;
    if (image.startsWith('http')) {
      const imgRes = await fetch(image);
      imageBuffer = await imgRes.arrayBuffer();
    } else {
      const base64String = image.replace(/^data:image\/\w+;base64,/, "");
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      imageBuffer = bytes.buffer;
    }

    // 指定された詳細なソムリエ・プロンプトを統合
    const aiResponse: any = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      prompt: `
# Role
あなたは世界最高峰のソムリエであり、同時に画像解析とデータ構造化のエキスパートです。
与えられたワインボトルの画像を詳細に分析し、以下のJSONフォーマットに従って情報を抽出・推論してください。

# Instructions
1. **OCR解析**: ラベルに記載されているテキスト（生産者名、銘柄、ヴィンテージ、産地、格付け等）を正確に読み取ってください。
2. **知識ベースの補完**: 画像から直接読み取れない情報（品種、タイプ、推定価格、味わいの数値評価）については、あなたの膨大なワイン知識ベースから、該当する銘柄・ヴィンテージの標準的なデータを推論して補完してください。
3. **ソムリエ・アドバイス**: プロのソムリエとして、そのワインの背景、テロワール、造り手のこだわりを含めた魅力的な解説を生成してください。
4. **出力形式**: 必ず純粋なJSON形式のみを出力し、それ以外の説明テキストは含めないでください。

# Data Schema
{
  "name_jp": "カタカナ名",
  "name_en": "Alphabet Name",
  "country": "国",
  "region": "産地 (Appellation)",
  "grape": "主要な品種（複数ある場合はカンマ区切り）",
  "color": "赤/白/ロゼ/泡",
  "type": "ボディ・味わいのタイプ (例: フルボディ, 辛口)",
  "vintage": "4桁の年号 (不明な場合は null)",
  "price": "日本国内での推定市場販売価格 (数値のみ)",
  "cost": "推定仕入価格 (priceの約60-70%を目安とした数値)",
  "advice": "ソムリエ視点での魅力的な解説文章（200文字程度）",
  "aroma": "1-5の評価 (香りの強さ)",
  "pairing": "相性の良い具体的な料理名",
  "sweetness": "1-5の評価 (甘味)",
  "body": "1-5の評価 (重さ)",
  "acidity": "1-5の評価 (酸味)",
  "tannin": "1-5の評価 (渋み ※白・泡なら0)"
}

# Constraint
- 数値評価（1-5）は、そのワインのカテゴリ（例：ピノ・ノワールならその中での相対評価）に基づいて厳密に行ってください。
- もし画像から判別が不可能で、かつ知識ベースにもない場合は "Unknown" または null としてください。`,
      image: [...new Uint8Array(imageBuffer)],
    });

    // レスポンスからJSON文字列を抽出する成功ロジック
    let resultText = aiResponse.response || aiResponse.description || JSON.stringify(aiResponse);
    const firstBrace = resultText.indexOf('{');
    const lastBrace = resultText.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("AI could not generate a valid JSON.");
    }
    
    const cleanJson = resultText.substring(firstBrace, lastBrace + 1);

    return NextResponse.json({ result: cleanJson });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
