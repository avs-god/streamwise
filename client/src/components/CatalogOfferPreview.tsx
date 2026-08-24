import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

const offerType = { stream: "Included", ads: "Ad-supported", free: "Free", rent: "Rent", buy: "Buy" } as const;

export default function CatalogOfferPreview({ titleId, mediaType, region, language }: { titleId: number; mediaType: "movie" | "tv"; region: string; language: string }) {
  const result = trpc.catalog.title.useQuery({ id: titleId, mediaType, region, language }, { retry: false, staleTime: 60_000 });
  if (result.isLoading) return <div className="mt-4"><Skeleton className="h-4 w-28" /><Skeleton className="mt-2 h-7 w-full" /></div>;
  if (result.error) return <p role="alert" className="mt-4 rounded-xl bg-[#fff3ed] px-3 py-2 text-xs leading-5 text-[#8a4b2c]">Verified legal offers could not be loaded for this card. No availability is assumed.</p>;
  const title = result.data?.title;
  if (!result.data?.configured || !title) return <p className="mt-4 rounded-xl bg-[#fffaf0] px-3 py-2 text-xs leading-5 text-[#75613e]">Legal provider preview is unavailable until a supported catalog connection resolves this title.</p>;
  const offers = title.offers.slice(0, 4);
  return <div className="mt-4 rounded-xl border border-[#c7d9ca] bg-[#edf5ee] p-3" aria-label={`Verified legal offers in ${region}`}><p className="mono text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#356149]">Where to stream in {region}</p>{offers.length ? <div className="mt-2 flex flex-wrap gap-1.5">{offers.map(offer => <span key={`${offer.type}-${offer.id}`} className="rounded-full border border-[#bad0bd] bg-white px-2 py-1 text-xs font-semibold text-[#315c49]">{offer.name} · {offerType[offer.type]}</span>)}</div> : <p className="mt-1 text-xs leading-5 text-[#587268]">No legal offer is currently reported for this country.</p>}<p className="mt-2 text-[0.65rem] text-[#687d73]">JustWatch via TMDb · checked {new Date(title.checkedAt).toLocaleDateString()}</p></div>;
}
