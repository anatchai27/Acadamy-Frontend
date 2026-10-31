import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "จัดการสถาบันกวดวิชาในที่เดียว | tiwhub",
  description: "ดูแลข้อมูลนักเรียน ผู้ปกครอง คอร์สเรียน ครูผู้สอน ตารางเรียน การเช็กชื่อ และการรับชำระในระบบเดียว",
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
