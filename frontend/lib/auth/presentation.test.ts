import { describe, expect, it } from "vitest";
import { loginPresentation } from "./presentation";

describe("login presentation", () => {
  it("uses returning-user copy for a direct login visit", () => {
    expect(loginPresentation()).toMatchObject({ heading: "Welcome back", statusMessage: null });
  });

  it("uses coherent copy after an explicit sign out", () => {
    expect(loginPresentation(undefined, "signed-out")).toEqual({
      heading: "Signed out safely",
      subtitle: "Sign in whenever you're ready to return.",
      statusMessage: "Your session has ended on this device.",
    });
  });

  it("does not let status override signup mode", () => {
    expect(loginPresentation("signup", "signed-out").heading).toBe("Create your space");
  });
});
