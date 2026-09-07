import { describe, expect, it } from "vitest";
import {
  authMessageUrl,
  safeRedirectPath,
  validateCredentials,
  validateEmail,
  validateNewPassword,
} from "./validation";

describe("safeRedirectPath", () => {
  it.each(["https://evil.example", "//evil.example", "javascript:alert(1)", "space", null])(
    "rejects an unsafe redirect: %s",
    (value) => expect(safeRedirectPath(value)).toBe("/space"),
  );

  it("keeps a local path, query, and fragment", () => {
    expect(safeRedirectPath("/space?bean=42#profile")).toBe("/space?bean=42#profile");
  });
});

describe("credential validation", () => {
  it("normalizes a valid email", () => {
    expect(validateEmail("  Coffee@Example.COM ")).toEqual({
      ok: true,
      email: "coffee@example.com",
    });
  });

  it("rejects invalid email and short passwords", () => {
    expect(validateCredentials("not-an-email", "Coffee123").ok).toBe(false);
    expect(validateCredentials("coffee@example.com", "short").ok).toBe(false);
  });

  it("requires a stronger matching password when creating or resetting an account", () => {
    expect(validateNewPassword("abcdefgh", "abcdefgh").ok).toBe(false);
    expect(validateNewPassword("Coffee123", "Coffee124").ok).toBe(false);
    expect(validateNewPassword("Coffee123", "Coffee123")).toEqual({
      ok: true,
      password: "Coffee123",
    });
  });
});

describe("authMessageUrl", () => {
  it("encodes user-facing messages and preserves extra state", () => {
    const result = authMessageUrl("/login", "error", "Try again & retry", { next: "/space" });
    expect(result).toBe("/login?error=Try+again+%26+retry&next=%2Fspace");
  });
});
