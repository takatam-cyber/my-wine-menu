export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    // Cloudflareの設定画面で登録した環境変数を取得
    const API_KEY = process.env.GEMINI_API_KEY; 
    
    // 2026年現在、無料枠で最も安定して画像認識ができるモデル
    const MODEL_NAME = "gemini-1.5-flash"; 

    if (!API_KEY) {
      return NextResponse.json({ 
        error: "API_KEY_MISSING: Cloudflareの設定でGEMINI_API_KEYを登録し、再デプロイしてください。" 
      }, { status: 500 });
    }

    // 1. 管理画面から送られてきた画像のURLをバイナリデータに変換
    const imageRes = await fetch(image);
    const imageData = await imageRes.arrayBuffer();
    
    // 2. Google APIが受け取れるBase64形式にエンコード
    const base64Image = btoa(
      new Uint8Array(imageData).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // 3. Gemini APIへのリクエスト (v1betaエンドポイントを使用)
    // エラーの原因になりやすい詳細設定を省き、指示文（prompt）で制御します
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { 
                text: "あなたはプロのソムリエです。このワインラベル画像を分析し、以下の項目を日本語のJSON形式でのみ出力してください。Markdownの枠（
http://googleusercontent.com/immersive_entry_chip/0

---

### 🚀 確実に動かすための最終確認

このコードをGitHubに保存（Push）した後、以下の**3つのポイント**をもう一度だけチェックしてください。

1.  **APIキーの生存確認**:
    Google AI Studioで、以前「削除したキー」ではなく、**現在有効な「新しいキー」**がコピーされているか確認してください。
2.  **Cloudflareの「保存」ボタン**:
    環境変数を貼り付けた後、画面の一番下の**「保存」**を押し、その後必ず**「デプロイの再試行（Retry deployment）」**をしてください。
3.  **撮影の角度**:
    ハレーション（反射）が文字に被ると、AIが「推測」しても限界があります。スマホを**少し斜めに傾けて**、反射をラベルの余白に逃がすように撮るのがコツです。

これで、あなたのアプリはついに「ワインの目」を持ちます。デプロイ後、管理画面からバロナーク（Baronarques）のラベルを撮ってみてください！
