import Link from "next/link";

export default function PublicPageNotFound() {
  return <main className="not-found"><span className="eyebrow">404 / page not found</span><h1>This page is not published.</h1><p>The public page may still be a draft or the link may be incorrect.</p><Link className="public-cta" href="/">Back to academy CMS</Link></main>;
}
