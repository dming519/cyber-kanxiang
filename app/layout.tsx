import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BgRunes } from "@/components/BgRunes";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "赛博看相 · Cyber Kanxiang",
  description:
    "AI × 玄学 — 上传一张图片，由 AI 在原图基础上生成传统相术解析。看手相 · 看面相 · 看痣相。仅供文化娱乐参考。",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "赛博看相",
    description: "AI × 玄学 · 看手相 / 看面相 / 看痣相",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fdf8f3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){try{var t=localStorage.getItem("kanxiang_theme");document.documentElement.setAttribute("data-theme",t==="dark"?"dark":"light")}catch(e){document.documentElement.setAttribute("data-theme","light")}})()',
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700;900&family=Noto+Sans+SC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="relative min-h-screen overflow-x-hidden antialiased">
        <BgRunes />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
