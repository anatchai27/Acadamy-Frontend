import ProductDashboardPreview from "../components/ProductDashboardPreview";
import FoxSticker from "../components/FoxSticker";
import { messages, resolveLocale, type Locale } from "../lib/i18n";

type HomePageProps = { searchParams: Promise<{ lang?: string | string[] }> };

export async function generateMetadata({ searchParams }: HomePageProps) {
  const { lang } = await searchParams;
  const copy = messages[resolveLocale(lang)];
  return { title: copy.metadataTitle, description: copy.metadataDescription };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { lang } = await searchParams;
  const locale: Locale = resolveLocale(lang);
  const copy = messages[locale];
  const workflows = [
    { title: copy.workflowTitle1, description: copy.workflowDescription1, mood: "hello" as const },
    { title: copy.workflowTitle2, description: copy.workflowDescription2, mood: "reading" as const },
    { title: copy.workflowTitle3, description: copy.workflowDescription3, mood: "thumbs-up" as const },
  ];

  return (
    <div className="partner-page" lang={locale}>
      <header className="market-nav">
        <a className="market-brand" href={`/?lang=${locale}#top`} aria-label={`tiwhub ${copy.home}`}>
          <img src="/tiwhub-mark.svg" alt="" />
          tiwhub
        </a>
        <nav className="market-nav-links" aria-label={copy.mainMenu}>
          <a href="#งานที่จัดการได้">{copy.workflows}</a>
          <a href="#ภาพระบบ">{copy.preview}</a>
        </nav>
        <div className="market-nav-actions">
          <nav className="locale-switch" aria-label={copy.language}>
            <a href="/?lang=th" lang="th" aria-current={locale === "th" ? "page" : undefined}>{copy.thai}</a>
            <a href="/?lang=en" lang="en" aria-current={locale === "en" ? "page" : undefined}>{copy.english}</a>
          </nav>
          <a className="market-partner-link" href="https://tiwhub.vercel.app/">{copy.login} <span aria-hidden="true">↗</span></a>
        </div>
      </header>

      <main id="top">
        <section className="partner-hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="hero-kicker"><span className="hero-kicker-dot" aria-hidden="true" /> {copy.productType}</span>
            <h1 id="hero-title">{copy.heroTitleTop}<br />{copy.heroTitleMiddle}<br /><span>{copy.heroTitleEnd}</span></h1>
            <p>{copy.heroDescription}</p>
            <div className="hero-actions">
              <a className="button-primary hero-cta" href="https://tiwhub.vercel.app/">{copy.loginManage} <span aria-hidden="true">→</span></a>
              <a className="hero-secondary-link" href="#ภาพระบบ">{copy.seePreview} <span aria-hidden="true">↓</span></a>
            </div>
            <div className="hero-trust">
              <span className="trust-mark" aria-hidden="true"><span>✓</span></span>
              <p>{copy.trustTitle}<br /><strong>{copy.trustDescription}</strong></p>
            </div>
          </div>

          <div className="hero-stage" aria-label={copy.heroStage}>
            <div className="hero-mascot" aria-hidden="true"><FoxSticker mood="idea" alt="" priority /></div>
            <ProductDashboardPreview locale={locale} />
            <div className="stage-caption"><span aria-hidden="true">↳</span> {copy.stageCaption}</div>
          </div>
        </section>

        <section className="welcome-strip" id="งานที่จัดการได้" aria-label={copy.workflowSection}>
          {workflows.map((workflow) => (
            <div className="welcome-item" key={workflow.title}>
              <span className="welcome-mascot"><FoxSticker mood={workflow.mood} alt="" /></span>
              <p><strong>{workflow.title}</strong><small>{workflow.description}</small></p>
            </div>
          ))}
        </section>

        <section className="operations-section" id="ภาพระบบ">
          <div className="operations-heading">
            <div><p className="section-label">{copy.dailyWork}</p><h2>{copy.operationsTitle}</h2></div>
            <div className="operations-guide"><FoxSticker mood="thinking" alt="" /><p>{copy.operationsDescription}</p></div>
          </div>
          <ProductDashboardPreview locale={locale} />
          <p className="operations-note">{copy.demoNote}</p>
        </section>

        <section className="benefits-section" id="วิธีทำงาน">
          <div className="benefits-heading">
            <p className="section-label">{copy.benefitsLabel}</p>
            <h2>{copy.benefitsTitle}</h2>
          </div>
          <div className="benefits-list">
            <article className="benefit-row"><span className="benefit-number">01</span><div><h3>{copy.benefitTitle1}</h3><p>{copy.benefitDescription1}</p></div><span className="benefit-arrow" aria-hidden="true">↗</span></article>
            <article className="benefit-row"><span className="benefit-number">02</span><div><h3>{copy.benefitTitle2}</h3><p>{copy.benefitDescription2}</p></div><span className="benefit-arrow" aria-hidden="true">↗</span></article>
            <article className="benefit-row"><span className="benefit-number">03</span><div><h3>{copy.benefitTitle3}</h3><p>{copy.benefitDescription3}</p></div><span className="benefit-arrow" aria-hidden="true">↗</span></article>
          </div>
        </section>

        <section className="closing-invite">
          <FoxSticker className="closing-mascot" mood="celebrate" alt={copy.mascotAlt} />
          <div><p className="section-label">{copy.closingLabel}</p><h2>{copy.closingTitle}</h2></div>
          <a className="button-primary" href="https://tiwhub.vercel.app/">{copy.login} <span aria-hidden="true">→</span></a>
        </section>
      </main>

      <footer className="market-footer">
        <a className="footer-brand" href={`/?lang=${locale}#top`}><img src="/tiwhub-mark.svg" alt="" />tiwhub</a>
        <span>{copy.footerDescription}</span>
        <a href="https://tiwhub.vercel.app/">{copy.login}</a>
      </footer>
    </div>
  );
}
