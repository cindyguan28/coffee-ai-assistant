"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/config";

function loginError(message: string, mode = "login"): never {
  redirect(`/login?mode=${mode}&error=${encodeURIComponent(message)}`);
}

function readCredentials(formData: FormData, mode: "login" | "signup") {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@")) {
    loginError("Enter a valid email address.", mode);
  }
  if (password.length < 8) {
    loginError("Password must be at least 8 characters.", mode);
  }

  return { email, password };
}

export async function login(formData: FormData) {
  if (!isSupabaseConfigured()) {
    loginError("Connect a Supabase project before signing in.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(readCredentials(formData, "login"));

  if (error) {
    loginError("The email or password is incorrect.");
  }

  revalidatePath("/", "layout");
  redirect("/space");
}

export async function signup(formData: FormData) {
  if (!isSupabaseConfigured()) {
    loginError("Connect a Supabase project before creating an account.", "signup");
  }

  const credentials = readCredentials(formData, "signup");
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    ...credentials,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });

  if (error) {
    loginError("We could not create that account. Try another email.", "signup");
  }

  if (!data.session) {
    redirect("/login?message=Check%20your%20email%20to%20confirm%20your%20coffee%20space.");
  }

  revalidatePath("/", "layout");
  redirect("/space");
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured()) {
    loginError("Connect a Supabase project before signing in with Google.");
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${siteUrl}/auth/callback` },
  });

  if (error || !data.url) {
    loginError("Google sign-in is not available yet.");
  }

  redirect(data.url);
}
