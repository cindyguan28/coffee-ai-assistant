"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserId } from "../../../lib/auth/user";
import { coffeeProductRecord, referenceProfileSource, validateBean } from "../../../lib/coffee/bean";
import { generateBeanProfile } from "../../../lib/coffee/profile";
import { validateLibraryState } from "../../../lib/coffee/library";
import { createClient } from "../../../lib/supabase/server";

function text(formData: FormData, field: string, maxLength = 500) {
  return String(formData.get(field) ?? "").trim().slice(0, maxLength) || null;
}

function message(kind: "error" | "message", value: string) {
  return `/space/beans?${kind}=${encodeURIComponent(value)}`;
}

function libraryMessage(kind: "error" | "message", value: string, view: string) {
  const params = new URLSearchParams({ [kind]: value });
  if (view && view !== "all") params.set("view", view);
  return `/space/beans?${params.toString()}`;
}

function revalidateCoffeeSpace() {
  revalidatePath("/space");
  revalidatePath("/space/beans");
  revalidatePath("/space/brews");
  revalidatePath("/space/taste");
  revalidatePath("/space/world");
}

function missingPackageWeight(error: { code?: string; message?: string } | null) {
  return Boolean(error && (error.code === "42703" || error.code === "PGRST204" || error.message?.includes("package_weight_g")));
}

function missingOriginCountries(error: { code?: string; message?: string } | null) {
  return Boolean(error && (error.code === "42703" || error.code === "PGRST204") && error.message?.includes("origin_countries"));
}

function missingSpecies(error: { code?: string; message?: string } | null) {
  return Boolean(error && (error.code === "42703" || error.code === "PGRST204") && (error.message?.includes("species") || error.message?.includes("arabica_percentage")));
}

function missingCoffeeProduct(error: { code?: string; message?: string } | null) {
  return Boolean(error && (error.code === "42703" || error.code === "PGRST204") && (
    error.message?.includes("product_format") || error.message?.includes("capsule_system") ||
    error.message?.includes("capsule_line") || error.message?.includes("capsule_intensity")
  ));
}

function missingProfileSource(error: { code?: string; message?: string } | null) {
  return Boolean(error && (error.code === "42703" || error.code === "PGRST204") && error.message?.includes("reference_source"));
}

function withoutPackageWeight<T extends Record<string, unknown>>(bean: T) {
  return Object.fromEntries(Object.entries(bean).filter(([key]) => key !== "package_weight_g"));
}

function withoutOriginCountries<T extends Record<string, unknown>>(bean: T) {
  return Object.fromEntries(Object.entries(bean).filter(([key]) => key !== "origin_countries"));
}

function withoutSpecies<T extends Record<string, unknown>>(bean: T) {
  return Object.fromEntries(Object.entries(bean).filter(([key]) => key !== "species" && key !== "arabica_percentage"));
}

function withoutCoffeeProduct<T extends Record<string, unknown>>(bean: T) {
  return Object.fromEntries(Object.entries(bean).filter(([key]) => !["product_format", "capsule_system", "capsule_line", "capsule_intensity"].includes(key)));
}

function withoutProfileSource<T extends Record<string, unknown>>(profile: T) {
  return Object.fromEntries(Object.entries(profile).filter(([key]) => !key.startsWith("reference_source_")));
}

export async function addBean(formData: FormData) {
  const userId = await requireCurrentUserId();
  const validation = validateBean(formData);
  if (!validation.ok) redirect(message("error", validation.message));

  const bean = { user_id: userId, ...coffeeProductRecord(validation.value) };
  const supabase = await createClient();
  let compatibleBean = bean;
  let { data, error } = await supabase.from("beans").insert(compatibleBean).select("id").single();
  if (missingCoffeeProduct(error)) {
    if (validation.value.product_format !== "whole_bean" || validation.value.capsule_system || validation.value.capsule_line || validation.value.capsule_intensity) {
      redirect(message("error", "Coffee format was not saved because migration 202609120001_coffee_product_and_taste_layers.sql is missing."));
    }
    compatibleBean = withoutCoffeeProduct(bean) as typeof bean;
    ({ data, error } = await supabase.from("beans").insert(compatibleBean).select("id").single());
  }
  if (missingSpecies(error)) {
    if (validation.value.species !== null) {
      redirect(message("error", "Species was not saved because the database migration is missing. Apply 202609110002_bean_species_composition.sql and try again."));
    }
    compatibleBean = withoutSpecies(compatibleBean) as typeof bean;
    ({ data, error } = await supabase.from("beans").insert(compatibleBean).select("id").single());
  }
  if (missingOriginCountries(error)) {
    compatibleBean = withoutOriginCountries(compatibleBean) as typeof bean;
    ({ data, error } = await supabase.from("beans").insert(compatibleBean).select("id").single());
  }
  if (missingPackageWeight(error)) {
    if (validation.value.package_weight_g !== null) {
      redirect(message("error", "Package weight was not saved because the database migration is missing. Apply 202609080002_bean_package_weight.sql and try again."));
    }
    ({ data, error } = await supabase.from("beans").insert(withoutPackageWeight(compatibleBean)).select("id").single());
  }
  if (error || !data) redirect(message("error", "The bean could not be saved. Try again."));

  const profile = { ...generateBeanProfile(bean), ...referenceProfileSource(validation.value) };
  let { error: profileError } = await supabase.from("bean_profiles").insert({ bean_id: data.id, ...profile });
  if (missingProfileSource(profileError)) {
    ({ error: profileError } = await supabase.from("bean_profiles").insert({ bean_id: data.id, ...withoutProfileSource(profile) }));
  }
  if (profileError) {
    revalidateCoffeeSpace();
    redirect(message("error", `${bean.name} was saved, but its Bean Profile could not be generated. Use Generate profile to retry.`));
  }

  revalidateCoffeeSpace();
  redirect(message("message", `${bean.name} and its Bean Profile were saved.`));
}

export async function updateBean(formData: FormData) {
  const userId = await requireCurrentUserId();
  const beanId = text(formData, "beanId", 100);
  if (!beanId) redirect(message("error", "Bean not found."));
  const validation = validateBean(formData);
  if (!validation.ok) redirect(message("error", validation.message));

  const supabase = await createClient();
  let compatibleBean = coffeeProductRecord(validation.value);
  let { data, error } = await supabase
    .from("beans")
    .update(compatibleBean)
    .eq("id", beanId)
    .eq("user_id", userId)
    .select("id")
    .single();
  if (missingCoffeeProduct(error)) {
    if (validation.value.product_format !== "whole_bean" || validation.value.capsule_system || validation.value.capsule_line || validation.value.capsule_intensity) {
      redirect(message("error", "Coffee format was not saved because migration 202609120001_coffee_product_and_taste_layers.sql is missing."));
    }
    compatibleBean = withoutCoffeeProduct(compatibleBean) as typeof compatibleBean;
    ({ data, error } = await supabase
      .from("beans")
      .update(compatibleBean)
      .eq("id", beanId)
      .eq("user_id", userId)
      .select("id")
      .single());
  }
  if (missingSpecies(error)) {
    if (validation.value.species !== null) {
      redirect(message("error", "Species was not saved because the database migration is missing. Apply 202609110002_bean_species_composition.sql and try again."));
    }
    compatibleBean = withoutSpecies(compatibleBean) as typeof compatibleBean;
    ({ data, error } = await supabase
      .from("beans")
      .update(compatibleBean)
      .eq("id", beanId)
      .eq("user_id", userId)
      .select("id")
      .single());
  }
  if (missingOriginCountries(error)) {
    compatibleBean = withoutOriginCountries(compatibleBean) as typeof compatibleBean;
    ({ data, error } = await supabase
      .from("beans")
      .update(compatibleBean)
      .eq("id", beanId)
      .eq("user_id", userId)
      .select("id")
      .single());
  }
  if (missingPackageWeight(error)) {
    if (validation.value.package_weight_g !== null) {
      redirect(message("error", "Package weight was not saved because the database migration is missing. Apply 202609080002_bean_package_weight.sql and try again."));
    }
    ({ data, error } = await supabase
      .from("beans")
      .update(withoutPackageWeight(compatibleBean))
      .eq("id", beanId)
      .eq("user_id", userId)
      .select("id")
      .single());
  }
  if (error || !data) redirect(message("error", "The bean could not be updated."));

  const profile = { ...generateBeanProfile(validation.value), ...referenceProfileSource(validation.value) };
  let { error: profileError } = await supabase.from("bean_profiles").upsert(
    { bean_id: beanId, ...profile, generated_at: new Date().toISOString() },
    { onConflict: "bean_id" },
  );
  if (missingProfileSource(profileError)) {
    ({ error: profileError } = await supabase.from("bean_profiles").upsert(
      { bean_id: beanId, ...withoutProfileSource(profile), generated_at: new Date().toISOString() },
      { onConflict: "bean_id" },
    ));
  }
  if (profileError) redirect(message("error", "The bean was updated, but its Profile could not be refreshed."));

  revalidateCoffeeSpace();
  redirect(message("message", `${validation.value.name} and its Bean Profile were updated.`));
}

export async function regenerateBeanProfile(formData: FormData) {
  const userId = await requireCurrentUserId();
  const beanId = text(formData, "beanId", 100);
  if (!beanId) redirect(message("error", "Bean not found."));

  const supabase = await createClient();
  const { data: bean, error: beanError } = await supabase
    .from("beans")
    .select("name,country,process,roast_level,flavor_notes")
    .eq("id", beanId)
    .eq("user_id", userId)
    .single();
  if (beanError || !bean) redirect(message("error", "Bean not found or not accessible."));

  const profile = generateBeanProfile(bean);
  const { error } = await supabase.from("bean_profiles").upsert(
    { bean_id: beanId, ...profile, generated_at: new Date().toISOString() },
    { onConflict: "bean_id" },
  );
  if (error) redirect(message("error", "The Bean Profile could not be generated. Try again."));

  revalidateCoffeeSpace();
  redirect(message("message", `${bean.name} Bean Profile generated.`));
}

export async function updateBeanLibraryState(formData: FormData) {
  const userId = await requireCurrentUserId();
  const beanId = text(formData, "beanId", 100);
  const field = text(formData, "field", 50) ?? "";
  const value = String(formData.get("value") ?? "");
  const view = text(formData, "view", 30) ?? "all";
  if (!beanId) redirect(libraryMessage("error", "Coffee not found.", view));

  const state = validateLibraryState(field, value);
  if (!state.ok) redirect(libraryMessage("error", "That library status is not valid.", view));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("beans")
    .update({ [field]: state.value })
    .eq("id", beanId)
    .eq("user_id", userId)
    .select("id")
    .single();
  if (error?.code === "42703" || error?.code === "PGRST204") {
    redirect(libraryMessage("error", "Library status was not saved because migration 202609110003_coffee_library_states.sql is missing.", view));
  }
  if (error || !data) redirect(libraryMessage("error", "Library status could not be updated.", view));

  revalidateCoffeeSpace();
  redirect(libraryMessage("message", "Coffee library updated.", view));
}

export async function deleteBean(formData: FormData) {
  const userId = await requireCurrentUserId();
  const beanId = text(formData, "beanId", 100);
  if (!beanId) redirect(message("error", "Bean not found."));
  const supabase = await createClient();
  const { error } = await supabase.from("beans").delete().eq("id", beanId).eq("user_id", userId);
  if (error) redirect(message("error", "The bean could not be removed."));
  revalidateCoffeeSpace();
  redirect(message("message", "Bean removed."));
}
