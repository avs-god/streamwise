import { expect, test } from "@playwright/test";

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
