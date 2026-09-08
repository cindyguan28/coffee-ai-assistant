"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserId } from "../../../lib/auth/user";
import { generateBeanProfile } from "../../../lib/coffee/profile";
import { createClient } from "../../../lib/supabase/server";

function text(formData: FormData, field: string, maxLength = 500) {
  return String(formData.get(field) ?? "").trim().slice(0, maxLength) || null;
}

function message(kind: "error" | "message", value: string) {
  return `/space/beans?${kind}=${encodeURIComponent(value)}`;
}

export async function addBean(formData: FormData) {
  const userId = await requireCurrentUserId();
  const name = text(formData, "name", 200);
  if (!name) redirect(message("error", "Enter a coffee name."));

  const priceText = text(formData, "price", 30);
  const price = priceText ? Number(priceText) : null;
  if (price !== null && (!Number.isFinite(price) || price < 0)) {
    redirect(message("error", "Enter a valid non-negative price."));
  }

  const bean = {
    user_id: userId,
    name,
    roaster: text(formData, "roaster", 200),
    country: text(formData, "country", 200),
    process: text(formData, "process", 100),
    roast_level: text(formData, "roast_level", 100),
    price,
    flavor_notes: text(formData, "flavor_notes", 500),
    notes: text(formData, "notes", 2000),
  };
  const supabase = await createClient();
  const { data, error } = await supabase.from("beans").insert(bean).select("id").single();
  if (error || !data) redirect(message("error", "The bean could not be saved. Try again."));

  const profile = generateBeanProfile(bean);
  const { error: profileError } = await supabase.from("bean_profiles").insert({ bean_id: data.id, ...profile });
  if (profileError) {
    await supabase.from("beans").delete().eq("id", data.id).eq("user_id", userId);
    redirect(message("error", "The bean profile could not be generated, so nothing was saved."));
  }

  revalidatePath("/space");
  revalidatePath("/space/beans");
  redirect(message("message", `${name} and its Bean Profile were saved.`));
}

export async function deleteBean(formData: FormData) {
  const userId = await requireCurrentUserId();
  const beanId = text(formData, "beanId", 100);
  if (!beanId) redirect(message("error", "Bean not found."));
  const supabase = await createClient();
  const { error } = await supabase.from("beans").delete().eq("id", beanId).eq("user_id", userId);
  if (error) redirect(message("error", "The bean could not be removed."));
  revalidatePath("/space");
  revalidatePath("/space/beans");
  redirect(message("message", "Bean removed."));
}
