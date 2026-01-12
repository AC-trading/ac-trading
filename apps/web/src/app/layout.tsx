import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "당근이지 - 동물의 숲 아이템 거래",
  description: "모여봐요 동물의 숲 아이템을 쉽고 빠르게 거래하세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
