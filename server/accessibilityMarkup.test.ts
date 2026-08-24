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

  it("keeps distinct source-category labels separate from catalog evidence", () => {
    const panel = source("client/src/components/AiResearchPanel.tsx");
    expect(panel).toContain("Critic / film reading");
    expect(panel).toContain("Reporting / reference");
    expect(panel).toContain("Unverified discussion");
    expect(panel).toContain("never used as availability, alert, tracking, or recommendation evidence");
  });

  it("keeps external rating and critic links outbound-only on title pages", () => {
    const page = source("client/src/pages/TitlePage.tsx");
    expect(page).toContain("IMDb reference");
    expect(page).toContain("Rotten Tomatoes reference");
    expect(page).toContain("Critic and blog reading");
    expect(page).toContain("does not reproduce their protected scores or review text");
  });

  it("keeps title-level community rating, review, and report controls available", () => {
    const page = source("client/src/pages/TitlePage.tsx");
    expect(page).toContain("Write a community review");
    expect(page).toContain("Publish community review");
    expect(page).toContain("Report review");
    expect(page).toContain("setTitleRating");
  });

  it("keeps similar-title navigation explicitly catalog-derived", () => {
    const page = source("client/src/pages/TitlePage.tsx");
    expect(page).toContain("Catalog-derived similar");
    expect(page).toContain("catalog.similar.useQuery");
  });

  it("keeps public-web research loading, failure, sign-in, and provenance states visible", () => {
    const panel = source("client/src/components/AiResearchPanel.tsx");
    expect(panel).toContain("Sign in for web context");
    expect(panel).toContain("Researching public sources independently");
    expect(panel).toContain("Public-web research could not be completed");
    expect(panel).toContain("Insufficient source evidence");
    expect(panel).toContain("Separate evidence");
  });
});
