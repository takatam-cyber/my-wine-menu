// app/api/sommelier/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    const wineContext = wineList.map((w: any) => 
      `- ID:${w.id} | ${w.name_jp} | ¥${w.price_bottle} | 解説:${w.ai_explanation} | 料理:${w.pairing}`
    ).join("\n");

    const systemPrompt = `あなたは銀座の高級レストランで「神の舌」と称される一流ソムリエです。
お客様の言葉の裏にある「本当の望み」を汲み取り、優雅で温かみのある日本語でエスコートしてください。

【接客の指針】
1. 感情に響く言葉: 「お肉に合います」ではなく、「お肉の脂を綺麗に流し、旨味を何倍にも引き立てる、力強くも繊細な酸がございます」と語ってください。
2. 簡潔さと深み: スマホで読みやすいよう、一回の回答は200〜300文字程度に抑えつつ、内容は濃く。
3. カード表示の徹底: 提案するワインのIDを、必ず回答の最後に 【ID:番号】 形式で添えてください。これがないとお勧めカードが表示されません。

提供リスト:
${wineContext}`;

    const llamaRes: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ],
      max_tokens: 600
    });

    return NextResponse.json({ response: llamaRes.response });
  } catch (e) {
    return NextResponse.json({ error: "Sommelier error" }, { status: 500 });
  }
}
