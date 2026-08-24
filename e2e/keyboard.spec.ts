import { expect, test } from "@playwright/test";

test("keyboard users can navigate core routes and submit the labelled discovery form", async ({ page }) => {
  await page.goto("/");

  const search = page.getByLabel("Search for a movie or series");
  await search.focus();
  await expect(search).toBeFocused();
  await page.keyboard.type("A local title");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Search is safely on standby.")).toBeVisible();

  const country = page.getByLabel("Country");
  await country.focus();
  await expect(country).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByRole("option", { name: "United States" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(country).toBeFocused();

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
});
