export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function GET() {
  // システムが100%認識できる「黄金のヘッダー」
  const header = "id,name_jp,name_en,country,region,grape,color,type,vintage,alcohol,price_bottle,price_glass,cost,stock,ideal_stock,supplier,storage,ai_explanation,menu_short,pairing,sweetness,body,acidity,tannins,aroma_intensity,complexity,finish,oak,aroma_features,tags,best_drinking,image_url,visible,filename";
  
  return new NextResponse(header, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename=wine_master_template.csv',
    },
  });
}
