export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function GET() {
  // @ts-ignore
  const { results } = await process.env.DB.prepare("SELECT * FROM wines ORDER BY id DESC").all();
  return NextResponse.json(results);
}
