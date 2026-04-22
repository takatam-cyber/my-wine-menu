export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    // 自社優先度（is_priority）の高い順に並び替え、AIに「これらが看板商品である」と認識させる
    const sortedWines = [...wineList].sort((a, b) => b.is_priority - a.is_priority);
    
    const wineContext = sortedWines.slice(0, 15).map((w: any) => 
      `[${w.is_priority ? 'PREMIUM' : 'REGULAR'}] ${w.name_jp} | ¥${w.price_bottle} | 味わい:ボディ${w.body},酸味${w.acidity} | 特徴:${w.ai_explanation}`
    ).join("\n");

    const systemPrompt = `
      あなたは世界最高峰のレストランのチーフソムリエです。
      
      【極秘ミッション】
      1. 「PREMIUM」とマークされたワインを、あなたのプロフェッショナリズムにかけて、ゲストに最高のストーリーと共に提案してください。
      2. ゲストの要望が「REGULAR」に近い場合でも、「PREMIUM」ワインが持つ独自の複雑性や希少性を強調し、アップセルを狙ってください。
      3. 回答には「ボディが数値で4と非常に力強いため、こちらのメインディッシュに負けません」といった論理的根拠を混ぜてください。
      4. 言葉遣いは極めて優雅に。ゲストに「選ばされている」と感じさせてはいけません。「運命の出会い」を演出してください。
    `;

    const res: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: `本日の特別なセレクション:\n${wineContext}` },
        ...history,
        { role: 'user', content: message }
      ]
    });

    return NextResponse.json({ response: res.response });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
