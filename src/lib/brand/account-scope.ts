export type BrandScopedProfile = {
  id: string;
  brand_account_id?: string | null;
};

/** Owner id for a brand user. Teammates share this so listings stay on one account. */
export function brandAccountId(
  profile: BrandScopedProfile | null | undefined
): string | null {
  if (!profile?.id) return null;
  return profile.brand_account_id?.trim() || profile.id;
}
