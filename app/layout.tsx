import type { Metadata } from "next";
import "./globals.css";
import { Header } from "./_components/Header";
import { Footer } from "./_components/Footer";

export const metadata: Metadata = {
  title: "現調くん | 調査・工事のマッチングサービス",
  description: "現地調査・工事の案件マッチングサービス「現調くん」のトップページです。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <div className="min-h-screen flex flex-col font-sans">
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
