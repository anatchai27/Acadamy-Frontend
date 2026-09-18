"use client";

import { useCallback, useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { listLeads, updateLeadFollowUp, type Lead } from "@/lib/api";

const columns = [
  ["new", "New"],
  ["contacted", "Contacted"],
  ["qualified", "Qualified"],
  ["converted", "Converted"],
  ["lost", "Lost"],
] as const;

const formatDate = (value: string) => new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, { status: string; notes: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listLeads(status || undefined, search.trim() || undefined);
      setLeads(result.leads || []);
    } catch (loadError) {
      setError(loadError instanceof Error && loadError.message === "CMS_ADMIN_TOKEN_REQUIRED"
        ? "ต้องตั้ง academy-cms-admin-token ที่มีสิทธิ์ Admin ก่อนเปิด Lead Inbox"
        : loadError instanceof Error ? loadError.message : "โหลด Lead ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => { void load(); }, [load]);

  const getDraft = (lead: Lead) => drafts[lead.id] || { status: lead.status, notes: lead.notes || "" };

  const updateDraft = (lead: Lead, field: "status" | "notes", value: string) => {
    const current = getDraft(lead);
    setDrafts(previous => ({ ...previous, [lead.id]: { ...current, [field]: value } }));
  };

  const save = async (lead: Lead) => {
    const draft = getDraft(lead);
    setSavingId(lead.id);
    setError("");
    try {
      await updateLeadFollowUp(lead.id, { status: draft.status, notes: draft.notes || undefined, assignedTo: lead.assignedTo ?? null });
      setLeads(previous => previous.map(item => item.id === lead.id ? { ...item, status: draft.status, notes: draft.notes, updatedAt: new Date().toISOString() } : item));
      setDrafts(previous => { const next = { ...previous }; delete next[lead.id]; return next; });
    } catch (saveError) {
      setError(saveError instanceof Error && saveError.message === "CMS_ADMIN_TOKEN_REQUIRED" ? "สิทธิ์ Admin หมดอายุหรือยังไม่ได้ตั้ง token" : "บันทึกการติดตาม Lead ไม่สำเร็จ");
    } finally {
      setSavingId(null);
    }
  };

  return <Shell>
    <header className="topbar">
      <div><span className="eyebrow">Growth / lead inbox</span><h1>Follow up with intent.</h1><p className="subtitle">ลูกค้าใหม่จากหน้า trial อยู่ที่นี่ พร้อมเปลี่ยนสถานะและจดบันทึกการติดตาม</p></div>
      <div className="profile"><button className="button secondary" onClick={() => void load()}>Refresh</button><div className="avatar">NS</div></div>
    </header>
    <section className="card" style={{ marginBottom: 18 }}>
      <div className="form-grid" style={{ gridTemplateColumns: "1fr 220px auto", alignItems: "end" }}>
        <div className="field"><label htmlFor="lead-search">ค้นหาชื่อลูกค้า, เบอร์โทร หรือชื่อนักเรียน</label><input id="lead-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="เช่น สมชาย หรือ 081..." /></div>
        <div className="field"><label htmlFor="lead-status">กรองสถานะ</label><select id="lead-status" value={status} onChange={event => setStatus(event.target.value)}><option value="">ทั้งหมด</option>{columns.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <button className="button primary" onClick={() => void load()}>ค้นหา</button>
      </div>
    </section>
    {error && <div className="notice" style={{ color: "#b45d3c", marginBottom: 18 }}>{error}</div>}
    {loading ? <div className="card"><p className="subtitle">กำลังโหลด Lead...</p></div> : leads.length === 0 ? <div className="card"><p className="subtitle">ยังไม่มี Lead ตามเงื่อนไขนี้</p></div> : <div className="grid" style={{ gridTemplateColumns: "repeat(5, minmax(190px, 1fr))", alignItems: "start", overflowX: "auto" }}>
      {columns.map(([value, label]) => <section key={value} className="card" style={{ minWidth: 190, padding: 14 }}><div className="card-heading"><h2>{label}</h2><span className="pill">{leads.filter(lead => lead.status === value).length}</span></div><div style={{ display: "grid", gap: 12 }}>{leads.filter(lead => lead.status === value).map(lead => { const draft = getDraft(lead); return <article key={lead.id} className="card" style={{ padding: 14, background: "var(--paper, #fff)" }}><strong>{lead.fullName}</strong><p className="subtitle" style={{ margin: "5px 0" }}>{lead.studentName || "ไม่ระบุชื่อนักเรียน"}</p><a href={`tel:${lead.phone}`} className="subtitle">{lead.phone}</a>{lead.email && <p className="subtitle">{lead.email}</p>}<small className="subtitle">เข้ามาเมื่อ {formatDate(lead.createdAt)}</small><select value={draft.status} onChange={event => updateDraft(lead, "status", event.target.value)} style={{ width: "100%", marginTop: 10 }} aria-label={`สถานะของ ${lead.fullName}`}>{columns.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select><textarea value={draft.notes} onChange={event => updateDraft(lead, "notes", event.target.value)} placeholder="บันทึกการติดตาม" rows={3} style={{ width: "100%", marginTop: 8 }} /><button className="button primary" style={{ width: "100%", marginTop: 8 }} disabled={savingId === lead.id} onClick={() => void save(lead)}>{savingId === lead.id ? "กำลังบันทึก..." : "บันทึกการติดตาม"}</button></article>; })}</div></section>)}
    </div>}
  </Shell>;
}
