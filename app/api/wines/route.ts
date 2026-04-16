export const runtime = 'edge';
import { NextResponse } from 'next/server';

// 認証チェック関数
const verifyStore = async (req: Request, KV: any) => {
  const storeId = req.headers.get('x-store-id');
  const password = req.headers.get('x-store-password');
  if (!storeId || !password) return null;

  // 実際はここで「店舗情報のKV」を確認するが、
  // 初回は「ログインしたパスワード」をその店舗の正解として保存する仕組みに
  const savedPass = await KV.get(`auth:${storeId}`);
  if (!savedPass) {
    await KV.put(`auth:${storeId}`, password); // 初回登録
    return storeId;
  }
  return savedPass === password ? storeId : null;
};

export async function GET(req: Request) {
  // @ts-ignore
  const KV = process.env.WINE_KV;
  const url = new URL(req.url);
  const storeId = url.searchParams.get('storeId'); // 公開メニュー用
  
  // 管理画面からのアクセスの場合は認証を確認
  const authStoreId = await verifyStore(req, KV);
  const targetId = authStoreId || storeId;

  if (!targetId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const list = await KV.list({ prefix: `data:${targetId}:` });
  const wines = await Promise.all(
    list.keys.map(async (k: any) => JSON.parse(await KV.get(k.name)))
  );
  return NextResponse.json(wines.sort((a, b) => Number(a.id) - Number(b.id)));
}

export async function POST(req: Request) {
  // @ts-ignore
  const KV = process.env.WINE_KV;
  const authStoreId = await verifyStore(req, KV);
  if (!authStoreId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wine = await req.json();
  let id = wine.id;

  // 新規登録時の連番生成
  if (!id) {
    const list = await KV.list({ prefix: `data:${authStoreId}:` });
    const ids = list.keys.map((k: any) => parseInt(k.name.split(':').pop())).filter((n: any) => !isNaN(n));
    id = String((ids.length > 0 ? Math.max(...ids) : 0) + 1);
  }

  const wineData = { ...wine, id };
  await KV.put(`data:${authStoreId}:${id}`, JSON.stringify(wineData));
  return NextResponse.json({ success: true, id });
}

export async function DELETE(req: Request) {
  // @ts-ignore
  const KV = process.env.WINE_KV;
  const authStoreId = await verifyStore(req, KV);
  if (!authStoreId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await KV.delete(`data:${authStoreId}:${id}`);
  return NextResponse.json({ success: true });
}
