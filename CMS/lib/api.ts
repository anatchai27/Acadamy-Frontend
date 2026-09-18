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

export type PublicWebsiteContent = {
  sectionKey: string;
  contentType: string;
  contentValue?: string | null;
  metadata?: string | null;
  sortOrder: number;
  updatedAt: string;
};

export async function getPublicWebsiteContent(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) return null;
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/public/website-content/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
  if (response.status === 404) return { status: "not_found", items: [] as PublicWebsiteContent[] };
  if (!response.ok) throw new Error("Public website content load failed");
  return response.json() as Promise<{ status: string; items: PublicWebsiteContent[] }>;
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

function adminHeaders(includeJson = true): Record<string, string> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("academy-cms-admin-token") : null;
  const headers: Record<string, string> = includeJson ? { "Content-Type": "application/json" } : {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function uploadWebsiteMedia(file: File) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/uploads/website-media`, { method: "POST", headers: adminHeaders(false), body: formData });
  if (response.status === 401 || response.status === 403) throw new Error("CMS_ADMIN_TOKEN_REQUIRED");
  if (!response.ok) throw new Error("Website media upload failed");
  return response.json() as Promise<{ status: string; url: string; fileType: string }>;
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

export type Lead = {
  id: number;
  fullName: string;
  phone: string;
  email?: string | null;
  studentName?: string | null;
  status: string;
  assignedTo?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listLeads(status?: string, search?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  const query = params.toString();
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/leads${query ? `?${query}` : ""}`, { headers: adminHeaders() });
  if (response.status === 401 || response.status === 403) throw new Error("CMS_ADMIN_TOKEN_REQUIRED");
  if (!response.ok) throw new Error("Lead list load failed");
  return response.json() as Promise<{ status: string; leads: Lead[] }>;
}

export async function updateLeadFollowUp(id: number, payload: { status: string; notes?: string; assignedTo?: number | null }) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/leads/${id}/follow-up`, {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });
  if (response.status === 401 || response.status === 403) throw new Error("CMS_ADMIN_TOKEN_REQUIRED");
  if (!response.ok) throw new Error("Lead follow-up update failed");
  return response.json() as Promise<{ status: string }>;
}
