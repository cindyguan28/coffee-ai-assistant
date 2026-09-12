export const LIBRARY_VIEWS = ["all", "current", "favorites", "try", "buy-again", "not-for-me", "finished"] as const;
export type LibraryView = (typeof LIBRARY_VIEWS)[number];

export type CoffeeLibraryState = {
  favorite: boolean;
  lifecycle_state: string | null;
  repurchase_intent: string | null;
};

export type BeanSchemaAvailability = {
  library: boolean;
  species: boolean;
  origins: boolean;
  packageWeight: boolean;
  product: boolean;
  profileSource: boolean;
};

export function beanSelectFields(available: BeanSchemaAvailability) {
  return [
    "id,name,roaster,country,process,roast_level,price,weblink,flavor_notes,acidity,body,sweetness,milk_compatibility,notes,created_at",
    available.origins ? "origin_countries" : "",
    available.species ? "species,arabica_percentage" : "",
    available.library ? "favorite,lifecycle_state,repurchase_intent" : "",
    available.packageWeight ? "package_weight_g" : "",
    available.product ? "product_format,capsule_system,capsule_line,capsule_intensity" : "",
    `bean_profiles(predicted_acidity,predicted_body,predicted_sweetness,predicted_notes,recommended_method,recommended_ratio,recommended_temp,confidence,reasoning${available.profileSource ? ",reference_source_type,reference_source_name,reference_source_url" : ""})`,
  ].filter(Boolean).join(",");
}

export function libraryView(value?: string | null): LibraryView {
  return LIBRARY_VIEWS.includes(value as LibraryView) ? value as LibraryView : "all";
}

export function matchesLibraryView(bean: CoffeeLibraryState, view: LibraryView) {
  if (view === "current") return bean.lifecycle_state === "currently_have";
  if (view === "favorites") return bean.favorite;
  if (view === "try") return bean.lifecycle_state === "want_to_try";
  if (view === "buy-again") return bean.repurchase_intent === "buy_again";
  if (view === "not-for-me") return bean.repurchase_intent === "would_not_buy_again";
  if (view === "finished") return bean.lifecycle_state === "finished";
  return true;
}

export function libraryBadges(bean: CoffeeLibraryState) {
  const badges: string[] = [];
  if (bean.favorite) badges.push("Favorite");
  if (bean.lifecycle_state === "want_to_try") badges.push("Want to try");
  if (bean.lifecycle_state === "currently_have") badges.push("On hand");
  if (bean.lifecycle_state === "finished") badges.push("Finished");
  if (bean.repurchase_intent === "buy_again") badges.push("Buy again");
  if (bean.repurchase_intent === "would_not_buy_again") badges.push("Not for me");
  return badges;
}

export function validateLibraryState(field: string, rawValue: string) {
  if (field === "favorite") {
    if (rawValue === "true") return { ok: true as const, value: true };
    if (rawValue === "false") return { ok: true as const, value: false };
    return { ok: false as const };
  }
  if (field === "lifecycle_state") {
    if (rawValue === "") return { ok: true as const, value: null };
    if (["want_to_try", "currently_have", "finished"].includes(rawValue)) return { ok: true as const, value: rawValue };
    return { ok: false as const };
  }
  if (field === "repurchase_intent") {
    if (rawValue === "") return { ok: true as const, value: null };
    if (["buy_again", "would_not_buy_again"].includes(rawValue)) return { ok: true as const, value: rawValue };
    return { ok: false as const };
  }
  return { ok: false as const };
}
