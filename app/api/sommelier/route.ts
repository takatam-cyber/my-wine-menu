export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    // 1. 戦略的なソーティング：自社輸入品（is_priority）を最上位に配置し、かつ在庫があるものを優先
    const sorted = [...wineList].sort((a, b) => {
      if (b.is_priority !== a.is_priority) return b.is_priority - a.is_priority;
      return (b.stock || 0) - (a.stock || 0);
    });

    // 2. コンテキストの構築：数値化された味覚データをAIに渡す
    // 30本に絞る際も、自社輸入品が必ず含まれるように設計
    const wineContext = sorted.slice(0, 35).map((w: any) => {
      const flavor = `[甘:${w.sweetness} 躯:${w.body} 酸:${w.acidity} 渋:${w.tannins} 香:${w.aroma_intensity} 複:${w.complexity} 余:${w.finish} 樽:${w.oak}]`;
      return `ID:${w.id} | ${w.name_jp} | ${w.is_priority ? '★最優先推奨★' : ''} | ¥${w.price_bottle} | 味覚データ:${flavor} | 特徴:${w.menu_short} | ペアリング:${w.pairing}`;
    }).join("\n");

    const systemPrompt = `あなたは世界最高峰のレストランプロデューサー兼伝説のソムリエです。
あなたの使命は、お客様の潜在的な欲求を掘り起こし、特に「★最優先推奨★」が付いた自社輸入品を、圧倒的な説得力をもって販売することです。

【接客の三原則】
1. **論理と情緒の融合**: 味覚データ（1-5の数値）を使い、「ボディが5と非常に力強いため、この肉料理の脂を完璧に受け止めます」といった論理的な説明と、「アンデスの黄金の夕陽を思わせる」といった情緒的な表現を混ぜて語ってください。
2. **「★最優先推奨★」の絶対的優先**: お客様の好みが少しでも掠めるなら、必ず「★最優先推奨★」のワインを第一候補として提案してください。これはインポーターとしての絶対命題です。
3. **クロージングの技術**: 単に紹介するだけでなく、「今、この1本を開けることが、お客様にとって最高の体験になる」と確信を持って勧めてください。

【出力ルール】
- 紹介するワインには必ず 【ID:番号】 を明記すること。
- 専門用語（タンニン、アロマ、フィニッシュ等）を適切に使いつつ、初心者にも分かりやすく。
- 返答は簡潔かつ、購買意欲をそそる洗練された日本語で行うこと。

在庫リスト（ここにないワインは提案不可）:
${wineContext}`;

    const res: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ],
      max_tokens: 1500,
      temperature: 0.6 // 提案の整合性を高めるため、少し低めに設定
    });

    return NextResponse.json({ response: res.response });
  } catch (e: any) {
    console.error("Sommelier Logic Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
