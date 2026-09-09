"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authMessageUrl, validateNewPassword } from "../../lib/auth/validation";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";

export async function updatePassword(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect(authMessageUrl("/reset-password", "error", "Authentication is not configured."));
  }

  const password = validateNewPassword(formData.get("password"), formData.get("confirmPassword"));
  if (!password.ok) {
    redirect(authMessageUrl("/reset-password", "error", password.message));
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) redirect("/forgot-password?error=The%20reset%20link%20has%20expired.");

  const { error } = await supabase.auth.updateUser({ password: password.password });
  if (error) {
    redirect(
      authMessageUrl("/reset-password", "error", "We could not update the password. Request a new link."),
    );
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(authMessageUrl("/login", "message", "Password updated. Sign in with your new password."));
}
