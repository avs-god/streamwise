import { compareAvailability, offersFingerprint, type SnapshotOffer } from "./availabilityTracking";
import { getCatalogDetail, isCatalogConfigured } from "./catalog";
import {
  addAvailabilitySnapshot,
  createAlert,
  getAlertPreferences,
  getLatestSnapshot,
  getOwnedWatchlistItem,
  getProviderAlertSubscriptions,
  getUserById,
  updateWatchlistAvailability,
} from "./db";
import { sendOptedInEmail } from "./email";

function compactOffers(offers: SnapshotOffer[]) { return offers.map(({ id, name, type }) => ({ id, name, type })); }

export function matchesProviderAlertSelection(change: { added: SnapshotOffer[]; removed: SnapshotOffer[] }, subscriptions: Array<{ providerName: string; region: string; enabled: boolean }>, region: string) {
  const selected = subscriptions.filter(subscription => subscription.enabled && subscription.region === region).map(subscription => subscription.providerName.trim().toLocaleLowerCase());
  if (!selected.length) return true;
  const changedProviders = [...change.added, ...change.removed].map(offer => offer.name.trim().toLocaleLowerCase());
  return changedProviders.some(provider => selected.includes(provider));
}

export async function refreshTrackedTitle(userId: number, watchlistItemId: number, language = "en-US") {
  const item = await getOwnedWatchlistItem(userId, watchlistItemId);
  if (!item) throw new Error("Watchlist title not found.");
  if (!isCatalogConfigured()) return { configured: false, refreshed: false, changed: false, reason: "Live catalog is not configured." };
  const response = await getCatalogDetail({ id: item.tmdbId, mediaType: item.mediaType, region: item.availabilityRegion, language });
  if (!response.configured || !response.title) return { configured: false, refreshed: false, changed: false, reason: "Catalog detail was unavailable." };
  const detail = response.title;
  const offers = compactOffers(detail.offers);
  const latest = await getLatestSnapshot(item.id);
  const change = compareAvailability(latest?.offersJson, offers);
  const fingerprint = offersFingerprint(offers);
  const checkedAt = new Date(detail.checkedAt);
  await updateWatchlistAvailability(userId, item.id, { providerNamesJson: JSON.stringify(Array.from(new Set(offers.map(offer => offer.name)))), checkedAt, sourceUrl: detail.providerPageUrl, region: item.availabilityRegion });
  if (!latest || latest.fingerprint !== fingerprint) {
    await addAvailabilitySnapshot({ watchlistItemId: item.id, region: item.availabilityRegion, offersJson: JSON.stringify(offers), fingerprint, sourceUrl: detail.providerPageUrl, checkedAt });
  }
  if (latest && change.changed && item.monitorAvailability) {
    const preferences = await getAlertPreferences(userId);
    const providerSelections = await getProviderAlertSubscriptions(userId);
    if (preferences.availabilityChangesEnabled && preferences.inAppEnabled && matchesProviderAlertSelection(change, providerSelections, item.availabilityRegion)) {
      const title = `Availability changed: ${item.title}`;
      const body = `${change.summary} This is an observed difference between two ${item.availabilityRegion} source snapshots; it is not a confirmed leaving-soon notice.`;
      await createAlert({ userId, type: "availability_changed", title, body, payloadJson: JSON.stringify({ watchlistItemId: item.id, region: item.availabilityRegion, added: change.added, removed: change.removed, checkedAt: detail.checkedAt }) });
      if (preferences.emailEnabled && preferences.emailLeavingSoonEnabled) {
        const user = await getUserById(userId);
        if (user?.email) {
          try {
            await sendOptedInEmail({ to: user.email, subject: title, html: `<p>${escapeHtml(body)}</p><p>Open Streamwise to inspect the private provider-change digest and current offers.</p>` });
          } catch (error) {
            console.warn("[Email] Provider-change email was not sent:", error);
          }
        }
      }
    }
  }
  return { configured: true, refreshed: true, changed: Boolean(latest && change.changed), change, checkedAt: detail.checkedAt, title: item.title };
}

function escapeHtml(value: string) { return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character); }

export async function refreshTrackedTitlesForUser(userId: number, language = "en-US") {
  const { getWatchlist } = await import("./db");
  const items = (await getWatchlist(userId)).filter(item => item.monitorAvailability).slice(0, 40);
  const results = [] as Awaited<ReturnType<typeof refreshTrackedTitle>>[];
  for (const item of items) results.push(await refreshTrackedTitle(userId, item.id, language));
  return { checked: results.length, changed: results.filter(result => result.changed).length, configured: isCatalogConfigured(), results };
}
