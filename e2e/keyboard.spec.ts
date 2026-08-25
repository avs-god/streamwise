import { expect, test } from "@playwright/test";

async function mockSignedInResearch(page: import("@playwright/test").Page, mode: { current: "success" | "loading" | "error"; release?: () => void }) {
  await page.route("**/api/trpc/**", async route => {
    const procedures = new URL(route.request().url()).pathname.split("/api/trpc/")[1]?.split(",") ?? [];
    if (procedures.includes("ai.research") && mode.current === "error") {
      const errorEnvelope = [{ error: { json: { message: "Synthetic grounded-search failure", code: -32603, data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500, path: "ai.research" } } } }];
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify(errorEnvelope) });
      return;
    }
    if (procedures.includes("ai.research") && mode.current === "loading") {
      await new Promise<void>(resolve => { mode.release = resolve; });
    }
    const entries = procedures.map(procedure => {
      if (procedure === "auth.me") return { result: { data: { json: { id: 999, openId: "browser-test-member", name: "Browser Test", email: null, loginMethod: "test", role: "user", createdAt: "2026-08-25T00:00:00.000Z", updatedAt: "2026-08-25T00:00:00.000Z", lastSignedIn: "2026-08-25T00:00:00.000Z" } } } };
      if (procedure === "catalog.status") return { result: { data: { json: { configured: false, provider: "TMDb / JustWatch" } } } };
      if (procedure === "catalog.search") return { result: { data: { json: { configured: false, titles: [], correctedQuery: null } } } };
      if (procedure === "ai.research") return { result: { data: { json: { status: "lead", summary: "A source-linked film guide provides public context for the resolved title.", sources: [{ title: "Tenet film guide", url: "https://film.example/tenet-guide", domain: "film.example", kind: "reporting" }], communitySources: [], searchedAt: "2026-08-25T00:00:00.000Z", limitation: "Public context remains separate from legal availability.", resolvedQuery: "Tenet 2020 film", correctionNote: "Searched the likely title **Tenet** (2020) for “Tencet”." } } } };
      return { result: { data: { json: [] } } };
    });
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(entries) });
  });
}

test("keyboard users can navigate core routes and submit the labelled discovery form", async ({ page }) => {
  await page.goto("/");

  const search = page.getByLabel("Search for a movie or series");
  await search.focus();
  await expect(search).toBeFocused();
  await page.keyboard.type("A local title");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Legal catalog is safely on standby.")).toBeVisible();
  await expect(page.getByText("Unverified web context.")).toBeVisible();
  await expect(page.locator('[aria-label="Verified legal catalog results"]')).toBeVisible();

  const country = page.getByLabel("Country");
  await country.focus();
  await expect(country).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByRole("option", { name: "United States" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(country).toBeFocused();

  await expect(page.getByText("Separate evidence")).toBeVisible();

  const whyStreamwise = page.getByRole("button", { name: "Why Streamwise exists" });
  await whyStreamwise.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Finding a film should not require managing a maze." })).toBeVisible();
  await expect(page.getByRole("img", { name: "User-provided newspaper article about streaming discovery and subscription frustration" })).toBeVisible();
  await page.keyboard.press("Escape");

  const methodology = page.getByRole("button", { name: "How it works" });
  await methodology.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "How Streamwise works" })).toBeVisible();
  const dialogClose = page.getByRole("button", { name: "Close" });
  await expect(dialogClose).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialogClose).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(methodology).toBeFocused();

  const popular = page.getByRole("link", { name: "Popular films + series" });
  await popular.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/recommendations$/);
  await expect(page.getByRole("heading", { name: "Find the next great watch." })).toBeVisible();

  await page.goto("/title/movie/1");
  await expect(page.getByRole("heading", { name: "Legal catalog is safely on standby." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What Streamwise members think." })).toBeVisible();

  await page.goto("/");

  const watchlist = page.getByRole("link", { name: "Watchlist", exact: true });
  await watchlist.focus();
  await expect(watchlist).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/watchlist$/);

  const wallet = page.getByRole("link", { name: "Wallet", exact: true });
  await wallet.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/wallet$/);

  const decisions = page.getByRole("link", { name: "Decisions", exact: true });
  await decisions.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/decisions$/);

  const updates = page.getByRole("link", { name: "Updates", exact: true });
  await updates.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/updates$/);
  await expect(page.getByText("Keep updates private.")).toBeVisible();

  const assistant = page.getByRole("link", { name: "Assistant", exact: true });
  await assistant.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/assistant$/);
  await expect(page.getByRole("heading", { name: "Ask with your eyes open." })).toBeVisible();

  const community = page.getByRole("link", { name: "Community", exact: true });
  await community.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/community$/);
  await expect(page.getByRole("heading", { name: "What members are noticing." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Talk plots, craft, and what to watch next." })).toBeVisible();
});

test("public browser routes preserve no-catalog and private-member boundaries", async ({ page }) => {
  await page.goto("/title/movie/1");
  await expect(page.getByRole("heading", { name: "Legal catalog is safely on standby." })).toBeVisible();
  await expect(page.getByText("external rating references, and related titles")).toBeVisible();
  await expect(page.getByText("IMDb, Rotten Tomatoes, and critic-reading links are unavailable")).toBeVisible();
  await expect(page.getByText("What Streamwise members think.")).toBeVisible();

  await page.goto("/watchlist");
  await expect(page.getByText("Make this list yours.")).toBeVisible();
  await expect(page.getByText("Private by design.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();

  await page.goto("/community?tmdbId=27205&mediaType=movie&title=Inception");
  await expect(page.getByRole("heading", { name: "What members are noticing." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in to contribute" })).toBeVisible();
  await expect(page.getByText("Community observations are public discussion, not catalog evidence.")).toBeVisible();
});

test("intercepted member browser states render grounded AI success, loading, and failure without real member data", async ({ page }) => {
  const mode: { current: "success" | "loading" | "error"; release?: () => void } = { current: "loading" };
  await mockSignedInResearch(page, mode);
  await page.goto("/");

  const search = page.getByLabel("Search for a movie or series");
  await search.fill("Tencet");
  await search.press("Enter");
  await expect(page.getByText("Resolving title intent and grounding public sources…")).toBeVisible();
  mode.current = "success";
  mode.release?.();
  await expect(page.getByText("Grounded public-web context")).toBeVisible();
  await expect(page.getByText("Searched the likely title Tenet (2020) for “Tencet”.")).toBeVisible();
  await expect(page.getByRole("link", { name: /Tenet film guide/ })).toBeVisible();

  mode.current = "error";
  await search.fill("Another title");
  await search.press("Enter");
  await expect(page.getByRole("alert")).toContainText("Public-web research could not be completed");
});
