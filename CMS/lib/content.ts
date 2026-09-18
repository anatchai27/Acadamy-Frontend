export type ContentSection = {
  key: string;
  label: string;
  description: string;
  title: string;
  body: string;
  mediaUrl?: string;
  status: "Published" | "Draft";
};

export type PublicTeacher = {
  name: string;
  role: string;
  bio: string;
  initials: string;
};

export type PublicCourse = {
  name: string;
  subject: string;
  sessions: number;
  price: string;
  detail: string;
};

export type PublicStory = {
  title: string;
  detail: string;
  color: string;
};

export type PublicInstitute = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  phone: string;
  lineId: string;
  address: string;
  heroImageUrl?: string;
  teachers: PublicTeacher[];
  courses: PublicCourse[];
  stories: PublicStory[];
};

export const defaultSections: ContentSection[] = [
  { key: "hero_banner", label: "Hero banner", description: "First impression and primary CTA", title: "Learn with confidence.", body: "A calm, focused learning space where every student can make visible progress.", status: "Published" },
  { key: "about_us", label: "About the academy", description: "Mission and teaching approach", title: "Built around real progress", body: "Tell families what makes your teachers, curriculum and learning environment different.", status: "Draft" },
  { key: "teachers", label: "Teachers", description: "Profiles and credentials", title: "Meet the people behind the progress", body: "Teacher profiles will be connected when the CMS content API contract is available.", status: "Draft" },
  { key: "portfolio", label: "Student stories", description: "Outcomes and portfolio", title: "Small wins become big momentum", body: "Share student work and outcomes only after consent and media storage rules are confirmed.", status: "Draft" },
  { key: "contact", label: "Contact", description: "Location and enquiry details", title: "Start a conversation", body: "Give prospective families a clear way to reach the academy.", status: "Published" },
];

export const publicInstitute: PublicInstitute = {
  slug: "oasis-learning",
  name: "Oasis Learning Academy",
  tagline: "A calmer way to make real progress.",
  description: "Focused classes, thoughtful teachers and a learning plan families can see clearly.",
  phone: "02 123 4567",
  lineId: "@oasislearning",
  address: "48 Sukhumvit 24, Bangkok",
  teachers: [
    { name: "Kru Mali", role: "English & Communication", bio: "Turns everyday conversation into confident practice.", initials: "KM" },
    { name: "Kru Ton", role: "Mathematics & Science", bio: "Makes difficult ideas feel possible, one step at a time.", initials: "KT" },
    { name: "Kru Fern", role: "Early Years Learning", bio: "Builds joyful routines for curious young learners.", initials: "KF" },
  ],
  courses: [
    { name: "English Confidence", subject: "English", sessions: 12, price: "฿3,900", detail: "Conversation, reading and practical writing" },
    { name: "Math Foundations", subject: "Mathematics", sessions: 12, price: "฿3,900", detail: "Clear concepts and problem-solving habits" },
    { name: "Homework Studio", subject: "Mixed support", sessions: 8, price: "฿2,600", detail: "A focused weekly space to ask, practise and finish" },
  ],
  stories: [
    { title: "From avoiding English to speaking up", detail: "A six-week confidence story", color: "#d9f5e5" },
    { title: "Making fractions finally click", detail: "A steady progress story", color: "#ffe3c2" },
    { title: "A better homework rhythm", detail: "A family routine story", color: "#dbe9fa" },
  ],
};

export function getPublicInstitute(slug: string) {
  return slug === publicInstitute.slug ? publicInstitute : null;
}

export function parsePublishedArray<T>(value: string | null | undefined): T[] | null {
  if (!value?.trim().startsWith("[")) return null;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : null;
  } catch {
    return null;
  }
}

export function applyPublishedContent(institute: PublicInstitute, items: Array<{ sectionKey: string; contentValue?: string | null; metadata?: string | null }>) {
  const sections = new Map(items.map((item) => {
    let metadata: { title?: string; description?: string; mediaUrl?: string } = {};
    try { metadata = item.metadata ? JSON.parse(item.metadata) : {}; } catch { /* ignore malformed optional metadata */ }
    return [item.sectionKey, { body: item.contentValue || "", title: metadata.title || "", description: metadata.description || "", mediaUrl: metadata.mediaUrl }] as const;
  }));
  const hero = sections.get("hero_banner");
  const teachers = parsePublishedArray<PublicTeacher>(sections.get("teachers")?.body)?.filter(item => item.name && item.role && item.bio && item.initials);
  const courses = parsePublishedArray<PublicCourse>(sections.get("courses")?.body)?.filter(item => item.name && item.subject && item.detail && item.price);
  const stories = parsePublishedArray<PublicStory>(sections.get("portfolio")?.body)?.filter(item => item.title && item.detail && item.color);
  return {
    ...institute,
    tagline: hero?.title || institute.tagline,
    description: hero?.body || institute.description,
    heroImageUrl: hero?.mediaUrl || undefined,
    ...(teachers?.length ? { teachers } : {}),
    ...(courses?.length ? { courses } : {}),
    ...(stories?.length ? { stories } : {}),
  };
}
