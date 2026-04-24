// app/api/ai/sommelier/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * ピーロート・ソムリエ AI ロジック
 * プロンプトを大幅に強化し、単なる検索機ではなく「おもてなしの専門家」に変貌させました。
 */
export async function POST(req: Request) {
  try {
    const { slug, query } = await req.json();
    const env = getRequestContext().env;

    const { results: wines } = await env.DB.prepare(`
      SELECT 
        m.name_jp, m.country, m.color, m.grape, m.body, m.sweetness, m.ai_explanation, m.vintage
      FROM store_inventory i
      JOIN wines_master m ON i.wine_id = m.id
      WHERE i.store_slug = ? AND i.is_visible = 1 AND i.stock > 0
    `).bind(slug).all();

    if (!wines || wines.length === 0) {
      return NextResponse.json({ 
        answer: "誠に申し訳ございません。あいにく現在、ご案内できるワインを切らしておりまして…。新入荷まで今しばらくお待ちいただけますでしょうか。" 
      });
    }

    const wineListContext = wines.map(w => 
      `- ${w.name_jp} (${w.vintage}, ${w.color}, ${w.country}, ボディ:${w.body}/5): ${w.ai_explanation}`
    ).join('\n');

    const systemPrompt = `
      あなたはピーロート・ジャパンが誇る、世界トップクラスのシニアソムリエです。
      お客様は洗練された審美眼を持つエグゼクティブであることを常に念頭に置き、最上級のホスピタリティで接してください。

      【基本姿勢】
      - 冒頭でお客様のご要望に対する深い理解を示してください。
      - 専門用語を使いつつも、初心者にも分かりやすい優雅な表現を用いてください。
      - 回答は「在庫リスト」の中から、お客様の要望に完璧に合致するものを1〜3本厳選してください。

      【提案の構成】
      1. お客様への挨拶と要望の肯定。
      2. 各ワインの紹介: 単なるスペックではなく、「香り、味わい、そしてストーリー」を語ってください。
      3. マリアージュの提案: どのような料理、またはどのようなシーンに相応しいかを具体的にイメージさせてください。
      4. 結び: お客様のディナーやひとときが輝くことを願う言葉を添えてください。

      【在庫リスト】の中から選ぶことを絶対に守ってください。
      
      それでは、ソムリエとして最高のご案内をお願いします。
    `;

    const userPrompt = `
      【リクエスト】: ${query}
      
      【在庫リスト】:
      ${wineListContext}
    `;

    const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    return NextResponse.json({ answer: aiResponse.response });
  } catch (e: any) {
    console.error("AI Sommelier Error:", e.message);
    return NextResponse.json({ error: "誠に恐縮ながら、現在ソムリエが他の接客にあたっております。少々お時間をおいてお声がけいただけますでしょうか。" }, { status: 500 });
  }
}
