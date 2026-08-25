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

async function mockMemberWatchlist(page: import("@playwright/test").Page, state: { watched: boolean; signalsError: boolean }) {
  const member = { id: 998, openId: "browser-watchlist-member", name: "Browser Watchlist", email: null, loginMethod: "test", role: "user", createdAt: "2026-08-25T00:00:00.000Z", updatedAt: "2026-08-25T00:00:00.000Z", lastSignedIn: "2026-08-25T00:00:00.000Z" };
  const item = { id: 41, userId: 998, tmdbId: 27205, mediaType: "movie", title: "Synthetic Film", posterPath: null, releaseDate: "2026-01-01", plannedFor: "someday", note: null, monitorAvailability: true, availabilityRegion: "IN", providerNamesJson: "[]", availabilityCheckedAt: null, availabilitySourceUrl: null, createdAt: "2026-08-25T00:00:00.000Z", updatedAt: "2026-08-25T00:00:00.000Z" };
  await page.route("**/api/trpc/**", async route => {
    const procedures = new URL(route.request().url()).pathname.split("/api/trpc/")[1]?.split(",") ?? [];
    const entries = procedures.map(procedure => {
      if (procedure === "auth.me") return { result: { data: { json: member } } };
      if (procedure === "watchlist.list") return { result: { data: { json: [item] } } };
      if (procedure === "viewingSignals.list" && state.signalsError) return { error: { json: { message: "Synthetic watched-status failure", code: -32603, data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500, path: "viewingSignals.list" } } } };
      if (procedure === "viewingSignals.list") return { result: { data: { json: state.watched ? [{ id: 52, userId: 998, tmdbId: 27205, mediaType: "movie", title: "Synthetic Film", status: "watched", recordedAt: "2026-08-25T00:00:00.000Z", createdAt: "2026-08-25T00:00:00.000Z", updatedAt: "2026-08-25T00:00:00.000Z" }] : [] } } };
      if (procedure === "viewingSignals.record") { state.watched = true; return { result: { data: { json: { success: true } } } }; }
      return { result: { data: { json: [] } } };
    });
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(entries) });
  });
}

async function mockMemberPostWatch(page: import("@playwright/test").Page, state: { current: "loading" | "error" | "success"; release?: () => void }) {
  const member = { id: 997, openId: "browser-post-watch-member", name: "Browser Picks", email: null, loginMethod: "test", role: "user", createdAt: "2026-08-25T00:00:00.000Z", updatedAt: "2026-08-25T00:00:00.000Z", lastSignedIn: "2026-08-25T00:00:00.000Z" };
  await page.route("**/api/trpc/**", async route => {
    const procedures = new URL(route.request().url()).pathname.split("/api/trpc/")[1]?.split(",") ?? [];
    if (procedures.includes("viewingSignals.postWatchPicks") && state.current === "loading") await new Promise<void>(resolve => { state.release = resolve; });
    const entries = procedures.map(procedure => {
      if (procedure === "auth.me") return { result: { data: { json: member } } };
      if (procedure === "catalog.discover") return { result: { data: { json: { configured: false, titles: [], explanation: "Catalog is safely on standby." } } } };
      if (procedure === "catalog.offerPreview") return { result: { data: { json: { configured: false, offers: [], checkedAt: null, sourceUrl: null } } } };
      if (procedure === "viewingSignals.postWatchPicks" && state.current === "error") return { error: { json: { message: "Synthetic post-watch failure", code: -32603, data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500, path: "viewingSignals.postWatchPicks" } } } };
      if (procedure === "viewingSignals.postWatchPicks") return { result: { data: { json: { configured: false, titles: [{ id: 4242, mediaType: "movie", title: "Synthetic recovery pick", overview: "A synthetic deterministic private recommendation card." }], recordedCount: 1, explanation: "Synthetic private post-watch recovery state." } } } };
      return { result: { data: { json: [] } } };
    });
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(entries) });
  });
}

async function mockMemberDiscussion(page: import("@playwright/test").Page, state: { childCreated: boolean; reportedReply: boolean }) {
  const member = { id: 996, openId: "browser-discussion-member", name: "Browser Discussion", email: null, loginMethod: "test", role: "user", createdAt: "2026-08-25T00:00:00.000Z", updatedAt: "2026-08-25T00:00:00.000Z", lastSignedIn: "2026-08-25T00:00:00.000Z" };
  const thread = { id: 81, userId: 996, tmdbId: 27205, title: "Synthetic Film", mediaType: "movie", topic: "discussion", headline: "Synthetic title-linked discussion", body: "A careful synthetic discussion body with enough context for browser coverage.", containsSpoilers: true, shareAttribution: false, status: "visible", createdAt: "2026-08-25T00:00:00.000Z", updatedAt: "2026-08-25T00:00:00.000Z", contributorName: null };
  const parent = { id: 91, threadId: 81, userId: 996, parentReplyId: null, body: "Synthetic parent reply", containsSpoilers: true, shareAttribution: false, status: "visible", createdAt: "2026-08-25T00:00:00.000Z", updatedAt: "2026-08-25T00:00:00.000Z", contributorName: null };
  const child = { ...parent, id: 92, parentReplyId: 91, body: "Synthetic nested reply" };
  await page.route("**/api/trpc/**", async route => {
    const procedures = new URL(route.request().url()).pathname.split("/api/trpc/")[1]?.split(",") ?? [];
    const entries = procedures.map(procedure => {
      if (procedure === "auth.me") return { result: { data: { json: member } } };
      if (procedure === "community.list") return { result: { data: { json: [] } } };
      if (procedure === "community.threads") return { result: { data: { json: [thread] } } };
      if (procedure === "community.replies") return { result: { data: { json: state.childCreated ? [parent, child] : [parent] } } };
      if (procedure === "community.reply") { state.childCreated = true; return { result: { data: { json: { success: true } } } }; }
      if (procedure === "community.reportThread") { state.reportedReply = true; return { result: { data: { json: { success: true } } } }; }
      return { result: { data: { json: [] } } };
    });
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(entries) });
  });
}

async function mockAdminModeration(page: import("@playwright/test").Page, state: { replyHidden: boolean }) {
  const admin = { id: 995, openId: "browser-admin", name: "Browser Admin", email: null, loginMethod: "test", role: "admin", createdAt: "2026-08-25T00:00:00.000Z", updatedAt: "2026-08-25T00:00:00.000Z", lastSignedIn: "2026-08-25T00:00:00.000Z" };
  await page.route("**/api/trpc/**", async route => {
    const procedures = new URL(route.request().url()).pathname.split("/api/trpc/")[1]?.split(",") ?? [];
    const entries = procedures.map(procedure => {
      if (procedure === "auth.me") return { result: { data: { json: admin } } };
      if (procedure === "community.list" || procedure === "community.threads") return { result: { data: { json: [] } } };
      if (procedure === "community.moderation.reports") return { result: { data: { json: [] } } };
      if (procedure === "community.moderation.threadReports") return { result: { data: { json: state.replyHidden ? [] : [{ id: 201, threadId: 81, replyId: 91, reporterUserId: 994, reason: "misleading", detail: null, status: "open", createdAt: "2026-08-25T00:00:00.000Z" }] } } };
      if (procedure === "community.moderation.setReplyStatus") { state.replyHidden = true; return { result: { data: { json: { success: true } } } }; }
      return { result: { data: { json: [] } } };
    });
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(entries) });
  });
}

async function mockMemberTitleReview(page: import("@playwright/test").Page, state: { reported: boolean; hidden: boolean }) {
  const member = { id: 994, openId: "browser-review-member", name: "Browser Review", email: null, loginMethod: "test", role: "user", createdAt: "2026-08-25T00:00:00.000Z", updatedAt: "2026-08-25T00:00:00.000Z", lastSignedIn: "2026-08-25T00:00:00.000Z" };
  const review = { id: 301, tmdbId: 1, mediaType: "movie", title: "Catalog title 1", region: "IN", providerName: null, kind: "review", body: "Synthetic title review visibility text.", sourceUrl: null, shareAttribution: false, status: "visible", createdAt: "2026-08-25T00:00:00.000Z", updatedAt: "2026-08-25T00:00:00.000Z", contributorName: null };
  await page.route("**/api/trpc/**", async route => {
    const procedures = new URL(route.request().url()).pathname.split("/api/trpc/")[1]?.split(",") ?? [];
    const entries = procedures.map(procedure => {
      if (procedure === "auth.me") return { result: { data: { json: member } } };
      if (procedure === "catalog.title") return { result: { data: { json: { configured: false, title: null, explanation: "Synthetic catalog standby." } } } };
      if (procedure === "community.titleRatingSummary") return { result: { data: { json: { count: 0, average: null } } } };
      if (procedure === "community.titleReviews") return { result: { data: { json: state.hidden ? [] : [review] } } };
      if (procedure === "community.setTitleRating" || procedure === "community.contribute") return { result: { data: { json: { success: true } } } };
      if (procedure === "community.report") { state.reported = true; return { result: { data: { json: { success: true } } } }; }
      return { result: { data: { json: [] } } };
    });
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(entries) });
  });
}

test("keyboard users can navigate core routes and submit the labelled discovery form", async ({ page }) => {
  await page.route("**/api/trpc/**", async route => {
    const procedures = new URL(route.request().url()).pathname.split("/api/trpc/")[1]?.split(",") ?? [];
    const entries = procedures.map(procedure => {
      if (procedure === "auth.me") return { result: { data: { json: null } } };
      if (procedure === "catalog.status") return { result: { data: { json: { configured: false, provider: "TMDb / JustWatch" } } } };
      if (procedure === "catalog.search") return { result: { data: { json: { configured: false, titles: [], checkedAt: null, correctedQuery: null } } } };
      if (procedure === "catalog.title") return { result: { data: { json: { configured: false, title: null } } } };
      if (procedure === "catalog.discover") return { result: { data: { json: { configured: false, titles: [], explanation: "Catalog is safely on standby." } } } };
      if (procedure === "community.titleRatingSummary") return { result: { data: { json: { count: 0, average: null } } } };
      if (procedure === "community.titleReviews") return { result: { data: { json: [] } } };
      return { result: { data: { json: [] } } };
    });
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(entries) });
  });
  await page.goto("/");

  const search = page.getByLabel("Search for a movie or series");
  await search.focus();
  await expect(search).toBeFocused();
  await page.keyboard.type("A local title");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Legal catalog is safely on standby.")).toBeVisible();
  await expect(page.getByText("Ask in everyday language.")).toBeVisible();
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
  const titleStandbyRoute = async (route: import("@playwright/test").Route) => {
    const procedures = new URL(route.request().url()).pathname.split("/api/trpc/")[1]?.split(",") ?? [];
    const entries = procedures.map(procedure => {
      if (procedure === "auth.me") return { result: { data: { json: null } } };
      if (procedure === "catalog.title") return { result: { data: { json: { configured: false, title: null } } } };
      if (procedure === "community.titleRatingSummary") return { result: { data: { json: { count: 0, average: null } } } };
      if (procedure === "community.titleReviews") return { result: { data: { json: [] } } };
      return { result: { data: { json: [] } } };
    });
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(entries) });
  };
  await page.route("**/api/trpc/**", titleStandbyRoute);
  await page.goto("/title/movie/1");
  await expect(page.getByRole("heading", { name: "Legal catalog is safely on standby." })).toBeVisible();
  await expect(page.getByText("external rating references, and related titles")).toBeVisible();
  await expect(page.getByText("IMDb, Rotten Tomatoes, and critic-reading links are unavailable")).toBeVisible();
  await expect(page.getByText("What Streamwise members think.")).toBeVisible();
  await page.unroute("**/api/trpc/**", titleStandbyRoute);

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
  await expect(page.getByText("Searching the public web and compiling a direct answer…")).toBeVisible();
  mode.current = "success";
  mode.release?.();
  await expect(page.getByText("Direct web-grounded answer")).toBeVisible();
  await expect(page.getByText("Searched the likely title Tenet (2020) for “Tencet”.")).toBeVisible();
  await expect(page.getByRole("link", { name: /Tenet film guide/ })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.getByRole("link", { name: /Tenet film guide/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  mode.current = "error";
  await search.fill("Another title");
  await search.press("Enter");
  await expect(page.getByRole("alert")).toContainText("Public-web research could not be completed");
});

test("AI recommendation chat converts a natural-language taste prompt into catalog-backed picks", async ({ page }) => {
  await page.route("**/api/trpc/**", async route => {
    const procedures = new URL(route.request().url()).pathname.split("/api/trpc/")[1]?.split(",") ?? [];
    const entries = procedures.map(procedure => {
      if (procedure === "auth.me") return { result: { data: { json: null } } };
      if (procedure === "catalog.discover") return { result: { data: { json: { configured: false, titles: [], explanation: "Catalog standby for deterministic browser coverage." } } } };
      if (procedure === "catalog.offerPreview") return { result: { data: { json: { configured: false, offers: [], checkedAt: null, sourceUrl: null } } } };
      if (procedure === "ai.recommend") return { result: { data: { json: { configured: true, explanation: "Catalog results matching the requested genre.", interpretation: { query: "smart science fiction", referenceTitle: "Inception", genreId: 878, mediaType: "movie", originalLanguage: null, explanation: "A science-fiction movie request related to Inception." }, titles: [{ id: 777, mediaType: "movie", title: "Synthetic Space Film", originalTitle: null, overview: "A catalog-backed synthetic result for browser coverage.", posterPath: null, releaseDate: "2026-01-01" }] } } } };
      return { result: { data: { json: [] } } };
    });
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(entries) });
  });
  await page.goto("/recommendations");
  await page.getByLabel("Recommendation language filter").selectOption("hi");
  await page.getByLabel("Recommendation runtime filter").selectOption("120");
  const prompt = page.getByLabel("Ask for a recommendation");
  await prompt.fill("I want a tense science-fiction film like Inception");
  await page.getByRole("button", { name: "Get recommendations" }).click();
  await expect(page.getByText("A science-fiction movie request related to Inception.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Film · 2026 Synthetic Space Film/ })).toBeVisible();
  await expect(page.getByText("Catalog results matching the requested genre.", { exact: true })).toBeVisible();
  await expect(page.getByText("Sign in to add optional source-linked public-web context to this request.")).toBeVisible();
  await page.getByRole("button", { name: "Synthetic Space Film", exact: true }).click();
  await expect(page.getByText(/More like Synthetic Space Film/).first()).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.getByRole("button", { name: /Film · 2026 Synthetic Space Film/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("intercepted member records watched only on explicit consent and recovers private-status errors", async ({ page }) => {
  const state = { watched: false, signalsError: false };
  await mockMemberWatchlist(page, state);
  await page.goto("/watchlist");
  await expect(page.getByText("Synthetic Film")).toBeVisible();
  await expect(page.getByRole("button", { name: "Record as watched" })).toBeVisible();
  expect(state.watched).toBe(false);
  await page.getByRole("button", { name: "Record as watched" }).click();
  await expect(page.getByText(/^Recorded \d/)).toBeVisible();
  expect(state.watched).toBe(true);

  state.signalsError = true;
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("Private watched-record status could not be loaded");
  state.signalsError = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("button", { name: "Remove record" })).toBeVisible();
});

test("intercepted member post-watch picks render loading, failure, and retry recovery", async ({ page }) => {
  const state: { current: "loading" | "error" | "success"; release?: () => void } = { current: "loading" };
  await mockMemberPostWatch(page, state);
  await page.goto("/recommendations");
  await expect(page.getByText("Loading your optional member-recorded viewing signals…")).toBeVisible();
  state.current = "error";
  state.release?.();
  await expect(page.getByRole("alert")).toContainText("Private post-watch picks could not be loaded");
  state.current = "success";
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("Synthetic private post-watch recovery state.")).toBeVisible();
  await expect(page.getByText("Synthetic recovery pick")).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.getByText("Synthetic recovery pick")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("intercepted member creates a nested title-linked reply and reports an individual reply", async ({ page }) => {
  const state = { childCreated: false, reportedReply: false };
  await mockMemberDiscussion(page, state);
  await page.goto("/community?tmdbId=27205&mediaType=movie&title=Synthetic%20Film");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText("Spoilers flagged")).toBeVisible();
  await page.getByRole("button", { name: "Synthetic title-linked discussion" }).click();
  await expect(page.getByText("Synthetic parent reply")).toBeVisible();
  await expect(page.getByText("Spoilers", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reply to this comment" }).click();
  await page.getByLabel("Reply to comment").fill("A nested synthetic response");
  await page.getByRole("button", { name: "Post reply" }).click();
  await expect(page.getByText("Synthetic nested reply")).toBeVisible();
  expect(state.childCreated).toBe(true);
  await page.getByRole("button", { name: "Report reply" }).first().click();
  await page.getByRole("button", { name: "Send reply report" }).click();
  await expect.poll(() => state.reportedReply).toBe(true);
});

test("intercepted admin hides a reported reply through the private moderation panel", async ({ page }) => {
  const state = { replyHidden: false };
  await mockAdminModeration(page, state);
  await page.goto("/community");
  await expect(page.getByRole("heading", { name: "Open community reports" })).toBeVisible();
  await page.getByRole("button", { name: "Hide reply" }).click();
  await expect.poll(() => state.replyHidden).toBe(true);
  await expect(page.getByText("No open discussion reports.")).toBeVisible();
});

test("intercepted member reports a title review and does not see it after the synthetic hidden state", async ({ page }) => {
  const state = { reported: false, hidden: false };
  await mockMemberTitleReview(page, state);
  await page.goto("/title/movie/1");
  await expect(page.getByText("Synthetic title review visibility text.")).toBeVisible();
  await expect(page.getByRole("button", { name: "5 ★" })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.getByRole("button", { name: "5 ★" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const fiveStar = page.getByRole("button", { name: "5 ★" });
  await fiveStar.focus();
  await expect(fiveStar).toBeFocused();
  await page.keyboard.press("Enter");
  const reviewComposer = page.getByLabel("Write a community review");
  await reviewComposer.focus();
  await expect(reviewComposer).toBeFocused();
  await page.keyboard.type("A synthetic keyboard review entry with enough context.");
  await expect(page.getByRole("button", { name: "Publish community review" })).toBeEnabled();
  await page.getByRole("button", { name: "Report review" }).click();
  await expect.poll(() => state.reported).toBe(true);
  state.hidden = true;
  await page.reload();
  await expect(page.getByText("No title-linked community reviews are visible yet.")).toBeVisible();
});
