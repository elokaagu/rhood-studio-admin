import { supabase } from "@/integrations/supabase/client";
import { getPortalBaseUrl } from "@/lib/portal-url";
import { defaultQrDestinationUrl, qrShortPath } from "@/lib/qr/constants";

function fromUntyped(table: string) {
  return (supabase as unknown as { from: (name: string) => any }).from(table);
}

export type QrCodeRow = {
  id: string;
  code: string;
  name: string;
  opportunity_id: string | null;
  destination_url: string;
  is_active: boolean;
  created_at: string;
  scanCount: number;
  uniqueVisitors: number;
  conversions: number;
  shortUrl: string;
};

function randomCode(length = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function listQrCodes(): Promise<
  { ok: true; codes: QrCodeRow[] } | { ok: false; message: string }
> {
  const { data, error } = await fromUntyped("qr_codes")
    .select("id, code, name, opportunity_id, destination_url, is_active, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    return { ok: false, message: error.message || "Could not load QR codes." };
  }

  const rows = (data || []) as Array<{
    id: string;
    code: string;
    name: string;
    opportunity_id: string | null;
    destination_url: string;
    is_active: boolean;
    created_at: string;
  }>;
  const ids = rows.map((r) => r.id);
  const scansByCode = new Map<string, { total: number; visitors: Set<string>; conversions: number }>();

  if (ids.length > 0) {
    const { data: scans } = await fromUntyped("qr_scans")
      .select("qr_code_id, visitor_hash, converted_at")
      .in("qr_code_id", ids);
    for (const scan of (scans || []) as Array<{
      qr_code_id: string;
      visitor_hash: string | null;
      converted_at: string | null;
    }>) {
      const cur = scansByCode.get(scan.qr_code_id) ?? {
        total: 0,
        visitors: new Set<string>(),
        conversions: 0,
      };
      cur.total += 1;
      if (scan.visitor_hash) cur.visitors.add(scan.visitor_hash);
      if (scan.converted_at) cur.conversions += 1;
      scansByCode.set(scan.qr_code_id, cur);
    }
  }

  const base = getPortalBaseUrl();
  return {
    ok: true,
    codes: rows.map((row) => {
      const stats = scansByCode.get(row.id);
      return {
        ...row,
        scanCount: stats?.total ?? 0,
        uniqueVisitors: stats?.visitors.size ?? 0,
        conversions: stats?.conversions ?? 0,
        shortUrl: `${base}${qrShortPath(row.code)}`,
      };
    }),
  };
}

export async function createQrCode(input: {
  name: string;
  opportunityId?: string | null;
  destinationUrl?: string | null;
}): Promise<{ ok: true; code: QrCodeRow } | { ok: false; message: string }> {
  const name = input.name.trim();
  if (!name) return { ok: false, message: "Name is required." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You must be signed in." };

  const destination =
    input.destinationUrl?.trim() || defaultQrDestinationUrl();
  let lastError = "Could not create QR code.";

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = randomCode();
    const { data, error } = await fromUntyped("qr_codes")
      .insert({
        code,
        name,
        opportunity_id: input.opportunityId || null,
        destination_url: destination,
        created_by: user.id,
        is_active: true,
      })
      .select("id, code, name, opportunity_id, destination_url, is_active, created_at")
      .single();

    if (!error && data) {
      const base = getPortalBaseUrl();
      return {
        ok: true,
        code: {
          ...data,
          scanCount: 0,
          uniqueVisitors: 0,
          conversions: 0,
          shortUrl: `${base}${qrShortPath(data.code)}`,
        },
      };
    }
    lastError = error?.message || lastError;
    if (!/duplicate|unique/i.test(error?.message || "")) break;
  }

  return { ok: false, message: lastError };
}

export async function setQrCodeActive(
  id: string,
  isActive: boolean
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await fromUntyped("qr_codes")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, message: error.message || "Could not update QR code." };
  return { ok: true };
}
