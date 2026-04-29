import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Life Calendar",
  description: "カレンダー・ToDo・日記をひとつに",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
