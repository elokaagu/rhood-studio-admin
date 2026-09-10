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

// Contacts that can be seeded as a sample set
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

export async function setContactOnboardingByEmail(
  email: string,
  status: OnboardingStatus,
  note?: string | null
): Promise<{ ok: true } | { ok: false; message: string }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { ok: false, message: "Email is required." };

  const listed = await listContacts();
  if (!listed.ok) return listed;

  const match = listed.contacts.find(
    (contact) => contact.email?.trim().toLowerCase() === normalized
  );
  if (!match) return { ok: true };

  const stamp = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const extra = note?.trim() ? `${stamp}: ${note.trim()}` : null;
  const notes = extra
    ? match.notes?.trim()
      ? `${match.notes.trim()}\n${extra}`
      : extra
    : match.notes;

  const updated = await updateContact(match.id, {
    onboarding_status: status,
    notes,
  });
  if (!updated.ok) return updated;
  return { ok: true };
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

export type CrmImportRow = Omit<CrmContact, "id" | "created_at" | "updated_at">;

export const CRM_CSV_TEMPLATE = `first_name,last_name,email,phone_number,category,onboarding_status,notes
Amina,Okeke,amina@example.com,+447700900123,DJ,Not Contacted,House / UKG
`;

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function cell(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value) return value;
  }
  return "";
}

export function parseCrmCsv(text: string): {
  rows: CrmImportRow[];
  errors: string[];
} {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { rows: [], errors: ["CSV needs a header row and at least one contact."] };
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const errors: string[] = [];
  const rows: CrmImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] ?? "";
    });

    let firstName = cell(record, "first_name", "firstname", "first", "given_name");
    let lastName = cell(record, "last_name", "lastname", "last", "surname", "family_name");
    const fullName = cell(record, "name", "dj_name", "full_name");

    if (!firstName && fullName) {
      const parts = fullName.split(/\s+/);
      firstName = parts[0] ?? "";
      lastName = parts.slice(1).join(" ");
    }

    if (!firstName) {
      errors.push(`Row ${i + 1}: missing first name.`);
      continue;
    }

    const categoryRaw = cell(record, "category", "type", "role");
    const category: CrmCategory =
      categoryRaw.toLowerCase() === "brand" ? "Brand" : "DJ";

    rows.push({
      first_name: firstName,
      last_name: lastName || null,
      category,
      phone_number:
        cell(record, "phone_number", "phone", "mobile", "tel") || null,
      email: cell(record, "email", "e_mail", "email_address") || null,
      onboarding_status: normalizeStatus(
        cell(record, "onboarding_status", "status")
      ),
      notes: cell(record, "notes", "note", "comments") || null,
    });
  }

  return { rows, errors };
}

export async function importContacts(
  rows: CrmImportRow[]
): Promise<
  | { ok: true; imported: number; skipped: number }
  | { ok: false; message: string }
> {
  if (rows.length === 0) {
    return { ok: false, message: "No valid contacts found in the CSV." };
  }

  const existing = await listContacts();
  const seenEmails = new Set(
    (existing.ok ? existing.contacts : [])
      .map((contact) => contact.email?.trim().toLowerCase())
      .filter((email): email is string => Boolean(email))
  );

  const toInsert: CrmImportRow[] = [];
  let skipped = 0;

  for (const row of rows) {
    const email = row.email?.trim().toLowerCase() || null;
    if (email && seenEmails.has(email)) {
      skipped += 1;
      continue;
    }
    if (email) seenEmails.add(email);
    toInsert.push({
      ...row,
      email: email,
      last_name: row.last_name?.trim() || null,
      phone_number: row.phone_number?.trim() || null,
      notes: row.notes?.trim() || null,
    });
  }

  if (toInsert.length === 0) {
    return { ok: true, imported: 0, skipped };
  }

  const chunkSize = 100;
  for (let i = 0; i < toInsert.length; i += chunkSize) {
    const chunk = toInsert.slice(i, i + chunkSize);
    const { error } = await (supabase as any).from("crm_contacts").insert(chunk);
    if (error) {
      return {
        ok: false,
        message: error.message ?? "Failed to import contacts.",
      };
    }
  }

  return { ok: true, imported: toInsert.length, skipped };
}

function splitPersonName(fullName: string): {
  first_name: string;
  last_name: string | null;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { first_name: fullName.trim() || "Invite", last_name: null };
  }
  if (parts.length === 1) {
    return { first_name: parts[0], last_name: null };
  }
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
  };
}

/** Create or update a Launch CRM contact after sending a brand or DJ invite. */
export async function upsertContactFromInvite(params: {
  name: string;
  email: string;
  category: CrmCategory;
  note?: string | null;
}): Promise<
  | { ok: true; created: boolean }
  | { ok: false; message: string }
> {
  const email = params.email.trim().toLowerCase();
  if (!email) {
    return { ok: false, message: "Email is required to sync Launch CRM." };
  }

  const names =
    params.category === "Brand"
      ? { first_name: params.name.trim(), last_name: null }
      : splitPersonName(params.name);

  const stamp = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const inviteNote = params.note?.trim()
    ? `Invited ${stamp}: ${params.note.trim()}`
    : `Invited ${stamp} via R/HOOD admin.`;

  const existing = await listContacts();
  if (!existing.ok) {
    return { ok: false, message: existing.message };
  }

  const match = existing.contacts.find(
    (contact) => contact.email?.trim().toLowerCase() === email
  );

  if (match) {
    const keepStatus =
      match.onboarding_status === "Not Contacted"
        ? "Contacted"
        : match.onboarding_status;
    const notes = match.notes?.trim()
      ? `${match.notes.trim()}\n${inviteNote}`
      : inviteNote;

    const updated = await updateContact(match.id, {
      onboarding_status: keepStatus,
      notes,
      first_name: match.first_name || names.first_name,
      last_name: match.last_name ?? names.last_name,
    });
    if (!updated.ok) return updated;
    return { ok: true, created: false };
  }

  const created = await createContact({
    first_name: names.first_name,
    last_name: names.last_name,
    category: params.category,
    phone_number: null,
    email,
    onboarding_status: "Contacted",
    notes: inviteNote,
  });
  if (!created.ok) return created;
  return { ok: true, created: true };
}

