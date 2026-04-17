// app/api/scan/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const env = getRequestContext().env;

    // Workers AIが有効かチェック
    if (!env.AI) {
      return NextResponse.json({ error: "Cloudflare AI bindingが設定されていません。" }, { status: 500 });
    }

    // 1. 画像データのバイナリ化（ArrayBufferへの変換）
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

    // 2. Llama 3.2 Vision を実行
    // CloudflareネイティブのAI実行環境を使用します
    const aiResponse: any = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      prompt: "Analyze this wine label image and extract information. Return ONLY a valid JSON object in Japanese with these keys: name_jp, name_en, country, region, grape, type, vintage, price, advice",
      image: [...new Uint8Array(imageBuffer)],
    });

    // 解析結果のテキストを抽出
    const resultText = aiResponse.description || aiResponse.response || JSON.stringify(aiResponse);
    
    // Markdown装飾が含まれる場合のクリーンアップ処理
    const cleanJson = resultText.replace(/```json|```/g, '').trim();

    return NextResponse.json({ result: cleanJson });
  } catch (e: any) {
    console.error("Llama Scan Error:", e.message);
    return NextResponse.json({ error: "AI解析失敗: " + e.message }, { status: 500 });
  }
}
