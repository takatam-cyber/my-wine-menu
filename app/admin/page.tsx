"use client";

import { useState, useEffect } from 'react';
import { 
  Camera, 
  Loader2, 
  Wine as WineIcon, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  X, 
  Plus, 
  Minus, 
  LogOut,
  Save,
  ExternalLink
} from 'lucide-react';

export default function AdminPage() {
  const [auth, setAuth] = useState({ id: '', pass: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ワイン情報の初期状態
  const initialWineState = {
    id: '', name_jp: '', name_en: '', country: '', region: '', 
    grape: '', type: '赤 / フルボディ', vintage: '', price: '', cost: '', 
    stock: '0', advice: '', image: ''
  };

  const [newWine, setNewWine] = useState(initialWineState);

  // 1. ログイン情報の復元
  useEffect(() => {
    const savedId = localStorage.getItem('wine_store_id');
    const savedPass = localStorage.getItem('wine_store_pass');
    if (savedId && savedPass) {
      setAuth({ id: savedId, pass: savedPass });
      setIsLoggedIn(true);
    }
  }, []);

  // 2. ログイン完了後にデータ取得
  useEffect(() => { 
    if (isLoggedIn) fetchWines(); 
  }, [isLoggedIn]);

  // データ取得ロジック
  const fetchWines = async () => {
    try {
      const res = await fetch(`/api/wines`, { 
        headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass } 
      });
      if (res.ok) {
        const data = await res.json();
        setWines(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("データ取得失敗:", e);
    }
  };

  // ログイン処理
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (auth.id.length < 3 || auth.pass.length < 4) {
      return alert("IDは3文字以上、パスワードは4文字以上で設定してください");
    }
    localStorage.setItem('wine_store_id', auth.id);
    localStorage.setItem('wine_store_pass', auth.pass);
    setIsLoggedIn(true);
  };

  // ログアウト
  const handleLogout = () => {
    if (confirm("ログアウトしますか？")) {
      localStorage.clear();
      location.reload();
    }
  };

  // 在庫クイック更新
  const updateStock = async (wine: any, delta: number) => {
    const updated = { ...wine, stock: String(Math.max(0, (parseInt(wine.stock) || 0) + delta)) };
    const res = await fetch('/api/wines', { 
      method: 'POST', 
      headers: { 'x-store-id': auth.id, 'x-store-password': auth.pass }, 
      body: JSON.stringify(updated) 
    });
    if (res.ok) fetchWines();
  };

  // ★ AIラベル分析（修正版）
  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);

    try {
      // 1. まず画像をR2にアップロード
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      
      if (!uploadRes.ok) throw new Error(uploadData.error || "画像のアップロードに失敗しました");
      
      const imageUrl = uploadData.url;
      setNewWine(prev => ({ ...prev, image: imageUrl }));

      // 2. Gemini AI で解析
      const scanRes = await fetch('/api/scan', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl }) 
      });
      
      const scanData = await scanRes.json();
      
      if (!scanRes.ok || !scanData.result) {
        throw new Error(scanData.error || "AI解析が空の結果を返しました。");
      }

      // JSON文字列をパース
      const ai = JSON.parse(scanData.result);

      // フォームに反映
      setNewWine(prev => ({
        ...prev,
        name_jp: ai.name_jp || prev
