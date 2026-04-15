import './globals.css'

export const metadata = {
  title: 'Wine Menu Elite',
  description: 'Digital Wine List',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, backgroundColor: 'black' }}>{children}</body>
    </html>
  )
}
