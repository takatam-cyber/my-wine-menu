// app/api/ai/sommelier/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * Cloudflare Workers AI を使用したソムリエ提案API
 * 1. 店舗の現在の在庫(D1)を取得
 * 2. ユーザーの要望と在庫リストをAIに渡す
 * 3. 最適な3本を理由付きで回答させる
 */
export async function POST(req: Request) {
  try {
    const { slug, query } = await req.json();
    const env = getRequestContext().env;

    // 1. その店舗の在庫ありワインを全て取得
    const { results: wines } = await env.DB.prepare(`
      SELECT 
        m.name_jp, m.country, m.color, m.grape, m.body, m.sweetness, m.ai_explanation
      FROM store_inventory i
      JOIN wines_master m ON i.wine_id = m.id
      WHERE i.store_slug = ? AND i.is_visible = 1 AND i.stock > 0
    `).bind(slug).all();

    if (!wines || wines.length === 0) {
      return NextResponse.json({ 
        answer: "申し訳ございません。現在ご提案できるワインの在庫がございません。" 
      });
    }

    // 2. AIへのプロンプト作成
    // Cloudflare Workers AI (@cf/meta/llama-3-8b-instruct 等) を使用
    const wineListContext = wines.map(w => 
      `- ${w.name_jp} (${w.color}, ${w.country}, 品種:${w.grape}, ボディ:${w.body}/5): ${w.ai_explanation}`
    ).join('\n');

    const systemPrompt = `
      あなたはピーロート・ジャパンの高級ワインソムリエです。
      提供された【在庫リスト】の中から、お客様の【リクエスト】に最も合うワインを最大3本選び、提案してください。
      
      ルール:
      - 必ず【在庫リスト】にあるワインから選んでください。
      - 親しみやすくもプロフェッショナルな日本語で回答してください。
      - 各ワインについて、なぜ選んだのか（マリアージュの理由）を簡潔に説明してください。
      - 最後に「素敵なひとときをお過ごしください」と添えてください。
    `;

    const userPrompt = `
      【リクエスト】: ${query}
      
      【在庫リスト】:
      ${wineListContext}
    `;

    // 3. Cloudflare Workers AI 実行
    const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    return NextResponse.json({ answer: aiResponse.response });
  } catch (e: any) {
    console.error("AI Sommelier Error:", e.message);
    return NextResponse.json({ error: "AIソムリエが席を外しております。後ほどお試しください。" }, { status: 500 });
  }
}
