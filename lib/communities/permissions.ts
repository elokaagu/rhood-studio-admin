import type { UserRole } from "@/lib/auth-utils";

/**
 * Admins may edit any community; others only if they created it.
 * If `created_by` is null, only admins may edit.
 */
export function canUserEditCommunity(
  viewerId: string | null,
  viewerRole: UserRole | undefined,
  communityCreatedBy: string | null
): boolean {
  if (!viewerId) return false;
  if (viewerRole === "admin") return true;
  if (!communityCreatedBy) return false;
  return communityCreatedBy === viewerId;
}
