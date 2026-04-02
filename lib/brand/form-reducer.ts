import type { BrandProfile, BrandProfileFormFields } from "./types";

export type BrandProfileFormAction =
  | {
      type: "SET_FIELD";
      field: keyof BrandProfileFormFields;
      value: string;
    }
  | { type: "HYDRATE_FROM_PROFILE"; profile: BrandProfile };

export function createEmptyBrandProfileForm(): BrandProfileFormFields {
  return {
    brand_name: "",
    brand_description: "",
    website: "",
  };
}

export function brandProfileFormReducer(
  state: BrandProfileFormFields,
  action: BrandProfileFormAction
): BrandProfileFormFields {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "HYDRATE_FROM_PROFILE":
      return {
        brand_name: action.profile.brand_name || "",
        brand_description: action.profile.brand_description || "",
        website: action.profile.website || "",
      };
  }
}
