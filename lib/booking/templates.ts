import type { BookingRequestFormData } from "@/lib/booking/types";

export type BookingRequestTemplate = {
  id: string;
  name: string;
  createdAt: string;
  form: BookingRequestFormData;
};

function storageKey(userId: string) {
  return `rhood-booking-templates:${userId}`;
}

export function loadBookingTemplates(userId: string): BookingRequestTemplate[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BookingRequestTemplate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(userId: string, templates: BookingRequestTemplate[]) {
  window.localStorage.setItem(storageKey(userId), JSON.stringify(templates));
}

export function saveBookingTemplate(
  userId: string,
  name: string,
  form: BookingRequestFormData
): BookingRequestTemplate {
  const template: BookingRequestTemplate = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `tpl-${Date.now()}`,
    name: name.trim() || form.event_title.trim() || "Saved request",
    createdAt: new Date().toISOString(),
    form: { ...form },
  };
  const next = [template, ...loadBookingTemplates(userId)];
  persist(userId, next);
  return template;
}

export function deleteBookingTemplate(userId: string, templateId: string) {
  persist(
    userId,
    loadBookingTemplates(userId).filter((item) => item.id !== templateId)
  );
}
