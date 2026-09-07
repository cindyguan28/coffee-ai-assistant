"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { getSiteUrl, isSupabaseConfigured } from "../../lib/supabase/config";
import {
  authMessageUrl,
  safeRedirectPath,
  validateCredentials,
  validateNewPassword,
} from "../../lib/auth/validation";

function loginError(message: string, extra?: Record<string, string>): never {
  redirect(authMessageUrl("/login", "error", message, extra));
}

export async function login(formData: FormData) {
  const next = safeRedirectPath(formData.get("next"));
  if (!isSupabaseConfigured()) {
    loginError("Connect a Supabase project before signing in.", { next });
  }

  const credentials = validateCredentials(formData.get("email"), formData.get("password"));
  if (!credentials.ok) loginError(credentials.message, { next });

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    loginError("The email or password is incorrect, or the email is not confirmed.", { next });
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signup(formData: FormData) {
  const next = safeRedirectPath(formData.get("next"));
  if (!isSupabaseConfigured()) {
    loginError("Connect a Supabase project before creating an account.", { mode: "signup", next });
  }

  const credentials = validateCredentials(formData.get("email"), formData.get("password"));
  if (!credentials.ok) loginError(credentials.message, { mode: "signup", next });

  const password = validateNewPassword(formData.get("password"), formData.get("confirmPassword"));
  if (!password.ok) loginError(password.message, { mode: "signup", next });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    loginError("We could not create that account. Check the details and try again.", {
      mode: "signup",
      next,
    });
  }

  if (!data.session) {
    redirect(
      authMessageUrl(
        "/login",
        "message",
        "Check your email to confirm your account, then return here to sign in.",
        { next },
      ),
    );
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeRedirectPath(formData.get("next"));
  if (!isSupabaseConfigured()) {
    loginError("Connect a Supabase project before signing in with Google.", { next });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    loginError("Google sign-in is not available. Try email instead.", { next });
  }

  redirect(data.url);
}
