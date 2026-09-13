"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Shell } from "@/components/Shell";

export default function OverviewPage() {
  const router = useRouter();
  return <Shell><header className="topbar"><div><span className="eyebrow">Public website workspace</span><h1>Keep the story clear.</h1><p className="subtitle">The current workspace is in draft mode until content and lead read APIs are approved.</p></div><div className="profile"><div className="profile-copy"><strong>Oasis Learning Academy</strong><br /><span className="subtitle">Draft workspace</span></div><div className="avatar">OA</div></div></header>
    <div className="notice"><strong>Read API boundary:</strong> Published content, lead counts, and activity are not available from the current API contract. This overview intentionally does not display placeholder metrics.</div>
    <section className="grid metrics"><div className="card"><span className="metric-label">Published sections</span><div className="metric-value">—</div><span className="trend">Awaiting content API</span></div><div className="card"><span className="metric-label">Draft sections</span><div className="metric-value">Local</div><span className="trend" style={{ color: "#a15e25" }}>Browser-only drafts</span></div><div className="card"><span className="metric-label">New enquiries</span><div className="metric-value">—</div><span className="trend">Lead list API not available</span></div><div className="card"><span className="metric-label">Content health</span><div className="metric-value">—</div><span className="trend">No approved calculation</span></div></section>
    <section className="grid dashboard-grid"><div className="card"><div className="card-heading"><h2>Lead read flow</h2><button className="text-button" onClick={() => router.push("/leads")}>Open submit test <Icon name="arrow" /></button></div><p className="subtitle">The verified integration is <code>POST /api/public/leads</code>. Listing, status, and follow-up endpoints are not part of the current contract.</p></div><div className="card"><div className="card-heading"><h2>Public preview</h2><span className="eyebrow">Static</span></div><p className="subtitle">The public preview is generated from the local <code>publicInstitute</code> source. It is not connected to CMS CRUD or media storage.</p></div></section>
  </Shell>;
}
