import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "../supabase/config";
import { createClient } from "../supabase/server";

export async function getCurrentUserId() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return typeof data?.claims?.sub === "string" ? data.claims.sub : null;
}

export async function requireCurrentUserId() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login?next=%2Fspace");
  return userId;
}
