import type { Metadata } from "next";
import terms from "../../lib/terms-current";

type Locale = "th" | "en";
type TermsPageProps = { searchParams: Promise<{ lang?: string | string[] }> };

export async function generateMetadata({ searchParams }: TermsPageProps): Promise<Metadata> {
  const { lang } = await searchParams;
  const locale: Locale = lang === "en" ? "en" : "th";
  return { title: `${terms.title[locale]} · tiwhub`, robots: { index: true, follow: true } };
}

export default async function TermsPage({ searchParams }: TermsPageProps) {
  const { lang } = await searchParams;
  const locale: Locale = lang === "en" ? "en" : "th";

  return (
    <main className="min-h-screen bg-[var(--page)] px-4 py-8 text-[var(--navy)] sm:px-6 sm:py-12" lang={locale}>
      <article className="mx-auto max-w-3xl rounded-2xl border border-[var(--border)] bg-white px-5 py-7 shadow-sm sm:px-10 sm:py-10">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-[var(--border)] pb-6">
          <div>
            <a className="text-sm font-semibold text-[var(--blue)] hover:underline" href={`/?lang=${locale}`}>← {locale === "th" ? "กลับหน้าหลัก" : "Back to home"}</a>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight">{terms.title[locale]}</h1>
            <p className="mt-3 text-sm text-[var(--body)]">{locale === "th" ? "เวอร์ชัน" : "Version"} {terms.version} · {locale === "th" ? "มีผลตั้งแต่" : "Effective"} {terms.effectiveAt}</p>
          </div>
          <nav className="flex gap-2 text-sm" aria-label={locale === "th" ? "ภาษา" : "Language"}>
            <a className="rounded-lg border border-[var(--border)] px-3 py-2 hover:bg-[var(--pale)]" href="/terms?lang=th" lang="th" aria-current={locale === "th" ? "page" : undefined}>ไทย</a>
            <a className="rounded-lg border border-[var(--border)] px-3 py-2 hover:bg-[var(--pale)]" href="/terms?lang=en" lang="en" aria-current={locale === "en" ? "page" : undefined}>English</a>
          </nav>
        </header>
        <div className="max-w-[72ch] py-6 text-base leading-7 text-[var(--body)]">
          <p>{terms.intro[locale]}</p>
          {terms.sections.map((section) => (
            <section className="mt-7" key={section.heading[locale]}>
              <h2 className="text-lg font-bold text-[var(--navy)]">{section.heading[locale]}</h2>
              {section.paragraphs[locale].map((paragraph) => <p className="mt-2" key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
          <aside className="mt-8 border-t border-[var(--border)] pt-5 text-sm">
            {locale === "th"
              ? "ข้อกำหนดนี้แยกจากประกาศความเป็นส่วนตัวและความยินยอมด้านข้อมูลส่วนบุคคล โปรดอ่านประกาศที่เกี่ยวข้องแยกต่างหาก"
              : "These terms are separate from the privacy notice and personal-data consent. Please review the applicable privacy notice separately."}
          </aside>
          <aside className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--pale)] p-4 text-sm leading-6">
            <h2 className="font-bold text-[var(--navy)]">{locale === "th" ? "การจัดการเวอร์ชันสำหรับผู้ดูแล" : "Versioning for administrators"}</h2>
            {locale === "th" ? (
              <p className="mt-2">ก่อนเผยแพร่ ให้ฝ่ายกฎหมายตรวจเนื้อหา กำหนดเลขเวอร์ชันใหม่ (ห้ามแก้ทับเอกสารที่มีผู้ยอมรับแล้ว) เพิ่มไฟล์ terms-vX.Y.json ใน API/Legal และ CMS/lib พร้อมตั้งค่า Legal:Terms:CurrentVersion และ Legal:Terms:Documents ใน API การเปลี่ยนเวอร์ชันจะบังคับให้บัญชีที่ยังไม่ยอมรับเวอร์ชันปัจจุบันแสดงหน้าทบทวนและยอมรับอีกครั้ง เก็บไฟล์เดิมและบันทึกการยอมรับไว้ตรวจสอบย้อนหลัง</p>
            ) : (
              <p className="mt-2">Before publishing, obtain legal review and assign a new version (never overwrite a document that users have accepted). Add terms-vX.Y.json under API/Legal and CMS/lib, then update Legal:Terms:CurrentVersion and Legal:Terms:Documents in API configuration. Changing the version requires accounts without acceptance of the current version to review and accept again. Retain prior document files and acceptance records for audit.</p>
            )}
          </aside>
        </div>
      </article>
    </main>
  );
}