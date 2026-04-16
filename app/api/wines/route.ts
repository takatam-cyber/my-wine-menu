export const runtime = 'edge';
import { NextResponse } from 'next/server';

const verifyStore = async (req: Request, KV: any) => {
  const storeId = req.headers.get('x-store-id');
  const password = req.headers.get('x-store-password');
  if (!storeId || !password) return null;

  const savedPass = await KV.get(`auth:${storeId}`);
  if (!savedPass) {
    await KV.put(`auth:${storeId}`, password); // 初回ログイン時にパスワードを確定
    return storeId;
  }
  return savedPass === password ? storeId : null;
};

export async function GET(req: Request) {
  // @ts-ignore
  const KV = process.env.WINE_KV;
  const url = new URL(req.url);
  const storeIdFromQuery = url.searchParams.get('storeId'); // 公開メニュー用
  const authStoreId = await verifyStore(req, KV); // 管理画面用
  
  const targetId = authStoreId || storeIdFromQuery;
  if (!targetId) return NextResponse.json([], { status: 401 });

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

  if (!id || id.length > 5) {
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
