@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Noto+Sans+JP:wght@300;400;700&display=swap');

:root {
  --background: #050505;
  --foreground: #e5e5e5;
}

body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: 'Noto Sans JP', sans-serif;
  margin: 0;
  -webkit-font-smoothing: antialiased;
}

.font-serif {
  font-family: 'Playfair Display', serif;
}

/* スクロールバーの非表示（モバイル体験向上） */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
