export const PRODUCT_FORMATS = ["whole_bean", "ground_coffee", "capsule", "other"] as const;
export type ProductFormat = (typeof PRODUCT_FORMATS)[number];

export const PRODUCT_FORMAT_LABELS: Record<ProductFormat, string> = {
  whole_bean: "Whole bean",
  ground_coffee: "Ground coffee",
  capsule: "Capsule / pod",
  other: "Other coffee",
};

export const REFERENCE_SOURCE_TYPES = ["personal_entry", "roaster_official", "retailer", "open_data", "other"] as const;
export type ReferenceSourceType = (typeof REFERENCE_SOURCE_TYPES)[number];

export type CoffeeProductIdentity = {
  id: string;
  name: string;
  roaster: string | null;
  product_format: ProductFormat;
};

export function supportsBeanMetadata(format: ProductFormat) {
  return format === "whole_bean" || format === "ground_coffee";
}

export function supportsCapsuleMetadata(format: ProductFormat) {
  return format === "capsule";
}
