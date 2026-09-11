import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

describe("mobile journal layout safeguards", () => {
  it("allows the journal form track and its controls to shrink to device width", () => {
    expect(css).toMatch(/\.bean-form\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(css).toMatch(/\.bean-form input,[^{]+\{[^}]*min-width:\s*0[^}]*max-width:\s*100%/);
    expect(css).toMatch(/\.bean-form > \*,\s*\.bean-form-row > \*,\s*\.brew-numbers > \*\s*\{\s*min-width:\s*0;/);
  });

  it("keeps mobile form controls at a font size that does not trigger focus zoom", () => {
    expect(css).toMatch(/@media \(max-width:\s*520px\)[\s\S]*?input:not\(\[type="range"\]\),\s*select,\s*textarea\s*\{\s*font-size:\s*16px;/);
  });
});
