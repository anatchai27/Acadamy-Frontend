"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "./Icon";

const nav = [
  ["/", "Overview", "grid"],
  ["/content", "Website content", "content"],
  ["/leads", "Lead inbox", "lead"],
  ["/operations", "Operations", "settings"],
  ["/settings", "Settings", "settings"],
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready] = useState(true);
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">A</span> academy / cms</div>
      <span className="eyebrow">Workspace</span>
      <nav className="nav">
        {nav.map(([href, label, icon]) => <button key={href} className={pathname === href ? "active" : ""} onClick={() => router.push(href)}><span className="nav-icon"><Icon name={icon} /></span>{label}</button>)}
      </nav>
      <div className="sidebar-footer"><span className="eyebrow">Current workspace</span><br />Oasis Learning Academy<br /><span style={{ color: ready ? "#9de4be" : "#f4b575" }}>● {ready ? "Draft mode ready" : "Offline"}</span></div>
    </aside>
    <main className="main">{children}</main>
  </div>;
}
