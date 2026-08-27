import React from "react";
import CardProviderInsights from "@/components/CardProviderInsights";
import CardReleaseSignals from "@/components/CardReleaseSignals";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

const offerType = { stream: "Included", ads: "Ad-supported", free: "Free", rent: "Rent", buy: "Buy" } as const;

/** Shared card section: primary legal offers first, then strictly distinct ratings/review context. */
export default function CatalogOfferPreview({ titleId, mediaType, region, language }: { titleId: number; mediaType: "movie" | "tv"; region: string; language: string }) {
  const result = trpc.catalog.title.useQuery({ id: titleId, mediaType, region, language }, { retry: false, staleTime: 60_000 });
  if (result.isLoading) return <div className="mt-4"><Skeleton className="h-4 w-28" /><Skeleton className="mt-2 h-7 w-full" /></div>;
  if (result.error) return <p role="alert" className="mt-4 rounded-xl bg-[#fff3ed] px-3 py-2 text-xs leading-5 text-[#8a4b2c]">Verified legal offers could not be loaded for this card. No availability is assumed.</p>;
  const title = result.data?.title;
  if (!result.data?.configured || !title) return <p className="mt-4 rounded-xl bg-[#fffaf0] px-3 py-2 text-xs leading-5 text-[#75613e]">Legal provider preview is unavailable until a supported catalog connection resolves this title.</p>;
  const offers = title.offers.slice(0, 4);
  const comparisons = [
    { label: "Watchmode", offers: title.watchmodeOffers, status: title.watchmodeStatus, checkedAt: title.watchmodeCheckedAt },
    { label: "Movie of the Night", offers: title.streamingAvailabilityOffers, status: title.streamingAvailabilityStatus, checkedAt: title.streamingAvailabilityCheckedAt },
  ];
  return <>
    <div className="mt-4 rounded-xl border border-[#c7d9ca] bg-[#edf5ee] p-3" aria-label={`Legal offer comparison in ${region}`}>
      <p className="mono text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#356149]">Where to stream in {region}</p><p className="mt-1 text-xs text-[#587268]">Primary catalog: TMDb / JustWatch</p>
      {offers.length ? <div className="mt-2 flex flex-wrap gap-1.5">{offers.map(offer => <a key={`${offer.type}-${offer.id}`} href={offer.webUrl ?? undefined} target="_blank" rel="noreferrer" className="rounded-full border border-[#bad0bd] bg-white px-2 py-1 text-xs font-semibold text-[#315c49]">{offer.name} · {offerType[offer.type]}</a>)}</div> : <p className="mt-1 text-xs leading-5 text-[#587268]">No primary-source offer is currently reported for this country.</p>}
      <p className="mt-2 text-[0.65rem] text-[#687d73]">JustWatch via TMDb · checked {new Date(title.checkedAt).toLocaleDateString()}</p>
      <div className="mt-3 grid gap-2">{comparisons.map(source => <div key={source.label} className="rounded-lg border border-[#d1dfd3] bg-white/70 px-2.5 py-2"><p className="text-xs font-bold text-[#426755]">{source.label}</p>{source.status === "available" && source.offers.length ? <div className="mt-1 flex flex-wrap gap-1">{source.offers.slice(0, 3).map(offer => <a key={`${source.label}-${offer.id}`} href={offer.webUrl ?? undefined} target="_blank" rel="noreferrer" className="rounded-full border border-[#ccd9ce] bg-white px-2 py-1 text-[0.68rem] font-semibold text-[#315c49]">{offer.name}{offer.detail ? ` · ${offer.detail}` : ""}{offer.price ? ` · ${offer.price}` : ""}</a>)}</div> : <p className="mt-1 text-[0.68rem] leading-4 text-[#687d73]">{source.status === "not_configured" ? "This provider source is not configured." : "No matching offer or a temporary source response is available."}</p>}<p className="mt-1 text-[0.62rem] text-[#75867e]">{source.checkedAt ? `Checked ${new Date(source.checkedAt).toLocaleDateString()}` : "No check time available"}</p></div>)}</div>
      <p className="mt-3 text-[0.65rem] leading-4 text-[#687d73]">Sources may disagree or differ in coverage. Streamwise keeps them separate and never selects an unverified winner.</p>
    </div>
    <CardProviderInsights title={title} />
    <CardReleaseSignals titleId={title.id} mediaType={title.mediaType} region={region} language={language} />
  </>;
}
