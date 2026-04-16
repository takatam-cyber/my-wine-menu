export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "No image" }, { status: 400 });

    const imageRes = await fetch(image);
    const arrayBuffer = await imageRes.arrayBuffer();

    // @ts-ignore
    const AI = process.env.AI;

    // --- STEP 1: 画像から文字を正確に読み取る (Llava) ---
    const visionResponse = await AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
      prompt: "Transcribe every detail from this wine label, including producer, cuvee name, and vintage, into a single line of text.",
      image: [...new Uint8Array(arrayBuffer)]
    });
    const labelText = visionResponse.description || visionResponse;
    console.log("Extracted Label Text:", labelText);

    // --- STEP 2: Llama 3.3 70B による精密サーチ・分析 ---
    // これが「ネット検索」に近い正確さを生み出します
    const expertResponse = await AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { 
          role: 'system', 
          content: 'あなたは世界最高峰のソムリエです。提供されたテキストからワインを特定し、日本語のJSON形式で正確なデータを返してください。' 
        },
        { 
          role: 'user', 
          content: `ラベルテキスト: "${labelText}"
          
          上記の情報に基づき、該当するワインを特定して、以下のJSON形式でのみ出力してください（全て日本語、name_enのみ英語）。
          {
            "name_jp": "ワインのカタカナ名",
            "name_en": "Alphabet Name (English)",
            "country": "国名 (日本語)",
            "region": "産地 (日本語)",
            "grape": "品種 (日本語)",
            "vintage": "年 (数字のみ)",
            "taste": "プロの視点での味わい解説（日本語2文）",
            "description": "ワインの歴史、格付け、背景（日本語3文）"
          }
          ※注意: JSON以外の挨拶や解説は一切含めないでください。` 
        }
      ]
    });

    return NextResponse.json({ result: expertResponse.response });
  } catch (e) {
    console.error("Scan Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
