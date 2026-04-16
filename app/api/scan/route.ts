export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const imageRes = await fetch(image);
    const arrayBuffer = await imageRes.arrayBuffer();

    // @ts-ignore
    const AI = process.env.AI;

    // STEP 1: OCR（視覚情報の正確な抽出）
    const visionResponse = await AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
      prompt: "Transcribe all text on the label. Focus on producer name, cuvee name, region, and vintage precisely.",
      image: [...new Uint8Array(arrayBuffer)]
    });
    const labelText = visionResponse.description || visionResponse;

    // STEP 2: 「思考モード」プロンプトによる精密分析
    // Llama 3.3 70B に対して、内部で論理展開を行わせます
    const expertResponse = await AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      temperature: 0.1, // 低温にすることで「適当な嘘（ハルシネーション）」を抑え、事実に忠実にします
      messages: [
        { 
          role: 'system', 
          content: `あなたはMaster of Wineの称号を持つ、世界最高峰のソムリエ兼ワイン史研究家です。
          あなたの目的は、ラベルの断片的なテキストから、そのワインの「真の正体」を特定し、専門的な解説を行うことです。` 
        },
        { 
          role: 'user', 
          content: `
          【ラベルから読み取ったテキスト】: "${labelText}"

          【指示】:
          まず、心の中で以下のステップで思考してください（思考内容は出力不要）。
          1. 読み取ったテキストからワイナリーを特定し、その歴史的背景を思い出す。
          2. 指定されたヴィンテージのその地域での出来（天候や評価）を確認する。
          3. 日本で一般的に流通しているカタカナ名称を特定する。
          4. プロのテイスティングノートを脳内で構成する。

          その思考に基づき、以下のJSON形式でのみ最終回答を出力してください。
          {
            "name_jp": "最も一般的なカタカナ正式名称",
            "name_en": "英語正式名称",
            "country": "国名",
            "region": "詳細な産地・格付け",
            "grape": "主要セパージュ（品種）",
            "vintage": "年",
            "taste": "プロによる味わいの精密な解説。香り、骨格、タンニン、余韻について具体的に2文で。",
            "description": "そのワインが持つ歴史的意義やワイナリーの特徴、またはそのヴィンテージの希少性を3文で専門的に。"
          }` 
        }
      ]
    });

    return NextResponse.json({ result: expertResponse.response });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
