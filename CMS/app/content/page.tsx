"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { defaultSections, type ContentSection } from "@/lib/content";
import { Shell } from "@/components/Shell";
import { listWebsiteContent, saveWebsiteContent, type WebsiteContent } from "@/lib/api";

const STORAGE_KEY = "academy-cms-content-v1";
export default function ContentPage() {
  const [sections, setSections] = useState<ContentSection[]>(defaultSections);
  const [selected, setSelected] = useState(defaultSections[0].key);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("กำลังโหลด content จาก API...");
  const [apiReady, setApiReady] = useState(false);
  useEffect(() => {
    let active = true;
    listWebsiteContent().then((result) => {
      if (!active || !result.items?.length) throw new Error("CONTENT_EMPTY");
      const mapped = result.items.map((item) => {
        let metadata: { label?: string; description?: string; title?: string } = {};
        try { metadata = item.metadata ? JSON.parse(item.metadata) : {}; } catch { /* keep fallback */ }
        return { key: item.sectionKey, label: metadata.label || item.sectionKey, description: metadata.description || "API content", title: metadata.title || item.sectionKey, body: item.contentValue || "", status: item.isActive ? "Published" : "Draft", id: item.id } as ContentSection & { id?: number };
      });
      setSections(mapped);
      setSelected(mapped[0].key);
      setApiReady(true);
      setMessage("เชื่อมต่อ API แล้ว");
    }).catch((error) => {
      if (!active) return;
      setMessage(error.message === "CMS_ADMIN_TOKEN_REQUIRED" ? "ต้องตั้ง academy-cms-admin-token ก่อนแก้ content" : "ยังโหลด API ไม่ได้ จึงใช้ local draft ชั่วคราว");
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) { try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) setSections(parsed); } catch { window.localStorage.removeItem(STORAGE_KEY); } }
    });
    return () => { active = false; };
  }, []);
  const current = sections.find((section) => section.key === selected) ?? sections[0];
  function update(field: "title" | "body", value: string) { setSections((items) => items.map((item) => item.key === selected ? { ...item, [field]: value, status: "Draft" } : item)); setSaved(false); }
  async function saveDraft() {
    if (!apiReady) { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sections)); setSaved(true); return; }
    try {
      await Promise.all(sections.map((section, index) => saveWebsiteContent({ id: (section as ContentSection & { id?: number }).id, sectionKey: section.key, contentType: "section", contentValue: section.body, metadata: JSON.stringify({ label: section.label, description: section.description, title: section.title }), sortOrder: index, isActive: section.status === "Published" })));
      setSaved(true); setMessage("บันทึก content ผ่าน API แล้ว");
    } catch (error) { setMessage(error instanceof Error ? error.message : "บันทึก content ไม่สำเร็จ"); }
  }
  function discardDraft() { window.localStorage.removeItem(STORAGE_KEY); setSections(defaultSections); setSelected(defaultSections[0].key); setSaved(false); }
  return <Shell><header className="topbar"><div><span className="eyebrow">Website / content</span><h1>Shape the story.</h1><p className="subtitle">Edit the public-facing sections without losing the source of truth.</p></div><div className="profile"><Link className="button secondary" href="/p/oasis-learning">Open public preview</Link><div className="avatar">NS</div></div></header><div className="notice"><strong>Content source:</strong> {message}</div><div className="editor-layout"><div className="section-list">{sections.map((section) => <button key={section.key} className={section.key === selected ? "selected" : ""} onClick={() => { setSelected(section.key); setSaved(false); }}><strong>{section.label}</strong><small>{section.status} · {section.description}</small></button>)}</div><div className="card"><div className="card-heading"><div><span className="eyebrow">{current.key}</span><h2 style={{ marginTop: 7 }}>{current.label}</h2></div><span className={`pill ${current.status === "Draft" ? "warm" : ""}`}>{current.status}</span></div><div className="form-grid"><div className="field full"><label htmlFor="title">Headline</label><input id="title" value={current.title} onChange={(event) => update("title", event.target.value)} /></div><div className="field full"><label htmlFor="body">Description</label><textarea id="body" value={current.body} onChange={(event) => update("body", event.target.value)} /></div></div><div className="actions"><span className="subtitle" style={{ marginRight: "auto", alignSelf: "center" }}>{saved ? (apiReady ? "Saved via API" : "Draft saved locally") : "Unsaved changes"}</span><button className="button secondary" onClick={discardDraft}>Discard local draft</button><button className="button primary" onClick={saveDraft}>Save draft</button></div></div></div></Shell>;
}
