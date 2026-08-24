import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("keyboard and semantic-accessibility regression checks", () => {
  it("keeps labelled primary navigation, sign-out, and visible focus treatments", () => {
    const frame = source("client/src/components/AppFrame.tsx");
    const styles = source("client/src/index.css");

    expect(frame).toContain('aria-label="Primary"');
    expect(frame).toContain('aria-label="Mobile primary"');
    expect(frame).toContain('aria-label="Sign out"');
    expect(frame).toContain("focus-visible:ring-2");
    expect(styles).toContain("focus-visible");
  });

  it("keeps associated labels and accessible dialog primitives for keyboard input flows", () => {
    const home = source("client/src/pages/Home.tsx");
    const wallet = source("client/src/pages/Wallet.tsx");
    const titleDialog = source("client/src/components/TitleDialog.tsx");

    expect(home).toContain('htmlFor="title-search"');
    expect(home).toContain('htmlFor="country"');
    expect(wallet).toContain('htmlFor="provider"');
    expect(wallet).toContain('htmlFor="plan"');
    expect(wallet).toContain("<Dialog");
    expect(titleDialog).toContain("<Dialog");
    expect(titleDialog).toContain("<Select");
  });
});
