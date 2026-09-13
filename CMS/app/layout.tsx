import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Academy CMS",
  description: "Manage the public academy website content and lead inbox.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
