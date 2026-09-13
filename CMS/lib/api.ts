export type LeadPayload = {
  instituteSlug: string;
  contactName: string;
  phone: string;
  email?: string;
  studentName?: string;
  courseInterest?: string;
  message?: string;
};

export async function createLead(payload: LeadPayload) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/public/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Lead submission failed");
  return response.json() as Promise<{ id: number; status: string }>;
}

export type WebsiteContent = {
  id?: number;
  sectionKey: string;
  contentType: string;
  contentValue?: string | null;
  metadata?: string | null;
  sortOrder: number;
  isActive: boolean;
};

function adminHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("academy-cms-admin-token") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function listWebsiteContent() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/website-content`, { headers: adminHeaders() });
  if (response.status === 401 || response.status === 403) throw new Error("CMS_ADMIN_TOKEN_REQUIRED");
  if (!response.ok) throw new Error("Website content load failed");
  return response.json() as Promise<{ status: string; items: WebsiteContent[] }>;
}

export async function saveWebsiteContent(content: WebsiteContent) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");
  const path = content.id ? `/api/website-content/${content.id}` : "/api/website-content";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify(content),
  });
  if (response.status === 401 || response.status === 403) throw new Error("CMS_ADMIN_TOKEN_REQUIRED");
  if (!response.ok) throw new Error("Website content save failed");
  return response.json() as Promise<WebsiteContent>;
}
