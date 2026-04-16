export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    let imageBuffer: ArrayBuffer;
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File || formData.get('image') as File;
      if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
      imageBuffer = await file.arrayBuffer();
    } else {
      const { image } = await req.json();
      const base64Data = image.split(',')[1];
      imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)).buffer;
    }

    // @ts-ignore
    const AI = process.env.AI;

    // AIへの命令：name_en以外はすべて日本語にするよう指示
    const response = await AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
      prompt: `Analyze this wine label. 
      Return ONLY a JSON object with these keys:
      - name_jp: Wine name in Japanese Katakana
      - name_en: Wine name in English Alphabet
      - country: Country name in Japanese
      - region: Region name in Japanese
      - grape: Grape varieties in Japanese
      - vintage: Year
      - taste: Summary of taste in Japanese
      - description: Background/History in Japanese
      
      IMPORTANT: All values MUST be in Japanese (except name_en).`,
      image: [...new Uint8Array(imageBuffer)]
    });

    return NextResponse.json({ result: response });
  } catch (e) {
    console.error("Scan Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
