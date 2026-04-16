"use client";

import { useState, useEffect } from 'react';
import { Camera, Save, Loader2, Wine as WineIcon, Trash2 } from 'lucide-react';

export default function AdminPage() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newWine, setNewWine] = useState({
    name_jp: '', name_en: '', country: '', region: '', grape: '', vintage: '', 
    category: '赤', description: '', taste: '', image: ''
  });

  // 最初に保存されているワイン一覧を読み込む
  useEffect(() => { fetchWines(); }, []);

  const fetchWines = async () => {
    try {
      const res = await fetch('/api/wines');
      const data = await res.json();
      setWines(Array.isArray(data) ? data : []);
    } catch (e) {
      setWines([]);
    }
  };

  // スキャンボタンを押した時の処理
  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);

    try {
      // 1. 画像をR2ストレージにアップロード
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const { url } = await uploadRes.json();
      
      // 画像を先に画面に表示させる
      setNewWine(prev => ({ ...prev, image: url }));

      // 2. AIで画像を解析
      const scanRes = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: url })
      });
      const data = await scanRes.json();
      
      // 3. AIの返答からJSONデータだけを抜き出す（強力な解析ロジック）
      let resText = String(data.result);
      const startIdx = resText.indexOf('{');
      const endIdx = resText.lastIndexOf('}');

      if (startIdx !== -1 && endIdx !== -1) {
        const jsonString = resText.substring(startIdx, endIdx + 1);
        const result = JSON.parse(jsonString);

        // 4. 各入力欄に自動セット
        setNewWine(prev => ({
          ...prev,
          name_jp: result.name_jp || '',
          name_en: result.name_en || '',
          country: result.country || '',
          region: result.region || '',
          grape: result.grape || '',
          vintage: String(result.vintage || ''),
          taste: result.taste || '',
          description: result.description || '',
          image: url // 画像を維持
        }));
      }
    } catch (error) {
      console.error(error);
      alert("AI分析に失敗しました。手動で入力するか、もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  // 保存ボタンを押した時の処理
  const handleSave = async () => {
    const id = Date.now().toString();
    await fetch('/api/wines', { 
      method: 'POST', 
      body: JSON.stringify({ ...newWine, id }) 
    });
    alert("セラーに登録しました！");
    // 入力欄をリセット
    setNewWine({ name_jp: '', name_en: '', country: '', region: '', grape: '', vintage: '', category: '赤', description: '', taste: '', image: '' });
    fetchWines();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-50 min-h-screen text-slate-900">
      {/* ヘッダー部分 */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-800">ワインメニュー管理</h1>
        <label className="bg-slate-800 text-white px-6 py-3 rounded-full flex items-center gap-2 cursor-pointer hover:bg-slate-700 transition shadow-lg">
          {loading ? <Loader2 className="animate-spin" /> : <Camera size={20} />}
          <span className="font-bold">{loading ? "AI分析中..." : "ラベルをスキャン"}</span>
          <input type="file" accept="image/*" onChange={handleScan} className="hidden" />
        </label>
      </div>

      {/* メイン入力フォーム */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* 左側：テキスト入力エリア */}
          <div className="md:col-span-2 space-y-5">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">ワイン名 (カタカナ)</label>
              <input type="text" value={newWine.name_jp} onChange={e => setNewWine({...newWine, name_jp: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-black font-bold text-lg transition" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Wine Name (Alphabet)</label>
              <input type="text" value={newWine.name_en} onChange={e => setNewWine({...newWine, name_en: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-black font-bold text-lg transition" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">国</label>
                <input type="text" value={newWine.country} onChange={e => setNewWine({...newWine, country: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-black font-bold transition" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">産地</label>
                <input type="text" value={newWine.region} onChange={e => setNewWine({...newWine, region: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-black font-bold transition" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">品種</label>
                <input type="text" value={newWine.grape} onChange={e => setNewWine({...newWine, grape: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-black font-bold transition" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">ヴィンテージ</label>
                <input type="text" value={newWine.vintage} onChange={e => setNewWine({...newWine, vintage: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-black font-bold transition" />
              </div>
            </div>
          </div>

          {/* 右側：画像表示エリア */}
          <div className="flex flex-col items-center">
            <div className="w-full aspect-[3/4] border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 overflow-hidden flex items-center justify-center relative group">
              {newWine.image ? (
                <img src={newWine.image} alt="Wine Label" className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-300 flex flex-col items-center gap-2">
                  <WineIcon size={64} strokeWidth={1} />
                  <span className="text-xs font-bold uppercase tracking-tighter">No Label Image</span>
                </div>
              )}
            </div>
          </div>

          {/* 下部：長いテキストエリア */}
          <div className="col-span-full space-y-5 border-t border-slate-100 pt-6">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">味わいの特徴 (日本語)</label>
              <textarea value={newWine.taste} onChange={e => setNewWine({...newWine, taste: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-black font-bold h-24 transition" placeholder="AIが味わいを分析します..." />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">ワイン紹介コメント (日本語)</label>
              <textarea value={newWine.description} onChange={e => setNewWine({...newWine, description: e.target.value})} className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-black font-bold h-32 transition" placeholder="このワインのストーリーや魅力を記載します..." />
            </div>
          </div>
        </div>

        {/* 登録ボタン */}
        <button onClick={handleSave} className="w-full mt-10 bg-slate-800 text-white py-5 rounded-2xl font-black text-xl hover
