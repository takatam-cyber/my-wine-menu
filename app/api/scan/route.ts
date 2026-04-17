// app/api/scan/route.ts
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
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      imageBuffer = bytes.buffer;
    }

    const aiResponse: any = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      prompt: `
# Role
あなたは世界最高峰のソムリエ兼データエンジニアです。
ワイン画像を分析し、以下のJSON形式でデータを出力してください。

# Instructions
1. ラベルから文字を読み取り（生産者、銘柄、年、産地）、読み取れない情報は知識から推論して補完してください。
2. 解説はソムリエとして情熱的かつエレガントに日本語で作成してください。
3. 出力は必ず以下の純粋なJSONオブジェクトのみとし、説明文などは一切含めないでください。

# Data Schema
{
  "name_jp": "カタカナ名",
        "name_en": "Alphabet Name",
        "country": "国",
        "region": "産地",
        "grape": "品種",
        "color": "赤/白/ロゼ/泡",
        "type": "フルボディ/辛口など",
        "vintage": "年",
        "price": 5000,
        "cost": 2000,
        "advice": "ソムリエ風の魅力的な解説",
        "aroma": "1-5 (香りの強さ)",
        "pairing": "合う料理",
        "sweetness": "1-5 (甘味)",
        "body": "1-5 (重さ)",
        "acidity": "1-5 (酸味)",
        "tannin": "1-5 (渋み ※白なら0)"
}

# Constraint
- 数値評価は1から5の整数で行ってください。白・泡の場合はtanninは0にしてください。
- priceとcostはカンマを含まない数値のみとしてください。`,
      image: [...new Uint8Array(imageBuffer)],
    });

    // 1. レスポンスの取得（文字列化を確実に行う）
    let resultText = aiResponse.response || aiResponse.description || (typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse));

    // 2. Markdownのコードブロック記号 (```json と ```) を除去
    resultText = resultText.replace(/```json/g, "").replace(/```/g, "").trim();

    // 3. 最も外側の { } を探して切り出す
    const firstBrace = resultText.indexOf('{');
    const lastBrace = resultText.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      console.error("AI Output error:", resultText);
      throw new Error("AIが有効なJSONを作成できませんでした。");
    }
    
    const cleanJson = resultText.substring(firstBrace, lastBrace + 1);

    // 4. JSONとして成立するか最終確認
    try {
      JSON.parse(cleanJson);
    } catch (e) {
      console.error("JSON Parse Error:", cleanJson);
      throw new Error("解析データが破損しています。もう一度お試しください。");
    }

    return NextResponse.json({ result: cleanJson });
  } catch (e: any) {
    console.error("Scan API Error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
