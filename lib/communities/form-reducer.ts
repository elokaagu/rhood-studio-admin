import type { CommunityEditFormFields, CommunityForEdit } from "./types";

export type CommunityEditFormAction =
  | { type: "PATCH"; patch: Partial<CommunityEditFormFields> }
  | { type: "HYDRATE"; community: CommunityForEdit }
  | { type: "RESET" };

export function createEmptyCommunityEditForm(): CommunityEditFormFields {
  return {
    name: "",
    description: "",
    imageUrl: null,
    location: "Global",
  };
}

export function communityFromRecord(c: CommunityForEdit): CommunityEditFormFields {
  return {
    name: c.name || "",
    description: c.description || "",
    imageUrl: c.image_url,
    location: c.location || "Global",
  };
}

export function communityEditFormReducer(
  state: CommunityEditFormFields,
  action: CommunityEditFormAction
): CommunityEditFormFields {
  switch (action.type) {
    case "PATCH":
      return { ...state, ...action.patch };
    case "HYDRATE":
      return communityFromRecord(action.community);
    case "RESET":
      return createEmptyCommunityEditForm();
  }
}
