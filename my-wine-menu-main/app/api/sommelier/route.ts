export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    // @ts-ignore
    const response = await process.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: 'あなたは一流のソムリエです。必ず日本語で、親切かつエレガントに回答してください。専門用語は分かりやすく解説してください。' },
        ...history,
        { role: 'user', content: message }
      ]
    });

    return NextResponse.json({ response: response.response });
  } catch (e) {
    return NextResponse.json({ error: "Sommelier is busy" }, { status: 500 });
  }
}
