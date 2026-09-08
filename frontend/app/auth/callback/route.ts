import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { authMessageUrl, isMissingPkceVerifier, safeRedirectPath } from "../../../lib/auth/validation";
import { isSupabaseConfigured } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const safeNext = safeRedirectPath(requestUrl.searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=Authentication%20is%20not%20configured.", requestUrl.origin),
    );
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
    if (isMissingPkceVerifier(error)) {
      return NextResponse.redirect(
        new URL(
          authMessageUrl(
            "/login",
            "message",
            "This confirmation was opened on another device. Your email may already be confirmed; sign in here to continue.",
            { next: safeNext },
          ),
          requestUrl.origin,
        ),
      );
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      const destination = type === "recovery" ? "/reset-password" : safeNext;
      return NextResponse.redirect(new URL(destination, requestUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=The%20sign-in%20link%20is%20invalid%20or%20expired.", requestUrl.origin),
  );
}
