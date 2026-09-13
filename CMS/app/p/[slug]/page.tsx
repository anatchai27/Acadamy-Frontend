import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicInstitute } from "@/lib/content";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return [{ slug: "oasis-learning" }];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const institute = getPublicInstitute(slug);
  if (!institute) return { title: "Academy not found" };
  return {
    title: `${institute.name} | Learning with confidence`,
    description: institute.description,
    alternates: { canonical: `/p/${institute.slug}` },
    openGraph: {
      title: `${institute.name} | Learning with confidence`,
      description: institute.description,
      type: "website",
    },
  };
}

export default async function PublicInstitutePage({ params }: PageProps) {
  const { slug } = await params;
  const institute = getPublicInstitute(slug);
  if (!institute) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: institute.name,
    description: institute.description,
    telephone: institute.phone,
    address: { "@type": "PostalAddress", streetAddress: institute.address, addressCountry: "TH" },
    sameAs: [`https://line.me/R/ti/p/${institute.lineId.replace(/^@/, "")}`],
  };

  return (
    <main className="public-site">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <nav className="public-nav" aria-label="Public website navigation">
        <strong><span className="public-mark">A</span> {institute.name}</strong>
        <div>
          <a href="#stories">Stories</a><a href="#teachers">Teachers</a><a href="#courses">Courses</a><a href="#contact">Contact</a>
          <Link className="public-cta small" href="/trial-class">Book a trial</Link>
        </div>
      </nav>

      <section className="public-hero">
        <div>
          <span className="eyebrow">Learning, made visible</span>
          <h1>{institute.tagline}</h1>
          <p>{institute.description}</p>
          <div className="public-actions">
            <Link className="public-cta" href="/trial-class">Try a class free <span aria-hidden="true">→</span></Link>
            <a className="public-link" href="#courses">Explore courses ↓</a>
          </div>
        </div>
        <div className="hero-note"><span>01 / progress note</span><strong>Small steps<br />count here.</strong><p>Individual attention. Practical goals. A clear next step after every class.</p></div>
      </section>

      <section className="public-section" id="stories">
        <div className="section-intro"><span className="eyebrow">Student stories</span><h2>Progress worth<br /><em>sharing.</em></h2></div>
        <div className="story-grid">{institute.stories.map((story) => <article className="story-card" style={{ background: story.color }} key={story.title}><span>Student story</span><h3>{story.title}</h3><p>{story.detail}</p><b>Read story →</b></article>)}</div>
      </section>

      <section className="public-section teachers-section" id="teachers">
        <div className="section-intro"><span className="eyebrow">The people here</span><h2>Teachers who<br /><em>notice.</em></h2></div>
        <div className="teacher-grid">{institute.teachers.map((teacher) => <article className="teacher-card" key={teacher.name}><div className="teacher-avatar" aria-hidden="true">{teacher.initials}</div><span>{teacher.role}</span><h3>{teacher.name}</h3><p>{teacher.bio}</p></article>)}</div>
      </section>

      <section className="public-section courses-section" id="courses">
        <div className="section-intro"><span className="eyebrow">Choose your next step</span><h2>Courses with<br /><em>room to grow.</em></h2></div>
        <div className="course-grid">{institute.courses.map((course) => <article className="course-card" key={course.name}><div><span className="course-subject">{course.subject}</span><h3>{course.name}</h3><p>{course.detail}</p></div><div className="course-meta"><span>{course.sessions} sessions</span><strong>{course.price}</strong></div></article>)}</div>
      </section>

      <section className="public-contact" id="contact"><div><span className="eyebrow">Come say hello</span><h2>Ready for a<br /><em>clearer next step?</em></h2></div><div className="contact-details"><p>{institute.address}</p><p><a href={`tel:${institute.phone.replace(/\s/g, "")}`}>{institute.phone}</a><br /><a href={`https://line.me/R/ti/p/${institute.lineId.replace(/^@/, "")}`}>{institute.lineId}</a></p><Link className="public-cta" href="/trial-class">Book a trial <span aria-hidden="true">→</span></Link></div></section>
      <footer className="public-footer"><span>© 2026 {institute.name}</span><span>Thoughtful learning, one step at a time.</span></footer>
    </main>
  );
}
