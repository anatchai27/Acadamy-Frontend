"use client";

import { useEffect, useState } from "react";
import { defaultSections, type ContentSection } from "@/lib/content";
import { Shell } from "@/components/Shell";

const STORAGE_KEY = "academy-cms-content-v1";
export default function ContentPage() {
  const [sections, setSections] = useState<ContentSection[]>(defaultSections);
  const [selected, setSelected] = useState(defaultSections[0].key);
  const [saved, setSaved] = useState(false);
  useEffect(() => { const raw = window.localStorage.getItem(STORAGE_KEY); if (raw) setSections(JSON.parse(raw)); }, []);
  const current = sections.find((section) => section.key === selected) ?? sections[0];
  function update(field: "title" | "body", value: string) { setSections((items) => items.map((item) => item.key === selected ? { ...item, [field]: value, status: "Draft" } : item)); setSaved(false); }
  function saveDraft() { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sections)); setSaved(true); }
  return <Shell><header className="topbar"><div><span className="eyebrow">Website / content</span><h1>Shape the story.</h1><p className="subtitle">Edit the public-facing sections without losing the source of truth.</p></div><div className="profile"><div className="avatar">NS</div></div></header><div className="notice"><strong>Integration boundary:</strong> Content CRUD endpoints are not present in the current API contract. Changes are kept as local drafts until `public_website_contents` endpoints and media storage rules are approved.</div><div className="editor-layout"><div className="section-list">{sections.map((section) => <button key={section.key} className={section.key === selected ? "selected" : ""} onClick={() => { setSelected(section.key); setSaved(false); }}><strong>{section.label}</strong><small>{section.status} · {section.description}</small></button>)}</div><div className="card"><div className="card-heading"><div><span className="eyebrow">{current.key}</span><h2 style={{ marginTop: 7 }}>{current.label}</h2></div><span className={`pill ${current.status === "Draft" ? "warm" : ""}`}>{current.status}</span></div><div className="form-grid"><div className="field full"><label htmlFor="title">Headline</label><input id="title" value={current.title} onChange={(event) => update("title", event.target.value)} /></div><div className="field full"><label htmlFor="body">Description</label><textarea id="body" value={current.body} onChange={(event) => update("body", event.target.value)} /></div></div><div className="actions"><span className="subtitle" style={{ marginRight: "auto", alignSelf: "center" }}>{saved ? "Draft saved locally" : "Unsaved changes"}</span><button className="button secondary" onClick={() => setSections(defaultSections)}>Discard changes</button><button className="button primary" onClick={saveDraft}>Save draft</button></div></div></div></Shell>;
}
