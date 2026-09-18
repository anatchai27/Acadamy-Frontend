"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Shell } from "@/components/Shell";
import { listLeads, listWebsiteContent } from "@/lib/api";

type OverviewData = { published: number; drafts: number; newLeads: number };

export default function OverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [message, setMessage] = useState("กำลังโหลดข้อมูลจาก API...");

  useEffect(() => {
    let active = true;
    Promise.all([listWebsiteContent(), listLeads()]).then(([content, leads]) => {
      if (!active) return;
      const items = content.items || [];
      setData({
        published: items.filter(item => item.isActive).length,
        drafts: items.filter(item => !item.isActive).length,
        newLeads: (leads.leads || []).filter(lead => lead.status === "new").length,
      });
      setMessage("เชื่อมต่อ Content และ Lead API แล้ว");
    }).catch(error => {
      if (!active) return;
      setMessage(error instanceof Error && error.message === "CMS_ADMIN_TOKEN_REQUIRED"
        ? "ต้องตั้ง academy-cms-admin-token ที่มีสิทธิ์ Admin เพื่อดูข้อมูล Overview"
        : "โหลดข้อมูล Overview ไม่สำเร็จ กรุณาตรวจ API และลองใหม่");
    });
    return () => { active = false; };
  }, []);

  return <Shell>
    <header className="topbar"><div><span className="eyebrow">Public website workspace</span><h1>Keep the story clear.</h1><p className="subtitle">ภาพรวมจากข้อมูลที่ publish และ Lead ที่เข้ามาจริง</p></div><div className="profile"><div className="profile-copy"><strong>Oasis Learning Academy</strong><br /><span className="subtitle">API workspace</span></div><div className="avatar">OA</div></div></header>
    <div className="notice"><strong>สถานะ:</strong> {message}</div>
    <section className="grid metrics">
      <div className="card"><span className="metric-label">Published sections</span><div className="metric-value">{data ? data.published : "—"}</div><span className="trend">จาก Website Content API</span></div>
      <div className="card"><span className="metric-label">Draft sections</span><div className="metric-value">{data ? data.drafts : "—"}</div><span className="trend" style={{ color: "#a15e25" }}>ยังไม่เปิด public</span></div>
      <div className="card"><span className="metric-label">New enquiries</span><div className="metric-value">{data ? data.newLeads : "—"}</div><span className="trend">จาก Lead API</span></div>
      <div className="card"><span className="metric-label">Content health</span><div className="metric-value">{data ? "Connected" : "—"}</div><span className="trend">ไม่คำนวณจนกว่า API จะตอบกลับ</span></div>
    </section>
    <section className="grid dashboard-grid">
      <div className="card"><div className="card-heading"><h2>Lead inbox</h2><button className="text-button" onClick={() => router.push("/leads")}>จัดการ Lead <Icon name="arrow" /></button></div><p className="subtitle">ข้อมูลมาจาก <code>GET /api/leads</code> และอัปเดตสถานะผ่าน follow-up API</p></div>
      <div className="card"><div className="card-heading"><h2>Public preview</h2><span className="eyebrow">Published API</span></div><p className="subtitle">หน้า public อ่าน published content จาก <code>GET /api/public/website-content/:slug</code> และยังคง 404 สำหรับ slug ที่ไม่รู้จัก</p></div>
    </section>
  </Shell>;
}
