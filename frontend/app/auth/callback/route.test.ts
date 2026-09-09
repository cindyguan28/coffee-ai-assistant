import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("../../../lib/supabase/config", () => ({
  isSupabaseConfigured: () => true,
}));

vi.mock("../../../lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { GET } from "./route";

function authClient({
  exchangeUserId,
  sessionUserId,
  exchangeError = null,
}: {
  exchangeUserId?: string;
  sessionUserId?: string;
  exchangeError?: Error | null;
}) {
  return {
    auth: {
      exchangeCodeForSession: vi.fn().mockResolvedValue({
        data: { user: exchangeUserId ? { id: exchangeUserId } : null },
        error: exchangeError,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: sessionUserId ? { id: sessionUserId } : null },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      verifyOtp: vi.fn(),
    },
  };
}

describe("authentication callback session isolation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects only when the exchanged and authenticated users match", async () => {
    const client = authClient({ exchangeUserId: "gmail-user", sessionUserId: "gmail-user" });
    mocks.createClient.mockResolvedValue(client);

    const response = await GET(new Request("https://beanmemo.test/auth/callback?code=valid&next=/space"));

    expect(response.headers.get("location")).toBe("https://beanmemo.test/space");
    expect(client.auth.signOut).not.toHaveBeenCalled();
  });

  it("clears a stale session instead of entering another user's space", async () => {
    const client = authClient({ exchangeUserId: "gmail-user", sessionUserId: "163-user" });
    mocks.createClient.mockResolvedValue(client);

    const response = await GET(new Request("https://beanmemo.test/auth/callback?code=valid&next=/space"));

    expect(response.headers.get("location")).toContain("/login?error=");
    expect(client.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("clears the existing session when a cross-device PKCE exchange fails", async () => {
    const client = authClient({
      sessionUserId: "163-user",
      exchangeError: new Error("both auth code and code verifier should be non-empty"),
    });
    mocks.createClient.mockResolvedValue(client);

    const response = await GET(new Request("https://beanmemo.test/auth/callback?code=invalid&next=/space"));

    expect(response.headers.get("location")).toContain("/login?message=");
    expect(client.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});
