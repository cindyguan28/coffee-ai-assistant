import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "../../../lib/supabase/config";

export const dynamic = "force-dynamic";

export function GET() {
  const authConfigured = isSupabaseConfigured();
  const payload = {
    status: authConfigured ? "ready" : "configuration_required",
    services: { authentication: authConfigured ? "configured" : "missing_environment" },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(payload, {
    status: authConfigured || process.env.NODE_ENV !== "production" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
