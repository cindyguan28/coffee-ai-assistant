"use server";

import { redirect } from "next/navigation";
import { authMessageUrl, validateEmail } from "../../lib/auth/validation";
import { getSiteUrl, isSupabaseConfigured } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = validateEmail(formData.get("email"));
  if (!email.ok) {
    redirect(authMessageUrl("/forgot-password", "error", email.message));
  }
  if (!isSupabaseConfigured()) {
    redirect(
      authMessageUrl("/forgot-password", "error", "Connect Supabase before requesting a reset."),
    );
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });

  redirect(
    authMessageUrl(
      "/forgot-password",
      "message",
      "If an account exists for that email, a secure reset link is on its way.",
    ),
  );
}
