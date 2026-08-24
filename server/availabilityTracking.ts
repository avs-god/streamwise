import type { CatalogProvider } from "./catalog";

export type SnapshotOffer = Pick<CatalogProvider, "id" | "name" | "type">;

export type AvailabilityChange = {
  changed: boolean;
  added: SnapshotOffer[];
  removed: SnapshotOffer[];
  summary: string;
};

export function normalizeOffers(offers: SnapshotOffer[]): SnapshotOffer[] {
  const seen = new Map<string, SnapshotOffer>();
  offers.forEach(offer => {
    if (Number.isInteger(offer.id) && offer.id > 0 && offer.name.trim()) {
      seen.set(`${offer.type}:${offer.id}`, { id: offer.id, name: offer.name.trim(), type: offer.type });
    }
  });
  return Array.from(seen.values()).sort((a, b) => `${a.type}:${a.name}:${a.id}`.localeCompare(`${b.type}:${b.name}:${b.id}`));
}

export function offersFingerprint(offers: SnapshotOffer[]) {
  return JSON.stringify(normalizeOffers(offers));
}

export function parseSnapshotOffers(raw: string): SnapshotOffer[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return normalizeOffers(parsed.filter((offer): offer is SnapshotOffer => Boolean(offer) && typeof offer.id === "number" && typeof offer.name === "string" && ["stream", "ads", "free", "rent", "buy"].includes(offer.type)));
  } catch {
    return [];
  }
}

export function compareAvailability(previousRaw: string | null | undefined, current: SnapshotOffer[]): AvailabilityChange {
  const before = parseSnapshotOffers(previousRaw ?? "[]");
  const next = normalizeOffers(current);
  const beforeMap = new Map(before.map(offer => [`${offer.type}:${offer.id}`, offer]));
  const nextMap = new Map(next.map(offer => [`${offer.type}:${offer.id}`, offer]));
  const added = next.filter(offer => !beforeMap.has(`${offer.type}:${offer.id}`));
  const removed = before.filter(offer => !nextMap.has(`${offer.type}:${offer.id}`));
  const changed = added.length > 0 || removed.length > 0;
  const summary = !changed ? "No reported offer change since the previous snapshot." : `${added.length ? `${added.length} offer${added.length === 1 ? "" : "s"} added` : ""}${added.length && removed.length ? "; " : ""}${removed.length ? `${removed.length} offer${removed.length === 1 ? "" : "s"} removed` : ""}.`;
  return { changed, added, removed, summary };
}
