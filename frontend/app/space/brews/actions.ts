"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserId } from "../../../lib/auth/user";
import { validateBrewLog } from "../../../lib/coffee/brew";
import { createClient } from "../../../lib/supabase/server";

function destination(kind: "error" | "message", value: string) {
  return `/space/brews?${kind}=${encodeURIComponent(value)}`;
}

async function ownedBeanExists(beanId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("beans").select("id").eq("id", beanId).eq("user_id", userId).maybeSingle();
  return Boolean(data);
}

export async function addBrewLog(formData: FormData) {
  const userId = await requireCurrentUserId();
  const validated = validateBrewLog(formData);
  if (!validated.ok) redirect(destination("error", validated.message));
  const beanId = String(validated.value.bean_id);
  if (!(await ownedBeanExists(beanId, userId))) redirect(destination("error", "Choose one of your own beans."));

  const supabase = await createClient();
  const { error } = await supabase.from("brew_logs").insert({ ...validated.value, user_id: userId });
  if (error) redirect(destination("error", "The brew could not be saved. Try again."));
  revalidatePath("/space");
  revalidatePath("/space/brews");
  redirect(destination("message", "Brew saved to your private journal."));
}

export async function updateBrewLog(formData: FormData) {
  const userId = await requireCurrentUserId();
  const logId = String(formData.get("log_id") ?? "").trim();
  const validated = validateBrewLog(formData);
  if (!logId || !validated.ok) redirect(destination("error", validated.ok ? "Brew not found." : validated.message));
  const beanId = String(validated.value.bean_id);
  if (!(await ownedBeanExists(beanId, userId))) redirect(destination("error", "Choose one of your own beans."));

  const supabase = await createClient();
  const { error } = await supabase.from("brew_logs").update(validated.value).eq("id", logId).eq("user_id", userId);
  if (error) redirect(destination("error", "The brew could not be updated."));
  revalidatePath("/space");
  revalidatePath("/space/brews");
  redirect(destination("message", "Brew updated."));
}

export async function deleteBrewLog(formData: FormData) {
  const userId = await requireCurrentUserId();
  const logId = String(formData.get("log_id") ?? "").trim();
  if (!logId) redirect(destination("error", "Brew not found."));
  const supabase = await createClient();
  const { error } = await supabase.from("brew_logs").delete().eq("id", logId).eq("user_id", userId);
  if (error) redirect(destination("error", "The brew could not be removed."));
  revalidatePath("/space");
  revalidatePath("/space/brews");
  redirect(destination("message", "Brew removed."));
}
