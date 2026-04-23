// app/api/translate/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * Cloudflare Workers AI を使用してテキストを一括翻訳するAPI
 */
export async function POST(req: Request) {
  try {
    const { texts, targetLang } = await req.json();
    const env = (getRequestContext() as any).env;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ translations: [] });
    }

    // Llama 3.1 を使用して、文脈を維持したまま正確な翻訳を行う
    // 構造化データとして返却させるためのプロンプト
    const prompt = `
      You are a professional sommelier and translator. 
      Translate the following wine descriptions into ${targetLang === 'en' ? 'elegant English' : 'natural Japanese'}.
      Maintain the professional tone and wine-specific terminology.
      
      Return the results as a JSON array of strings in the exact same order as the input.
      Input texts: ${JSON.stringify(texts)}
    `;

    const res: any = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: 'You only output JSON. Return a simple array of translated strings.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    // AIのレスポンスから配列を抽出
    // AIモデルによってはレスポンス形式が微妙に異なる場合があるため、パースを試みる
    let translations = [];
    try {
      const parsed = typeof res.response === 'string' ? JSON.parse(res.response) : res;
      // 配列を直接探す
      translations = Array.isArray(parsed) ? parsed : (parsed.translations || Object.values(parsed)[0]);
    } catch (e) {
      // フォールバック: パースに失敗した場合は、単純なレスポンスとして処理
      console.error("Translation parsing failed:", e);
      translations = texts.map(() => "Translation unavailable");
    }

    return NextResponse.json({ translations });
  } catch (e: any) {
    console.error("Translation API error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
