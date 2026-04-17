export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const env = getRequestContext().env;

    let imageBuffer: ArrayBuffer;
    if (image.startsWith('http')) {
      const imgRes = await fetch(image);
      imageBuffer = await imgRes.arrayBuffer();
    } else {
      const base64String = image.replace(/^data:image\/\w+;base64,/, "");
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      imageBuffer = bytes.buffer;
    }

    const aiResponse: any = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      prompt: `
# Role
あなたは世界最高峰のソムリエであり、同時に画像解析とデータ構造化のエキスパートです。
与えられたワインボトルの画像を詳細に分析し、以下のJSONフォーマットに従って情報を抽出・推論してください。

# Instructions
1. OCR解析: ラベルの文字を正確に読み取ってください。
2. 知識ベースの補完: 不足情報はあなたの知識から推論して補完してください。
3. 出力形式: 必ず純粋なJSONのみを出力し、説明テキストは含めないでください。

# Data Schema
{
  "name_jp": "カタカナ名",
  "name_en": "Alphabet Name",
  "country": "国",
  "region": "産地 (Appellation)",
  "grape": "主要な品種",
  "color": "赤/白/ロゼ/泡",
  "type": "フルボディ/辛口など",
  "vintage": "4桁の年号",
  "price": 5000,
  "cost": 3500,
  "advice": "ソムリエ視点での魅力的な解説文章（200文字程度）",
  "aroma": "1-5", "pairing": "合う料理名", "sweetness": "1-5", "body": "1-5", "acidity": "1-5", "tannin": "1-5"
}`,
      image: [...new Uint8Array(imageBuffer)],
    });

    let resultText = aiResponse.response || aiResponse.description || JSON.stringify(aiResponse);
    const firstBrace = resultText.indexOf('{');
    const lastBrace = resultText.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      return NextResponse.json({ result: "{}" }); // 失敗時は空のJSONを返す
    }
    
    const cleanJson = resultText.substring(firstBrace, lastBrace + 1);
    return NextResponse.json({ result: cleanJson });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, result: "{}" }, { status: 200 });
  }
}
