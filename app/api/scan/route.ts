export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const imageRes = await fetch(image);
    const arrayBuffer = await imageRes.arrayBuffer();

    // @ts-ignore
    const AI = process.env.AI;

    // STEP 1: OCR（視覚情報の抽出）
    const visionResponse = await AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
      prompt: "Scan this wine label and extract the producer, wine name, and vintage precisely.",
      image: [...new Uint8Array(arrayBuffer)]
    });
    const labelText = visionResponse.description || visionResponse;

    // STEP 2: Llama 3.3 70B による「思考モード」ソムリエ分析
    const expertResponse = await AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      temperature: 0.1,
      messages: [
        { 
          role: 'system', 
          content: 'あなたはMaster of Wineの称号を持つ世界最高峰のソムリエです。提供されたテキストからワインを正確に特定し、日本語のJSON形式で専門的な回答を返してください。' 
        },
        { 
          role: 'user', 
          content: `
          ラベルテキスト: "${labelText}"
          上記に基づき、該当するワインを特定して以下のJSON形式でのみ出力してください。
          priceには、日本のレストランでの標準的な提供価格（税込）の予想数値を入れ、
          pairingには最高に合う料理、adviceには「どういう時に選ぶべきか」のアドバイスを。

          {
            "name_jp": "カタカナ正式名称",
            "name_en": "Alphabet Full Name",
            "country": "国",
            "region": "詳細な産地・格付け",
            "grape": "主要品種",
            "vintage": "年",
            "price": "販売価格数値（例: 9800）",
            "pairing": "ペアリング提案（例: 鴨のロースト、バルサミコソースなど）",
            "advice": "選び方のアドバイス（例: 華やかな香りとシルキーな質感を好む方に最適です）",
            "taste": "味わいの専門的解説（2文）",
            "description": "歴史やエピソード（3文）"
          }`
        }
      ]
    });

    return NextResponse.json({ result: expertResponse.response });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
