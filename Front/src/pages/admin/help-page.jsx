import { route } from 'preact-router';
import { AdminLayout } from '../../layouts/admin-layout';
import { useAppContext } from '../../store/AppContext';
import { useTranslation } from '../../hooks';
import { canReadPage } from '../../config/permissions';
import { HiOutlineArrowTopRightOnSquare, HiOutlineBookOpen, HiOutlineShieldCheck } from 'react-icons/hi2';

const sectionConfig = [
  { key: 'start', paths: ['/admin/dashboard'] },
  { key: 'students', paths: ['/admin/students'] },
  { key: 'teaching', paths: ['/admin/courses', '/admin/attendance', '/admin/academics', '/admin/requests', '/admin/makeup-slots'] },
  { key: 'finance', paths: ['/admin/finance'] },
  { key: 'system', paths: ['/admin/users', '/admin/permissions', '/admin/settings', '/admin/rooms', '/admin/leads', '/admin/teachers'] },
  { key: 'troubleshooting', paths: [] },
];

const navigationKeys = {
  '/admin/dashboard': 'dashboard',
  '/admin/students': 'students',
  '/admin/courses': 'courses',
  '/admin/attendance': 'attendance',
  '/admin/academics': 'academics',
  '/admin/requests': 'requests',
  '/admin/makeup-slots': 'makeupSlots',
  '/admin/finance': 'finance',
  '/admin/users': 'users',
  '/admin/permissions': 'permissions',
  '/admin/settings': 'settings',
  '/admin/rooms': 'rooms',
  '/admin/leads': 'leads',
  '/admin/teachers': 'teachers',
};

export function HelpPage({ path }) {
  const { state } = useAppContext();
  const { t } = useTranslation();
  const role = String(state.userProfile?.role || state.user?.role || '').trim().toLowerCase();
  const guide = t('helpGuide', { returnObjects: true });
  const sections = sectionConfig
    .map((section) => {
      const paths = section.paths.filter((target) => canReadPage(role, target));
      return {
        ...section,
        content: guide.sections?.[section.key],
        paths,
        isAvailable: section.paths.length === 0 || paths.length > 0,
      };
    })
    .filter((section) => section.content && section.isAvailable);

  const openPage = (event, target) => {
    event.preventDefault();
    route(target);
  };

  return (
    <AdminLayout path={path}>
      <header class="mb-6 rounded-2xl border border-oasis-border bg-white p-5 shadow-[var(--oasis-shadow-surface)] sm:p-6">
        <div class="flex items-start gap-3">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-oasis-primary" aria-hidden="true">
            <HiOutlineBookOpen class="h-6 w-6" />
          </span>
          <div>
            <h2 class="text-xl font-bold text-oasis-navy sm:text-2xl">{guide.title}</h2>
            <p class="mt-1 max-w-3xl text-sm leading-relaxed text-oasis-body">{guide.description}</p>
            <p class="mt-2 text-xs text-oasis-muted">{guide.readTime}</p>
          </div>
        </div>
      </header>

      <div class="grid min-w-0 gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label={guide.contentsTitle} class="h-fit rounded-2xl border border-oasis-border bg-white p-4 xl:sticky xl:top-24">
          <h3 class="mb-2 text-sm font-bold text-oasis-navy">{guide.contentsTitle}</h3>
          <ul class="flex gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible">
            {sections.map((section) => (
              <li key={section.key} class="shrink-0">
                <a href={`#guide-${section.key}`} class="inline-flex min-h-9 items-center rounded-lg px-3 text-sm text-oasis-body hover:bg-blue-50 hover:text-oasis-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oasis-primary xl:w-full">
                  {section.content.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div class="min-w-0 space-y-4">
          {sections.map((section) => (
            <section id={`guide-${section.key}`} key={section.key} class="scroll-mt-24 rounded-2xl border border-oasis-border bg-white p-5 shadow-[var(--oasis-shadow-surface)] sm:p-6">
              <h3 class="text-lg font-bold text-oasis-navy">{section.content.title}</h3>
              <p class="mt-1 text-sm leading-relaxed text-oasis-body">{section.content.intro}</p>
              <ol class="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-oasis-body marker:font-semibold marker:text-oasis-primary">
                {section.content.steps.map((step) => <li key={step} class="pl-1">{step}</li>)}
              </ol>

              {section.key === 'students' && (
                <div class="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                  <h4 class="text-sm font-bold text-oasis-navy">{section.content.lineTitle}</h4>
                  <ol class="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-oasis-body marker:font-semibold marker:text-oasis-primary">
                    {section.content.lineSteps.map((step) => <li key={step} class="pl-1">{step}</li>)}
                  </ol>
                  <p class="mt-3 flex items-start gap-2 text-xs leading-relaxed text-oasis-body">
                    <HiOutlineShieldCheck class="mt-0.5 h-4 w-4 shrink-0 text-oasis-primary" aria-hidden="true" />
                    <span>{section.content.lineNote}</span>
                  </p>
                </div>
              )}

              {section.paths.length > 0 && (
                <div class="mt-4 flex flex-wrap gap-2 border-t border-oasis-border-light pt-4">
                  {section.paths.map((target) => (
                    <a key={target} href={target} onClick={(event) => openPage(event, target)} class="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-oasis-border bg-white px-3 text-sm font-semibold text-oasis-primary hover:border-oasis-primary/40 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oasis-primary">
                      {t(`navigation.${navigationKeys[target]}`)}
                      <HiOutlineArrowTopRightOnSquare class="h-4 w-4" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}
            </section>
          ))}

          <p class="rounded-xl bg-slate-100 px-4 py-3 text-xs leading-relaxed text-oasis-body">{guide.privateDataNote}</p>
        </div>
      </div>
    </AdminLayout>
  );
}