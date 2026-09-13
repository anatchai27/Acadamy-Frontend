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
