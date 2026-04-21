"use client";
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    // --- 1. インテリジェント・フィルタリング ---
    // 1,000銘柄以上ある場合、すべてをAIに渡すと精度が落ちるため、
    // インポーターの「意志（優先商品）」と「店舗の在庫」を組み合わせて最適化します。
    
    const priorityWines = wineList.filter((w: any) => w.is_priority === 1);
    const regularWines = wineList.filter((w: any) => w.is_priority !== 1);

    // AIに渡す情報の優先順位：1.自社優先品(★) 2.通常在庫品
    // 合計30〜40件程度に集約することで、AIの理解力と回答速度を最大化します。
    const contextWines = [
      ...priorityWines.slice(0, 15), 
      ...regularWines.slice(0, 20)
    ].map((w: any) => 
      `ID:${w.id} | 名称:${w.name_jp} | 国:${w.country} | 品種:${w.grape} | 味わい:${w.type} | 価格:¥${w.price_bottle} | 解説:${w.ai_explanation} | 料理:${w.pairing} ${w.is_priority ? '(★最優先推奨アイテム)' : ''}`
    ).join("\n");

    // --- 2. プロフェッショナル・システムプロンプト ---
    const systemPrompt = `あなたは世界最高峰のレストランプロデューサー兼、伝説のソムリエです。
あなたの使命は、100店舗以上の取引先を持つ一流インポーターの代理人として、お客様の要望に応えつつ、
「★最優先推奨アイテム」に指定されたワインを最高のストーリーと共に提案し、売上を最大化することです。

【接客の鉄則】
1. **物語で魅了せよ**: 単なるスペック（産地や価格）ではなく、そのワインが持つ「情景」や「造り手の情熱」を語ってください。
2. **優先商品の戦略的推奨**: ユーザーの好みに少しでも掠めるなら、必ず「★最優先推奨アイテム」から1本は含めてください。それを「お客様の今夜を完璧にする運命の1本」として紹介してください。
3. **具体的なペアリング**: 料理名が出た場合は、その料理の脂、酸、スパイスと、提案するワインの要素がどう「結婚（マリアージュ）」するかを論理的に語ってください。
4. **UI連携の厳守**: 提案するワインの最後には必ず 【ID:番号】 を付与してください。これによりシステムが商品カードを表示します。
5. **簡潔かつ優雅に**: 長文になりすぎず、かつ知性と品格を感じさせる日本語（敬語）で対応してください。

【現在の提供可能リスト】
${contextWines}`;

    // --- 3. AIエンジンの実行 ---
    // Llama 3.1 8B Instructを使用（高速かつ日本語対応力が高い）
    const res: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ],
      max_tokens: 1500,
      temperature: 0.7, // 提案の創造性と正確性のバランス
    });

    if (!res || !res.response) {
      throw new Error("AI engine failed to respond.");
    }

    return NextResponse.json({ response: res.response });

  } catch (e: any) {
    console.error("Sommelier AI Error:", e);
    return NextResponse.json({ 
      error: "申し訳ございません。現在、ソムリエがセラーでワインを選定しております。少々お時間を空けてから再度お声がけください。",
      details: e.message 
    }, { status: 500 });
  }
}
