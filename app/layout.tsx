import type { Metadata } from "next";
import "./globals.css"; // globals.cssがある場合

export const metadata: Metadata = {
  title: "WINE MENU SaaS",
  description: "AI Sommelier Wine Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}