import { useMemo, useState } from 'preact/hooks';
import { platformContent } from '../../config/content';
import { CoursePlatformCard } from './CoursePlatformCard';
import { InstituteCard } from './InstituteCard';
import { useTranslation } from '../../hooks';
import { LanguageSwitcher } from '../ui/language-switcher';
import { FoxSticker } from '../ui/fox-sticker';
import './platform.css';

export function PlatformHome() {
  const { t, currentLanguage } = useTranslation();
  const [query, setQuery] = useState('');
  const [subjectKey, setSubjectKey] = useState('all');
  const [compare, setCompare] = useState([]);
  const courses = useMemo(
    () =>
      platformContent.courses.filter(
        (course) => {
          const courseIndex = platformContent.courses.indexOf(course);
          const instituteIndex = platformContent.institutes.findIndex((institute) => institute.name === course.institute);
          const translatedCourseSubject = t(`platform.courses.subjects.${courseIndex}`);
          const translatedLocation = t(`platform.institutes.items.${instituteIndex}.location`);
          return (
            (subjectKey === 'all' || ['english', 'coding', 'math'][courseIndex] === subjectKey) &&
            `${course.name} ${course.subject} ${translatedCourseSubject} ${course.institute} ${translatedLocation}`
              .toLowerCase()
              .includes(query.toLowerCase())
          );
        },
      ),
    [query, subjectKey, currentLanguage],
  );
  const addCompare = (course) =>
    setCompare((items) => (items.some((item) => item.name === course.name) ? items : [...items, course]));
  return (
    <div class="marketplace oasis-marketplace">
      <nav class="market-nav">
        <a class="market-brand" href="/">
          <img src="/tiwhub-mark.svg" alt="" />
          {t('common.appName')}
        </a>
        <div class="market-nav-links">
          <a href="#institutes">{t('platform.navigation.institutes')}</a>
          <a href="#courses">{t('platform.navigation.courses')}</a>
          <a href="#how-it-works">{t('platform.navigation.howItWorks')}</a>
        </div>
        <a class="market-partner-link" href="#for-institutes">
          {t('platform.navigation.partner')} <span>↗</span>
        </a>
        <LanguageSwitcher />
      </nav>
      <main>
        <section class="market-hero">
          <FoxSticker action="hello" message={t('platform.mascot.hero')} className="market-mascot market-mascot-hero" />
          <span class="market-eyebrow">{t('hero.eyebrow')}</span>
          <h1>
            {t('hero.title')}
            <br />
            <em>{t('hero.highlight')}</em>
          </h1>
          <p>{t('hero.description')}</p>
          <div class="market-search">
            <span>⌕</span>
            <input
              value={query}
              onInput={(event) => setQuery(event.currentTarget.value)}
              placeholder={t('hero.searchPlaceholder')}
              aria-label={t('hero.searchAriaLabel')}
            />
            <button onClick={() => document.querySelector('#courses')?.scrollIntoView({ behavior: 'smooth' })}>
              {t('common.search')}
            </button>
          </div>
          <FoxSticker action="thinking" message={t('platform.mascot.search')} className="market-mascot market-mascot-search" />
          <div class="market-suggestions">
            <span>{t('hero.popularSearches')}</span>
            <button onClick={() => setQuery('Coding')}>Coding</button>
            <button onClick={() => setQuery(t('platform.subjects.english'))}>{t('platform.subjects.english')}</button>
            <button onClick={() => setQuery(t('platform.institutes.items.0.location'))}>{t('platform.institutes.items.0.location')}</button>
          </div>
        </section>
        <section class="market-trust">
          <div>
            <strong>2,400+</strong>
            <span>{t('trust.institutes')}</span>
          </div>
          <div>
            <strong>18,000+</strong>
            <span>{t('trust.courses')}</span>
          </div>
          <div>
            <strong>4.8/5</strong>
            <span>{t('trust.rating')}</span>
          </div>
          <p>
            {t('trust.transparent')}
            <br />
            {t('trust.decide')}
          </p>
          <FoxSticker action="reading" compact message={t('platform.mascot.trust')} className="market-mascot market-mascot-trust" />
        </section>
        <section class="market-section" id="how-it-works">
          <div class="market-heading">
            <div>
              <span class="market-eyebrow">{t('problems.eyebrow')}</span>
              <h2>{t('problems.title')}</h2>
            </div>
            <span>{t('problems.subtitle')}</span>
          </div>
          <div class="market-need-grid">
            {platformContent.problems.map((problem) => {
              const copy = t(`platform.problems.${problem.id}`, { returnObjects: true });
              const mascotActions = { communication: 'love', foundation: 'reading', 'future-skills': 'idea' };
              return (
              <a href="#institutes" class={`market-need-card need-${problem.tone}`} key={problem.id}>
                <FoxSticker
                  action={mascotActions[problem.id]}
                  message={t(`platform.mascot.${problem.id === 'future-skills' ? 'futureSkills' : problem.id}`)}
                  compact
                  className="market-need-mascot"
                />
                <span>{copy.eyebrow}</span>
                <h3>
                  {copy.title.split('\n').map((line, index) => (
                    <span key={line}>
                      {index > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </h3>
                <b>
                  {copy.cta} <i>↗</i>
                </b>
              </a>
            );})}
          </div>
        </section>
        <section class="market-section" id="institutes">
          <div class="market-heading">
            <div>
              <span class="market-eyebrow">{t('institutes.eyebrow')}</span>
              <h2>{t('institutes.title')}</h2>
            </div>
            <a href="#courses">{t('institutes.viewAll')}</a>
          </div>
          <FoxSticker action="thinking" message={t('platform.mascot.institutes')} className="market-mascot market-mascot-section" />
          <div class="market-institute-grid">
            {platformContent.institutes.map((institute, index) => (
              <div class="market-institute-wrap" key={institute.name}>
                <FoxSticker action={['idea', 'love', 'celebrate'][index]} compact message={t(`platform.mascot.institute${index + 1}`)} className="market-mascot market-mascot-card" />
                <InstituteCard institute={institute} copy={t(`platform.institutes.items.${index}`, { returnObjects: true })} labels={t('platform.institutes', { returnObjects: true })} />
              </div>
            ))}
          </div>
        </section>
        <section class="market-section" id="courses">
          <div class="market-heading">
            <div>
              <span class="market-eyebrow">{t('courses.eyebrow')}</span>
              <h2>{t('courses.title')}</h2>
            </div>
            <div class="market-tabs">
              {['all', 'english', 'coding', 'math'].map((key) => (
                <button class={subjectKey === key ? 'active' : ''} onClick={() => setSubjectKey(key)} key={key}>
                  {t(`platform.subjects.${key}`)}
                </button>
              ))}
            </div>
          </div>
          <FoxSticker action="reading" message={t('platform.mascot.courses')} className="market-mascot market-mascot-section" />
          <div class="market-course-grid">
            {courses.map((course) => (
              <CoursePlatformCard key={course.name} course={course} onCompare={addCompare} copy={t('platform.courses', { returnObjects: true })} index={platformContent.courses.indexOf(course)} />
            ))}
          </div>
          {!courses.length && <div class="market-empty-state"><p>{t('courses.empty')}</p><p>{t('platform.mascot.emptyCourses')}</p></div>}
        </section>
        <section class="market-compare">
          <div>
            <FoxSticker action={compare.length ? 'thumbsUp' : 'thinking'} message={t(compare.length ? 'platform.mascot.compareReady' : 'platform.mascot.compare')} className="market-mascot market-mascot-compare" />
            <span class="market-eyebrow">{t('compare.eyebrow')}</span>
            <h2>{t('compare.title')}</h2>
            <p>{t('compare.description')}</p>
          </div>
          <div class="market-compare-list">
            {compare.length ? (
              compare.map((course) => (
                <span key={course.name}>
                  {course.institute} · ฿{course.price.toLocaleString()}
                </span>
              ))
            ) : (
              <span>{t('compare.empty')}</span>
            )}
          </div>
          <button disabled={!compare.length}>
            {t('compare.button', { count: compare.length })} <span>→</span>
          </button>
        </section>
        <section class="market-partner" id="for-institutes">
          <div>
            <FoxSticker action="celebrate" message={t('platform.mascot.partner')} className="market-mascot market-mascot-partner" />
            <span class="market-eyebrow">{t('partner.eyebrow')}</span>
            <h2>
              {t('partner.title')}
              <br />
              <em>{t('partner.highlight')}</em>
            </h2>
            <p>{t('partner.description')}</p>
            <a href={`mailto:partners@acadamy.co?subject=${encodeURIComponent(t('platform.navigation.partner') + ' tiwhub')}`}>
              {t('partner.cta')} <span>→</span>
            </a>
          </div>
          <div class="market-benefits">
            <div>
              <b>01</b>
              <strong>{t('partner.benefits.01.title')}</strong>
              <span>{t('partner.benefits.01.description')}</span>
            </div>
            <div>
              <b>02</b>
              <strong>{t('partner.benefits.02.title')}</strong>
              <span>{t('partner.benefits.02.description')}</span>
            </div>
            <div>
              <b>03</b>
              <strong>{t('partner.benefits.03.title')}</strong>
              <span>{t('partner.benefits.03.description')}</span>
            </div>
          </div>
        </section>
      </main>
      <footer class="market-footer">
        <b>
          <img src="/tiwhub-mark.svg" alt="" />{t('common.appName')}
        </b>
        <span>{t('common.tagline')}</span>
        <span>{t('footer.copyright')}</span>
      </footer>
    </div>
  );
}
