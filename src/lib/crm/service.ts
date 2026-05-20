import { supabase } from "@/integrations/supabase/client";

export type CrmCategory = "DJ" | "Brand";
export type OnboardingStatus =
  | "Not Contacted"
  | "Contacted"
  | "Responded"
  | "Onboarded"
  | "Active"
  | "Inactive";

export type CrmContact = {
  id: string;
  first_name: string;
  last_name: string | null;
  category: CrmCategory;
  phone_number: string | null;
  email: string | null;
  onboarding_status: OnboardingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const CATEGORY_OPTIONS: { value: CrmCategory; label: string }[] = [
  { value: "DJ", label: "DJ" },
  { value: "Brand", label: "Brand" },
];

export const ONBOARDING_STATUS_OPTIONS: {
  value: OnboardingStatus;
  label: string;
  color: string;
}[] = [
  { value: "Not Contacted", label: "Not Contacted", color: "bg-muted text-muted-foreground border-border" },
  { value: "Contacted",     label: "Contacted",     color: "bg-blue-500/20 text-blue-400 border-blue-500/50" },
  { value: "Responded",     label: "Responded",     color: "bg-amber-500/20 text-amber-400 border-amber-500/50" },
  { value: "Onboarded",     label: "Onboarded",     color: "bg-brand-green/20 text-brand-green border-brand-green/50" },
  { value: "Active",        label: "Active",        color: "bg-green-500/20 text-green-400 border-green-500/50" },
  { value: "Inactive",      label: "Inactive",      color: "bg-red-500/20 text-red-400 border-red-500/50" },
];

// Contacts pre-loaded from beta tester spreadsheet — seeded via setup-crm-table.sql
export const BETA_SEED: Omit<CrmContact, "id" | "created_at" | "updated_at" | "notes">[] = [
  { first_name: "Selecta",  last_name: "Suave",     category: "DJ",    phone_number: "7881831194", email: "selectauave@gmail.com",            onboarding_status: "Contacted" },
  { first_name: "Savannah", last_name: "Harriot",   category: "DJ",    phone_number: "7866507944", email: "hello@savssounds.com",             onboarding_status: "Contacted" },
  { first_name: "Sina",     last_name: "Soundboks", category: "Brand", phone_number: null,         email: "sina@soundboks.com",               onboarding_status: "Responded" },
  { first_name: "Virginie", last_name: "Hercules",  category: "Brand", phone_number: null,         email: "virginie.belliveau@guillemot.com", onboarding_status: "Contacted" },
  { first_name: "Sandra",   last_name: "Woo",       category: "DJ",    phone_number: null,         email: "sandra.woo@snafurecords.com",      onboarding_status: "Responded" },
  { first_name: "Vivian",   last_name: "Reis",      category: "DJ",    phone_number: null,         email: "vivireisux@gmail.com",             onboarding_status: "Contacted" },
  { first_name: "Sam",      last_name: "Mirson",    category: "DJ",    phone_number: null,         email: null,                               onboarding_status: "Not Contacted" },
  { first_name: "My",       last_name: "Kellner",   category: "DJ",    phone_number: null,         email: "aelvakmusic@gmail.com",            onboarding_status: "Not Contacted" },
  { first_name: "Juan",     last_name: "Diego",     category: "DJ",    phone_number: null,         email: null,                               onboarding_status: "Not Contacted" },
  { first_name: "Sandra",   last_name: "Woo",       category: "DJ",    phone_number: null,         email: null,                               onboarding_status: "Not Contacted" },
  { first_name: "Mira",     last_name: "SNAFU",     category: "Brand", phone_number: null,         email: null,                               onboarding_status: "Not Contacted" },
  { first_name: "Bejay",    last_name: "Mulenga",   category: "DJ",    phone_number: null,         email: null,                               onboarding_status: "Not Contacted" },
];

function normalizeCategory(v: string | null | undefined): CrmCategory {
  if (v === "Brand") return "Brand";
  return "DJ";
}

function normalizeStatus(v: string | null | undefined): OnboardingStatus {
  const s = (v ?? "").trim();
  if (s === "Contacted")     return "Contacted";
  if (s === "Responded")     return "Responded";
  if (s === "Onboarded")     return "Onboarded";
  if (s === "Active")        return "Active";
  if (s === "Inactive")      return "Inactive";
  return "Not Contacted";
}

function mapRow(row: any): CrmContact {
  return {
    id:                row.id,
    first_name:        String(row.first_name ?? ""),
    last_name:         row.last_name ?? null,
    category:          normalizeCategory(row.category),
    phone_number:      row.phone_number ?? null,
    email:             row.email ?? null,
    onboarding_status: normalizeStatus(row.onboarding_status),
    notes:             row.notes ?? null,
    created_at:        row.created_at ?? new Date().toISOString(),
    updated_at:        row.updated_at ?? new Date().toISOString(),
  };
}

export async function listContacts(): Promise<
  { ok: true; contacts: CrmContact[] } | { ok: false; message: string }
> {
  const { data, error } = await (supabase as any)
    .from("crm_contacts")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    if (
      error.message?.includes("relation") &&
      error.message?.includes("does not exist")
    ) {
      return { ok: true, contacts: [] };
    }
    return { ok: false, message: error.message ?? "Failed to load contacts" };
  }

  return { ok: true, contacts: ((data ?? []) as any[]).map(mapRow) };
}

export async function seedContacts(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const rows = BETA_SEED.map((c) => ({
    first_name:        c.first_name,
    last_name:         c.last_name,
    category:          c.category,
    phone_number:      c.phone_number,
    email:             c.email,
    onboarding_status: c.onboarding_status,
    notes:             null,
  }));

  const { error } = await (supabase as any).from("crm_contacts").insert(rows);
  if (error) return { ok: false, message: error.message ?? "Seed failed" };
  return { ok: true };
}

export async function createContact(
  contact: Omit<CrmContact, "id" | "created_at" | "updated_at">
): Promise<{ ok: true; contact: CrmContact } | { ok: false; message: string }> {
  const { data, error } = await (supabase as any)
    .from("crm_contacts")
    .insert([
      {
        first_name:        contact.first_name.trim(),
        last_name:         contact.last_name?.trim() ?? null,
        category:          contact.category,
        phone_number:      contact.phone_number?.trim() || null,
        email:             contact.email?.trim() || null,
        onboarding_status: contact.onboarding_status,
        notes:             contact.notes?.trim() || null,
      },
    ])
    .select()
    .single();

  if (error) return { ok: false, message: error.message ?? "Failed to create contact" };
  return { ok: true, contact: mapRow(data) };
}

export async function updateContact(
  id: string,
  contact: Partial<Omit<CrmContact, "id" | "created_at" | "updated_at">>
): Promise<{ ok: true; contact: CrmContact } | { ok: false; message: string }> {
  const payload: Record<string, any> = {};
  if (contact.first_name !== undefined) payload.first_name = contact.first_name.trim();
  if (contact.last_name  !== undefined) payload.last_name  = contact.last_name?.trim() ?? null;
  if (contact.category   !== undefined) payload.category   = contact.category;
  if (contact.phone_number !== undefined) payload.phone_number = contact.phone_number?.trim() || null;
  if (contact.email      !== undefined) payload.email      = contact.email?.trim() || null;
  if (contact.onboarding_status !== undefined) payload.onboarding_status = contact.onboarding_status;
  if (contact.notes      !== undefined) payload.notes      = contact.notes?.trim() || null;

  const { data, error } = await (supabase as any)
    .from("crm_contacts")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, message: error.message ?? "Failed to update contact" };
  return { ok: true, contact: mapRow(data) };
}

export async function deleteContact(
  id: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await (supabase as any)
    .from("crm_contacts")
    .delete()
    .eq("id", id);

  if (error) return { ok: false, message: error.message ?? "Failed to delete contact" };
  return { ok: true };
}
