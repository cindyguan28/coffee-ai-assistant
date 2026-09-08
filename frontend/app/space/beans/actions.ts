"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserId } from "../../../lib/auth/user";
import { validateBean } from "../../../lib/coffee/bean";
import { generateBeanProfile } from "../../../lib/coffee/profile";
import { createClient } from "../../../lib/supabase/server";

function text(formData: FormData, field: string, maxLength = 500) {
  return String(formData.get(field) ?? "").trim().slice(0, maxLength) || null;
}

function message(kind: "error" | "message", value: string) {
  return `/space/beans?${kind}=${encodeURIComponent(value)}`;
}

function revalidateCoffeeSpace() {
  revalidatePath("/space");
  revalidatePath("/space/beans");
  revalidatePath("/space/brews");
  revalidatePath("/space/taste");
  revalidatePath("/space/world");
}

export async function addBean(formData: FormData) {
  const userId = await requireCurrentUserId();
  const validation = validateBean(formData);
  if (!validation.ok) redirect(message("error", validation.message));

  const bean = { user_id: userId, ...validation.value };
  const supabase = await createClient();
  const { data, error } = await supabase.from("beans").insert(bean).select("id").single();
  if (error || !data) redirect(message("error", "The bean could not be saved. Try again."));

  const profile = generateBeanProfile(bean);
  const { error: profileError } = await supabase.from("bean_profiles").insert({ bean_id: data.id, ...profile });
  if (profileError) {
    await supabase.from("beans").delete().eq("id", data.id).eq("user_id", userId);
    redirect(message("error", "The bean profile could not be generated, so nothing was saved."));
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
  const { data, error } = await supabase
    .from("beans")
    .update(validation.value)
    .eq("id", beanId)
    .eq("user_id", userId)
    .select("id")
    .single();
  if (error || !data) redirect(message("error", "The bean could not be updated."));

  const profile = generateBeanProfile(validation.value);
  const { error: profileError } = await supabase.from("bean_profiles").upsert(
    { bean_id: beanId, ...profile, generated_at: new Date().toISOString() },
    { onConflict: "bean_id" },
  );
  if (profileError) redirect(message("error", "The bean was updated, but its Profile could not be refreshed."));

  revalidateCoffeeSpace();
  redirect(message("message", `${validation.value.name} and its Bean Profile were updated.`));
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
