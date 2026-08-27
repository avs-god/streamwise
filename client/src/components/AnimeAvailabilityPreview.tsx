import React from "react";
import CatalogOfferPreview from "@/components/CatalogOfferPreview";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { CircleAlert, Link2 } from "lucide-react";

/** AniList metadata joins availability only when the server verifies an exact normalized catalogue-title match. */
export default function AnimeAvailabilityPreview({ title, englishTitle, nativeTitle, region, language }: { title: string; englishTitle: string | null; nativeTitle: string | null; region: string; language: string }) {
  const availability = trpc.anime.availability.useQuery({ title, englishTitle, nativeTitle, region, language }, { retry: false, staleTime: 10 * 60_000 });
  if (availability.isLoading) return <div className="mt-3"><Skeleton className="h-16 rounded-xl" /></div>;
  if (availability.error) return <p className="mt-3 flex items-center gap-1.5 text-xs leading-5 text-[#8a5a36]"><CircleAlert className="size-3.5 shrink-0" />Legal availability could not be matched right now.</p>;
  if (availability.data?.status === "catalog_not_configured") return <p className="mt-3 flex items-center gap-1.5 text-xs leading-5 text-[#667770]"><CircleAlert className="size-3.5 shrink-0" />Legal availability is on standby until a catalog provider is configured.</p>;
  if (availability.data?.status !== "matched" || !availability.data.matchedTitle) return <p className="mt-3 flex items-center gap-1.5 text-xs leading-5 text-[#667770]"><Link2 className="size-3.5 shrink-0" />No exact legal-catalog match in {region}. AniList metadata is not a streaming claim.</p>;
  return <div className="mt-3 border-t border-[#dbe1d5] pt-3"><p className="text-[0.66rem] font-bold uppercase tracking-[0.1em] text-[#436d58]">Exact legal-catalog match · {availability.data.matchedTitle.title}</p><CatalogOfferPreview titleId={availability.data.matchedTitle.id} mediaType={availability.data.matchedTitle.mediaType} region={region} language={language} /></div>;
}
