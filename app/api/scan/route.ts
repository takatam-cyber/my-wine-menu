export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const imageRes = await fetch(image);
    const arrayBuffer = await imageRes.arrayBuffer();

    // @ts-ignore
    const AI = process.env.AI;

    // --- STEP 1: OCR（ラベルの文字を正確に読み取る） ---
    const visionResponse = await AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
      prompt: "List all text visible on this wine label, especially the producer, name, and vintage.",
      image: [...new Uint8Array(arrayBuffer)]
    });
    const extractedText = visionResponse.description || visionResponse;

    // --- STEP 2: EXPERT ANALYSIS（巨大な知識モデルで検索・分析） ---
    // ここでCloudflare最高峰の『Llama 3.1 70B』にバトンタッチします
    const expertResponse = await AI.run('@cf/meta/llama-3.1-70b-instruct', {
      messages: [
        { role: 'system', content: 'あなたは世界最高峰のソムリエです。提供されたラベル情報から、正確なワインデータを日本語のJSON形式で提供してください。' },
        { role: 'user', content: `
          以下のワインラベルから読み取られたテキストに基づき、正確な情報を特定してください。
          ラベルテキスト: "${extractedText}"

          以下のJSON形式で出力してください（日本語で）。
          {
            "name_jp": "カタカナ名",
            "name_en": "アルファベット名",
            "country": "国（日本語）",
            "region": "産地（日本語）",
            "grape": "品種（日本語）",
            "vintage": "年（数字）",
            "taste": "プロによる味わいの解説（日本語2文）",
            "description": "歴史や特徴（日本語3文）"
          }
          ※注意：JSONのみを出力し、解説は不要です。` 
        }
      ]
    });

    return NextResponse.json({ result: expertResponse.response });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
