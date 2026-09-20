import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acadamy | ค้นหาและเปรียบเทียบสถาบันเรียนพิเศษสำหรับเด็ก",
  description: "ศูนย์กลางค้นหาและเปรียบเทียบสถาบันเรียนพิเศษสำหรับเด็ก",
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
