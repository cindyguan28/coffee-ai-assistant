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

function withoutField(value: Record<string, string | number | null>, field: string) {
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== field));
}

async function ownedBeanExists(beanId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("beans").select("id").eq("id", beanId).eq("user_id", userId).maybeSingle();
  return Boolean(data);
}

export async function updateEquipment(formData: FormData) {
  const userId = await requireCurrentUserId();
  const machine = String(formData.get("default_machine_model") ?? "").trim().slice(0, 200) || null;
  const grinder = String(formData.get("default_grinder_type") ?? "").trim().slice(0, 200) || null;
  const method = String(formData.get("default_brew_method") ?? "").trim().slice(0, 100) || null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .update({ default_machine_model: machine, default_grinder_type: grinder, default_brew_method: method })
    .eq("user_id", userId)
    .select("user_id")
    .single();
  if (error || !data) redirect(destination("error", "Your equipment could not be saved. Apply the latest database migration and try again."));
  revalidatePath("/space/brews");
  redirect(destination("message", "Your default equipment was saved."));
}

export async function addBrewLog(formData: FormData) {
  const userId = await requireCurrentUserId();
  const validated = validateBrewLog(formData);
  if (!validated.ok) redirect(destination("error", validated.message));
  const beanId = String(validated.value.bean_id);
  if (!(await ownedBeanExists(beanId, userId))) redirect(destination("error", "Choose one of your own beans."));

  const supabase = await createClient();
  let { error } = await supabase.from("brew_logs").insert({ ...validated.value, user_id: userId });
  if (missingColumn(error, "water_temp_c")) {
    if (validated.value.water_temp_c !== null) redirect(destination("error", "Apply the latest database migration before saving water temperature."));
    ({ error } = await supabase.from("brew_logs").insert({ ...withoutField(validated.value, "water_temp_c"), user_id: userId }));
  }
  if (error) redirect(destination("error", "The journal entry could not be saved. Try again."));
  revalidateCoffeeSpace();
  redirect(destination("message", "Entry saved to your private Brew Journal."));
}

export async function updateBrewLog(formData: FormData) {
  const userId = await requireCurrentUserId();
  const logId = String(formData.get("log_id") ?? "").trim();
  const validated = validateBrewLog(formData);
  if (!logId || !validated.ok) redirect(destination("error", validated.ok ? "Journal entry not found." : validated.message));
  const beanId = String(validated.value.bean_id);
  if (!(await ownedBeanExists(beanId, userId))) redirect(destination("error", "Choose one of your own beans."));

  const supabase = await createClient();
  let { error } = await supabase.from("brew_logs").update(validated.value).eq("id", logId).eq("user_id", userId);
  if (missingColumn(error, "water_temp_c")) {
    if (validated.value.water_temp_c !== null) redirect(destination("error", "Apply the latest database migration before saving water temperature."));
    ({ error } = await supabase.from("brew_logs").update(withoutField(validated.value, "water_temp_c")).eq("id", logId).eq("user_id", userId));
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
