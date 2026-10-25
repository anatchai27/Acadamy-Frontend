import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "tiwhub | ค้นหาที่เรียนที่เหมาะกับลูก",
  description: "เปรียบเทียบสถาบัน คอร์สเรียน และทำเลในที่เดียว",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
