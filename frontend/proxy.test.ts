import { describe, expect, it } from "vitest";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { config } from "./proxy";

describe("authentication proxy matching", () => {
  it.each(["/space", "/space/beans", "/reset-password"])("protects %s", (url) => {
    expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true);
  });

  it.each(["/", "/login", "/forgot-password", "/auth/callback"])(
    "keeps %s public",
    (url) => expect(unstable_doesMiddlewareMatch({ config, url })).toBe(false),
  );
});
