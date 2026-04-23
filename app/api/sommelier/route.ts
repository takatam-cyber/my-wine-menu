// app/api/sommelier/route.ts
export const runtime = 'edge';

/**
 * ピーロート・ジャパン：次世代AIソムリエ・コンシェルジュ API
 * * 営業戦略: 
 * 1. 在庫があるワインの中から「is_priority=1（至宝）」を最優先でリコメンド。
 * 2. ピーロート独占輸入の希少性と価値を物語（ストーリー）として語らせる。
 * 3. ユーザーの気分に寄り添いつつも、自然な流れでアップセルを狙う。
 */

export async function POST(req: Request) {
  try {
    const { message, history, wineList, storeName, language } = await req.json();

    // Edge Runtime における環境変数取得の互換性確保
    let env: any;
    try {
      // @ts-ignore
      const { getRequestContext } = await import('@cloudflare/next-on-pages');
      env = getRequestContext().env;
    } catch (e) {
      // @ts-ignore
      env = typeof process !== 'undefined' ? process.env : {};
    }

    // 1. 在庫があり、かつ「至宝(Priority)」ワインを最優先に抽出
    const prioritizedWines = wineList
      .filter((w: any) => w.stock > 0)
      .sort((a: any, b: any) => {
        // 至宝フラグを最優先、次に在庫数
        if (b.is_priority !== a.is_priority) return (b.is_priority || 0) - (a.is_priority || 0);
        return (b.stock || 0) - (a.stock || 0);
      })
      .slice(0, 20);

    const wineContext = prioritizedWines.map((w: any) => {
      const name = language === 'en' ? w.name_en : w.name_jp;
      const category = w.is_priority ? '【PIEROTH EXCLUSIVE / PREMIUM SELECTION】' : '【Standard】';
      
      return `
        ${category}
        Name: ${name}
        Price: ¥${w.price_bottle}
        Flavor Profile: Body ${w.body}/5, Sweetness ${w.sweetness}/5, Acidity ${w.acidity}/5, Tannins ${w.tannins}/5
        Sommelier Note: ${w.ai_explanation || 'A fine selection from Pieroth.'}
      `;
    }).join("\n---\n");

    const isEnglish = language === 'en';

    // 2. 「勝手に売れる」ための超強力なセールスプロンプト
    const systemPrompt = isEnglish 
      ? `You are the Elite Sommelier for "${storeName}". 
         Your MISSION: Make the guest fall in love with our "PIEROTH EXCLUSIVE" wines.
         These are direct imports and hidden gems that only we can provide.
         
         【Sales Strategy】
         - Always start by acknowledging the guest's mood/meal with empathy.
         - Suggest at least one "EXCLUSIVE" wine as a "must-try masterpiece".
         - Use evocative language: "velvety," "unforgettable finish," "limited production."
         - If the guest's request matches a priority wine, push it as the ultimate choice.
         
         【Wine Data】
         ${wineContext}`
      : `あなたは「${storeName}」のヘッドソムリエです。
         【最重要ミッション】: ピーロート独占輸入の「PIEROTH EXCLUSIVE（至宝）」ワインをお客様の心に響かせ、注文に繋げること。
         
         【セールス戦略】
         - お客様の気分や料理に深く共感し、その体験を最高にするための一本を提案してください。
         - 「至宝」銘柄は、ピーロートだからこそ提供できる希少性と、職人技が光る逸品であることを情熱的に語ってください。
         - 表現は「絹のような滑らかさ」「幾重にも重なる芳醇な香り」「長く続く優雅な余韻」など、シズル感のある言葉を多用してください。
         - 最大200文字で、品格のある丁寧な日本語（おもてなし）で回答してください。
         
         【本日のセレクト】
         ${wineContext}`;

    let aiResponse = "";
    if (env && env.AI) {
      const res: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: message }
        ],
        temperature: 0.65,
        max_tokens: 1000
      });
      aiResponse = res.response;
    } else {
      aiResponse = isEnglish 
        ? "My apologies, I am currently selecting the finest bottles in the cellar. Please speak to me again in a moment."
        : "失礼いたしました。ただいまセラーにて至極の1本を選定中でございます。恐縮ですが、少々お時間をおいて再度お声がけいただけますでしょうか。";
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      suggestedWines: prioritizedWines.filter(w => w.is_priority === 1).map(w => w.id)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    console.error("Sommelier API Error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
