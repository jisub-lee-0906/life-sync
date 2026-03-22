import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LifeSync",
    template: "%s | LifeSync",
  },
  description: "가계부, 캘린더, 루틴, 목표를 한 번에 관리하는 라이프 대시보드",
  applicationName: "LifeSync",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/apple-icon",
  },
};

export const viewport: Viewport = {
  themeColor: "#f8fafc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="bg-background" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
