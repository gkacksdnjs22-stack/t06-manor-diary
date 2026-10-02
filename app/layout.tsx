import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "탈출게임 맵 제작 일지 · Plan Do See",
  description: "대저택 게임의 계획, 실제 작업, 다음 개선점을 이어가는 제작 일지",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
