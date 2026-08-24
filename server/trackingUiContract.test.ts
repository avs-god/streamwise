import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) { return readFileSync(resolve(process.cwd(), relativePath), "utf8"); }

describe("tracking and lifecycle UI contract", () => {
  it("keeps typed offer snapshots and tracking consent in the title-save flow", () => {
    const dialog = source("client/src/components/TitleDialog.tsx");

    expect(dialog).toContain("monitorAvailability");
    expect(dialog).toContain("availabilityRegion: region");
    expect(dialog).toContain("offers: title.offers.map");
    expect(dialog).toContain("Track later offer changes");
    expect(dialog).toContain("Availability data: JustWatch via TMDb.");
  });

  it("keeps private in-app consent, observed changes, and pause-review controls visible to signed-in users", () => {
    const updates = source("client/src/pages/Updates.tsx");
    const watchlist = source("client/src/pages/Watchlist.tsx");
    const wallet = source("client/src/pages/Wallet.tsx");

    expect(updates).toContain("Enable in-app updates");
    expect(updates).toContain("Observed availability changes");
    expect(updates).toContain("Pause-review reminders");
    expect(watchlist).toContain("Check tracked titles");
    expect(watchlist).toContain("Track observed changes");
    expect(wallet).toContain("Pause with a review date");
    expect(wallet).toContain("Pause review is due");
  });
});
