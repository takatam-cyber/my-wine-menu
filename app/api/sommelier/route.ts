// app/api/sommelier/route.ts
export async function POST(req: Request) {
  try {
    const { message, history, wineList } = await req.json();
    const env = getRequestContext().env;

    const wineContext = wineList.map((w: any) => 
      `- ${w.name_jp}(${w.color}/${w.type}): ${w.menu_short}
        [詳細] 香り:${w.aroma_features}, 複雑性:${w.complexity}/5, 余韻:${w.aftertaste}/5, 飲み頃:${w.best_drinking}
        [解説] ${w.ai_explanation}
        [相性] ${w.pairing}`
    ).join("\n");

    const systemPrompt = `あなたは一流ソムリエです。以下のリストから最適な一本を選んでください。リスト外のワインは提案禁止です。\n\n現在のリスト:\n${wineContext}`;
    // ... AI実行処理 ...
  } catch (e) { /* ... */ }
}
