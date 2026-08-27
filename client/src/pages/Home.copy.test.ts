import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("homepage visual-editor copy updates", () => {
  it("retains the requested positioning copy and concise privacy promise", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

    expect(source).toContain("Find what to stream next and Where to stream it exactly. Manage all your streaming subscriptions for viewing that is actually planned. The one-stop destination for movie buffs and OTT streamers.");
    expect(source).toContain("One search can compare verified legal offers and clearly separate public-web context. Always privacy first.");
  });

  it("keeps the AI research empty state blank without invalid px inline styles", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/AiResearchPanel.tsx"), "utf8");

    expect(source).not.toContain("Ask a natural-language question once above.");
    expect(source).not.toContain("'px'");
    expect(source).toContain('border-dashed border-[#c7d2c6] bg-white/50');
  });
});
