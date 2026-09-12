import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";

describe("public sitemap", () => {
  it("includes the complete first guide cluster and excludes private routes", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toEqual(expect.arrayContaining([
      "https://beanmemo.com/coffee-journal",
      "https://beanmemo.com/coffee-tasting-notes",
      "https://beanmemo.com/brew-log",
      "https://beanmemo.com/discover-your-coffee-taste",
      "https://beanmemo.com/coffee-bean-tracker",
    ]));
    expect(urls.some((url) => url.includes("/space"))).toBe(false);
  });
});
