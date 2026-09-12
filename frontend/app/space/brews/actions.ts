"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserId } from "../../../lib/auth/user";
import { validateBrewLog } from "../../../lib/coffee/brew";
import { createClient } from "../../../lib/supabase/server";

function destination(kind: "error" | "message", value: string) {
  return `/space/brews?${kind}=${encodeURIComponent(value)}`;
}

function revalidateCoffeeSpace() {
  revalidatePath("/space");
  revalidatePath("/space/brews");
  revalidatePath("/space/taste");
  revalidatePath("/space/world");
}

function missingColumn(error: { code?: string; message?: string } | null, column: string) {
  return Boolean(error && (error.code === "42703" || error.code === "PGRST204" || error.message?.includes(column)));
}

function withoutField(value: Record<string, string | number | string[] | null>, field: string) {
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== field));
}

const OPTIONAL_MIGRATION_FIELDS = ["water_temp_c", "milk_pairing", "perceived_flavor_notes", "normalized_flavor_families", "taste_description"] as const;

function missingOptionalField(error: { code?: string; message?: string } | null) {
  return OPTIONAL_MIGRATION_FIELDS.find((field) => missingColumn(error, field));
}

function hasOptionalValue(value: string | number | string[] | null | undefined) {
  return Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined;
}

async function ownedCoffeeProduct(beanId: string, userId: string) {
  const supabase = await createClient();
  const result = await supabase.from("beans").select("id,product_format").eq("id", beanId).eq("user_id", userId).maybeSingle();
  if (missingColumn(result.error, "product_format")) {
    const legacy = await supabase.from("beans").select("id").eq("id", beanId).eq("user_id", userId).maybeSingle();
    return legacy.data ? { id: legacy.data.id, product_format: "whole_bean" } : null;
  }
  return result.data;
}

export async function updateEquipment(formData: FormData) {
  const userId = await requireCurrentUserId();
  const machine = String(formData.get("default_machine_model") ?? "").trim().slice(0, 200) || null;
  const grinder = String(formData.get("default_grinder_type") ?? "").trim().slice(0, 200) || null;
  const method = String(formData.get("default_brew_method") ?? "").trim().slice(0, 100) || null;
  const supabase = await createClient();
  let { data, error } = await supabase
    .from("user_profiles")
    .update({ default_machine_model: machine, default_grinder_type: grinder, default_brew_method: method })
    .eq("user_id", userId)
    .select("user_id")
    .single();
  if (missingColumn(error, "default_brew_method") && method === null) {
    ({ data, error } = await supabase
      .from("user_profiles")
      .update({ default_machine_model: machine, default_grinder_type: grinder })
      .eq("user_id", userId)
      .select("user_id")
      .single());
  }
  if (error || !data) redirect(destination("error", "Your equipment could not be saved. Apply the latest database migration and try again."));
  revalidatePath("/space/brews");
  redirect(destination("message", "Your default equipment was saved."));
}

export async function addBrewLog(formData: FormData) {
  const userId = await requireCurrentUserId();
  const beanId = String(formData.get("bean_id") ?? "").trim();
  const product = beanId ? await ownedCoffeeProduct(beanId, userId) : null;
  if (!product) redirect(destination("error", "Choose one of your own coffees."));
  formData.set("product_format", product.product_format ?? "whole_bean");
  const validated = validateBrewLog(formData);
  if (!validated.ok) redirect(destination("error", validated.message));

  const supabase = await createClient();
  let payload = validated.value;
  let { error } = await supabase.from("brew_logs").insert({ ...payload, user_id: userId });
  for (let attempt = 0; error && attempt < OPTIONAL_MIGRATION_FIELDS.length; attempt += 1) {
    const field = missingOptionalField(error);
    if (!field) break;
    if (hasOptionalValue(validated.value[field])) redirect(destination("error", `Apply migration 202609120001 before saving ${field.replaceAll("_", " ")}.`));
    payload = withoutField(payload, field);
    ({ error } = await supabase.from("brew_logs").insert({ ...payload, user_id: userId }));
  }
  if (error) redirect(destination("error", "The journal entry could not be saved. Try again."));
  revalidateCoffeeSpace();
  redirect(destination("message", "Entry saved to your private Brew Journal."));
}

export async function updateBrewLog(formData: FormData) {
  const userId = await requireCurrentUserId();
  const logId = String(formData.get("log_id") ?? "").trim();
  const beanId = String(formData.get("bean_id") ?? "").trim();
  const product = beanId ? await ownedCoffeeProduct(beanId, userId) : null;
  if (!product) redirect(destination("error", "Choose one of your own coffees."));
  formData.set("product_format", product.product_format ?? "whole_bean");
  const validated = validateBrewLog(formData);
  if (!logId || !validated.ok) redirect(destination("error", validated.ok ? "Journal entry not found." : validated.message));

  const supabase = await createClient();
  let payload = validated.value;
  let { error } = await supabase.from("brew_logs").update(payload).eq("id", logId).eq("user_id", userId);
  for (let attempt = 0; error && attempt < OPTIONAL_MIGRATION_FIELDS.length; attempt += 1) {
    const field = missingOptionalField(error);
    if (!field) break;
    if (hasOptionalValue(validated.value[field])) redirect(destination("error", `Apply migration 202609120001 before saving ${field.replaceAll("_", " ")}.`));
    payload = withoutField(payload, field);
    ({ error } = await supabase.from("brew_logs").update(payload).eq("id", logId).eq("user_id", userId));
  }
  if (error) redirect(destination("error", "The journal entry could not be updated."));
  revalidateCoffeeSpace();
  redirect(destination("message", "Journal entry updated."));
}

export async function deleteBrewLog(formData: FormData) {
  const userId = await requireCurrentUserId();
  const logId = String(formData.get("log_id") ?? "").trim();
  if (!logId) redirect(destination("error", "Journal entry not found."));
  const supabase = await createClient();
  const { error } = await supabase.from("brew_logs").delete().eq("id", logId).eq("user_id", userId);
  if (error) redirect(destination("error", "The journal entry could not be removed."));
  revalidateCoffeeSpace();
  redirect(destination("message", "Journal entry removed."));
}
