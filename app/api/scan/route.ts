export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const API_KEY = process.env.GEMINI_API_KEY;

    // JSONモードが安定している v1beta エンドポイントを使用
    const MODEL_NAME = "gemini-1.5-flash";

    if (!API_KEY) {
      return NextResponse.json(
        { error: "APIキーが設定されていません。CloudflareのSecretsを確認してください。" },
        { status: 500 }
      );
    }

    // 1. 画像データの取得
    const imageRes = await fetch(image);
    if (!imageRes.ok) {
      return NextResponse.json({ error: "画像の取得に失敗しました。" }, { status: 400 });
    }
    const imageData = await imageRes.arrayBuffer();

    // 2. Base64変換（Edge Runtime対応）
    const base64Image = Buffer.from(imageData).toString('base64');

    // 3. プロンプト（JSON構造を厳格に指定）
    const promptText = "世界最高のソムリエとして、提供されたワインラベルの画像を分析してください。結果は必ず純粋なJSON形式のみで返し、Markdownの装飾（
