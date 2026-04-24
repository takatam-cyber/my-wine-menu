/**
 * プレミアム・ルートコンポーネント (App)
 * [修正内容]
 * 1. <html> および <body> タグを <div> タグに変更しました。
 * プレビュー環境の制限により、コンポーネント内でドキュメントタグ（html, head, body）を
 * 使用するとDOMネストエラーが発生するため、これらを完全に排除しました。
 * 2. スタイル定義を最上位の <div> 内に配置し、アプリケーション全体に適用されるようにしました。
 * 3. 日本一のワインアプリに相応しい、洗練されたフォントと背景設定を維持しています。
 */

export default function App({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-sans antialiased selection:bg-amber-500/30 no-scrollbar">
      {/* 外部リソース（フォント）の動的読み込み用インジェクション */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Noto+Sans+JP:wght@300;400;700&display=swap');

        :root {
          --background: #050505;
          --foreground: #e5e5e5;
          --amber-primary: #f59e0b;
        }

        /* アプリケーション全体の基本設定 */
        body, #__next {
          background-color: var(--background) !important;
          margin: 0;
          padding: 0;
        }

        .font-serif {
          font-family: 'Playfair Display', serif;
        }

        /* スクロールバーの非表示設定（モバイルUX向上のための必須設定） */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* プレミアムなテキスト選択色 */
        ::selection {
          background: rgba(245, 158, 11, 0.3);
          color: white;
        }

        /* レイアウトの整合性を保つためのリセット */
        * {
          box-sizing: border-box;
        }
      `}} />

      {/* メインコンテンツ */}
      {children}
    </div>
  );
}
