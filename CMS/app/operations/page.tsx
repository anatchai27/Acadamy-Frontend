"use client";

import { ChangeEvent, useState } from "react";
import { Shell } from "@/components/Shell";

type Section = "holiday" | "files" | "payroll" | "broadcast" | "analytics";
const sections: { key: Section; label: string; note: string }[] = [
  { key: "holiday", label: "Holiday calendar", note: "Suppress reminders and attendance" },
  { key: "files", label: "File manager", note: "Teaching material library" },
  { key: "payroll", label: "Teacher payroll", note: "Hours and monthly rates" },
  { key: "broadcast", label: "Broadcast", note: "Class announcements" },
  { key: "analytics", label: "Analytics", note: "Retention and forecast" },
];

export default function OperationsPage() {
  const [active, setActive] = useState<Section>("holiday");
  return <Shell><header className="topbar"><div><span className="eyebrow">Operations / provisional workspace</span><h1>Run the academy clearly.</h1><p className="subtitle">A safe starting point for the workflows that need an approved contract.</p></div><div className="profile"><div className="avatar">NS</div></div></header><div className="notice"><strong>Provisional UI:</strong> These workflows follow `ProjectObj.md` assumptions. No write is sent to production until institute scope, RBAC, storage, notification and report contracts are approved.</div><div className="editor-layout"><div className="section-list">{sections.map((item) => <button key={item.key} className={active === item.key ? "selected" : ""} onClick={() => setActive(item.key)}><strong>{item.label}</strong><small>{item.note}</small></button>)}</div><div>{active === "holiday" && <HolidayPanel />}{active === "files" && <FilesPanel />}{active === "payroll" && <PayrollPanel />}{active === "broadcast" && <BroadcastPanel />}{active === "analytics" && <AnalyticsPanel />}</div></div></Shell>;
}

function HolidayPanel() {
  const [saved, setSaved] = useState(false);
  return <Panel title="Holiday calendar" status="Requirement gate"><div className="form-grid"><div className="field"><label>Institute scope</label><select defaultValue="oasis"><option value="oasis">Oasis Learning Academy</option></select></div><div className="field"><label>Timezone</label><select defaultValue="asia"><option value="asia">Asia / Bangkok (UTC+7)</option></select></div><div className="field"><label>Holiday date</label><input type="date" /></div><div className="field"><label>Recurrence</label><select defaultValue="none"><option value="none">One-time</option><option value="yearly">Yearly</option></select></div><div className="field full"><label>Holiday name</label><input placeholder="e.g. Songkran holiday" /></div></div><div className="notice" style={{ marginTop: 20, marginBottom: 0 }}>Suppression matrix is not connected yet. Confirm which attendance, homework reminder and quota workers are suppressed before publishing.</div><div className="actions"><button className="button secondary" onClick={() => setSaved(false)}>Reset</button><button className="button primary" onClick={() => setSaved(true)}>Save draft</button></div>{saved && <StateMessage tone="success">Holiday draft saved locally. No worker configuration changed.</StateMessage>}</Panel>;
}

function FilesPanel() {
  const [file, setFile] = useState<string | null>(null);
  function choose(event: ChangeEvent<HTMLInputElement>) { setFile(event.target.files?.[0]?.name ?? null); }
  return <Panel title="File manager" status="Storage gate"><div className="file-drop"><strong>{file ?? "Drop a teaching file here"}</strong><small>PDF, JPG, PNG or WEBP · storage URL is not created in provisional mode</small><label className="button secondary">Choose file<input type="file" hidden onChange={choose} /></label></div><div className="empty">No files loaded. Connect the approved storage list endpoint to show tenant-scoped assets.</div><StateMessage tone="info">Required API contract: list, upload, permission check, delete and signed-link expiry.</StateMessage></Panel>;
}

function PayrollPanel() {
  const rows = [{ name: "Kru Mali", hours: "32.0", rate: "฿450", status: "Review" }, { name: "Kru Ton", hours: "28.5", rate: "฿450", status: "Ready" }, { name: "Kru Fern", hours: "24.0", rate: "฿400", status: "Draft" }];
  return <Panel title="Teacher payroll" status="Formula gate"><div className="toolbar"><div><span className="eyebrow">Payroll period</span><strong>September 2026</strong></div><button className="button secondary" disabled>Export CSV</button></div><div className="table-wrap"><table><thead><tr><th>Teacher</th><th>Actual hours</th><th>Hourly rate</th><th>Estimated total</th><th>Status</th></tr></thead><tbody>{rows.map((row) => <tr key={row.name}><td><strong>{row.name}</strong></td><td>{row.hours}</td><td>{row.rate}</td><td>฿{(Number(row.hours) * Number(row.rate.replace(/\D/g, ""))).toLocaleString()}</td><td><span className={`pill ${row.status !== "Ready" ? "warm" : ""}`}>{row.status}</span></td></tr>)}</tbody></table></div><StateMessage tone="info">Calculation preview follows `hourly_rate × actual teaching hours`. Confirm whether actual hours come from `sessions`, `attendances` or approved payroll periods.</StateMessage></Panel>;
}

function BroadcastPanel() {
  const [preview, setPreview] = useState(false);
  return <Panel title="Broadcast" status="Recipient gate"><div className="form-grid"><div className="field"><label>Recipient group</label><select defaultValue="class"><option value="class">All parents in selected class</option><option value="course">Parents in selected course</option></select></div><div className="field"><label>Class</label><select defaultValue="all"><option value="all">Select a class (required)</option></select></div><div className="field full"><label>Message</label><textarea placeholder="Write a short announcement..." /></div></div><div className="actions"><button className="button secondary" onClick={() => setPreview(true)}>Preview</button><button className="button primary" disabled={!preview}>Confirm send</button></div>{preview && <StateMessage tone="success">Preview ready. Sending remains disabled until recipient resolution, consent and notification audit policy are confirmed.</StateMessage>}</Panel>;
}

function AnalyticsPanel() {
  return <Panel title="Analytics" status="Definition gate"><div className="grid metrics" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 18 }}><div className="card"><span className="metric-label">Renewal rate</span><div className="metric-value">--</div><span className="subtitle">Formula pending</span></div><div className="card"><span className="metric-label">Churn risk</span><div className="metric-value">--</div><span className="subtitle">Source pending</span></div><div className="card"><span className="metric-label">Revenue forecast</span><div className="metric-value">--</div><span className="subtitle">Date window pending</span></div></div><div className="empty">No analytics data loaded. Define timezone, date window, missing-data rule and privacy scope before querying student data.</div><StateMessage tone="info">Objective sources: `enrollments`, `attendances`, `payments` and `sessions`. These are assumptions, not an approved report contract.</StateMessage></Panel>;
}

function Panel({ title, status, children }: { title: string; status: string; children: React.ReactNode }) { return <div className="card"><div className="card-heading"><h2>{title}</h2><span className="pill warm">{status}</span></div>{children}</div>; }
function StateMessage({ tone, children }: { tone: "success" | "info"; children: React.ReactNode }) { return <div className={`state-message ${tone}`}>{children}</div>; }
