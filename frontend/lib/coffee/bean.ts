import { PRODUCT_FORMATS, REFERENCE_SOURCE_TYPES, type ProductFormat, type ReferenceSourceType } from "./product";
export { PRODUCT_FORMATS, REFERENCE_SOURCE_TYPES, type ProductFormat, type ReferenceSourceType } from "./product";

export type CoffeeProductPayload = {
  name: string;
  roaster: string | null;
  product_format: ProductFormat;
  capsule_system: string | null;
  capsule_line: string | null;
  capsule_intensity: number | null;
  country: string | null;
  origin_countries: string[] | null;
  species: string | null;
  arabica_percentage: number | null;
  process: string | null;
  roast_level: string | null;
  price: number | null;
  package_weight_g: number | null;
  weblink: string | null;
  flavor_notes: string | null;
  acidity: string | null;
  body: string | null;
  sweetness: string | null;
  milk_compatibility: string | null;
  notes: string | null;
  reference_source_type: ReferenceSourceType;
  reference_source_name: string | null;
};

// Keep the public name while callers migrate from Bean to Coffee Product terminology.
export type BeanPayload = CoffeeProductPayload;

export type BeanValidation = { ok: true; value: BeanPayload } | { ok: false; message: string };

export function normalizeGuidedValue(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

export function compatibleGuidedValue(value: string | null | undefined, options: readonly string[]) {
  const saved = String(value ?? "").trim();
  if (!saved) return "";
  const normalized = normalizeGuidedValue(saved);
  return options.find((option) => normalizeGuidedValue(option) === normalized) ?? saved;
}

function text(formData: FormData, field: string, maxLength = 500) {
  return String(formData.get(field) ?? "").trim().slice(0, maxLength) || null;
}

function optionalNumber(formData: FormData, field: string, maximum: number) {
  const raw = text(formData, field, 30);
  if (raw === null) return { ok: true as const, value: null };
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 && value <= maximum
    ? { ok: true as const, value }
    : { ok: false as const };
}

function flavorNotes(formData: FormData) {
  const selected = formData.getAll("flavor_notes").map(String);
  const custom = String(formData.get("custom_flavor_notes") ?? "").split(",");
  const values = [...selected, ...custom].map((value) => value.trim()).filter(Boolean);
  const unique = [...new Map(values.map((value) => [value.toLowerCase(), value])).values()];
  return unique.length ? unique.join(",") : null;
}

export function parseOriginCountries(value?: string | null) {
  return [...new Map(
    String(value ?? "")
      .split(/\s*(?:,|\/|;)\s*/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => [normalizeGuidedValue(item), item]),
  ).values()];
}

function originCountries(formData: FormData) {
  const selected = formData.getAll("origin_countries").map(String);
  const fallback = selected.length ? selected : parseOriginCountries(text(formData, "country", 500));
  return [...new Map(
    fallback.map((item) => item.trim()).filter(Boolean).map((item) => [normalizeGuidedValue(item), item.slice(0, 100)]),
  ).values()];
}

export function validateBean(formData: FormData): BeanValidation {
  const name = text(formData, "name", 200);
  if (!name) return { ok: false, message: "Enter a coffee name." };
  const price = optionalNumber(formData, "price", 1_000_000);
  if (!price.ok) return { ok: false, message: "Enter a valid non-negative price." };
  const packageWeight = optionalNumber(formData, "package_weight_g", 100_000);
  if (!packageWeight.ok || (packageWeight.value !== null && packageWeight.value <= 0)) {
    return { ok: false, message: "Enter a valid package weight above zero." };
  }
  const origins = originCountries(formData);
  if (origins.length > 12) return { ok: false, message: "Choose no more than 12 origin countries." };
  const species = text(formData, "species", 50);
  const supportedSpecies = ["100% Arabica", "100% Robusta", "Blend", "Other", "Unknown"];
  if (species && !supportedSpecies.includes(species)) return { ok: false, message: "Choose a valid coffee species." };
  const arabicaPercentage = optionalNumber(formData, "arabica_percentage", 100);
  if (!arabicaPercentage.ok || (arabicaPercentage.value !== null && !Number.isInteger(arabicaPercentage.value))) {
    return { ok: false, message: "Enter a whole Arabica percentage between 0 and 100." };
  }
  if (species !== "Blend" && arabicaPercentage.value !== null) {
    return { ok: false, message: "Only add a composition percentage for a blend." };
  }
  const productFormat = text(formData, "product_format", 50) || "whole_bean";
  if (!PRODUCT_FORMATS.includes(productFormat as ProductFormat)) {
    return { ok: false, message: "Choose a valid coffee format." };
  }
  const capsuleIntensity = optionalNumber(formData, "capsule_intensity", 15);
  if (!capsuleIntensity.ok || (capsuleIntensity.value !== null && (!Number.isInteger(capsuleIntensity.value) || capsuleIntensity.value < 1))) {
    return { ok: false, message: "Enter a capsule intensity between 1 and 15." };
  }
  if (productFormat !== "capsule" && capsuleIntensity.value !== null) {
    return { ok: false, message: "Only add capsule intensity for a capsule product." };
  }
  const sourceType = text(formData, "reference_source_type", 50) || "personal_entry";
  if (!REFERENCE_SOURCE_TYPES.includes(sourceType as ReferenceSourceType)) {
    return { ok: false, message: "Choose a valid reference source." };
  }

  return { ok: true, value: {
    name,
    roaster: text(formData, "roaster", 200),
    product_format: productFormat as ProductFormat,
    capsule_system: productFormat === "capsule" ? text(formData, "capsule_system", 200) : null,
    capsule_line: productFormat === "capsule" ? text(formData, "capsule_line", 200) : null,
    capsule_intensity: productFormat === "capsule" ? capsuleIntensity.value : null,
    country: origins.length ? origins.join(", ") : null,
    origin_countries: origins.length ? origins : null,
    species,
    arabica_percentage: species === "Blend" ? arabicaPercentage.value : null,
    process: text(formData, "process", 100),
    roast_level: text(formData, "roast_level", 100),
    price: price.value,
    package_weight_g: packageWeight.value,
    weblink: text(formData, "weblink", 1000),
    flavor_notes: flavorNotes(formData),
    acidity: text(formData, "acidity", 100),
    body: text(formData, "body", 100),
    sweetness: text(formData, "sweetness", 100),
    milk_compatibility: text(formData, "milk_compatibility", 100),
    notes: text(formData, "notes", 2000),
    reference_source_type: sourceType as ReferenceSourceType,
    reference_source_name: text(formData, "reference_source_name", 200),
  } };
}

export function coffeeProductRecord(payload: CoffeeProductPayload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => key !== "reference_source_type" && key !== "reference_source_name"),
  ) as Omit<CoffeeProductPayload, "reference_source_type" | "reference_source_name">;
}

export function referenceProfileSource(payload: CoffeeProductPayload) {
  return {
    reference_source_type: payload.reference_source_type,
    reference_source_name: payload.reference_source_name,
    reference_source_url: payload.weblink,
  };
}
