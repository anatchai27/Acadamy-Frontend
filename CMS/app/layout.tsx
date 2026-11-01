import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "จัดการสถาบันกวดวิชาให้ง่ายขึ้น | tiwhub",
  description: "รวมรายชื่อนักเรียน ตารางสอน เช็กชื่อ และยอดชำระไว้ในระบบเดียวสำหรับสถาบันกวดวิชา",
  applicationName: "tiwhub",
  icons: {
    icon: "/mascots/fox-thumbs-up.png",
    shortcut: "/mascots/fox-thumbs-up.png",
  },
  robots: {
    index: true,
    follow: true,
  },
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
