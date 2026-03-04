import type { Metadata } from "next";
import ThemeRegistry from "@/theme/ThemeRegistry";
import "./globals.css";

export const metadata: Metadata = {
  title: "自動校閲Webアプリ",
  description: "Webライターのための自動校閲ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
