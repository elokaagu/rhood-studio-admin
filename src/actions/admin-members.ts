"use server";

import { deleteMemberAdminServer } from "@/lib/admin/members/member-deletion-server";

export async function deleteAdminMemberAction(
  memberId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!memberId?.trim()) {
    return { ok: false, message: "Missing member id." };
  }
  return deleteMemberAdminServer(memberId.trim());
}
