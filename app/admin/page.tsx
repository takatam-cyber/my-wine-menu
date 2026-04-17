// app/admin/page.tsx 内の handleScan 関数をこれに差し替え
const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setLoading(true);
  try {
    // 1. 画像アップロード
    const formData = new FormData();
    formData.append('file', file);
    const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(uploadData.error || "アップロード失敗");
    
    setNewWine(prev => ({ ...prev, image: uploadData.url }));

    // 2. AI解析
    const scanRes = await fetch('/api/scan', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: uploadData.url }) 
    });
    
    const scanData = await scanRes.json();
    
    // ここでチェック！
    if (!scanRes.ok || !scanData.result) {
      throw new Error(scanData.error || "AI解析が空の結果を返しました。");
    }

    const ai = JSON.parse(scanData.result);

    setNewWine(prev => ({
      ...prev,
      name_jp: ai.name_jp || '',
      name_en: ai.name_en || '',
      country: ai.country || '',
      region: ai.region || '',
      grape: ai.grape || '',
      type: ai.type || '赤 / フルボディ',
      vintage: String(ai.vintage || ''),
      price: String(ai.price || ''),
      cost: String(ai.cost || ''),
      advice: ai.advice || '',
      image: uploadData.url
    }));
  } catch (e: any) { 
    alert("解析エラー: " + e.message); 
  } finally { 
    setLoading(false); 
  }
};
