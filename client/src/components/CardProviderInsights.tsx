import React from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Star } from "lucide-react";

export type CardTitleIdentity = { id: number; mediaType: "movie" | "tv"; title: string; releaseDate: string | null; tmdbVoteAverage?: number | null; tmdbVoteCount?: number | null };

function tmdbScore(value: number | null | undefined) { return typeof value === "number" && Number.isFinite(value) && value > 0 ? `${value.toFixed(1)} / 10` : "Not available"; }

/** Compact card metadata retains each provider's ratings and reviews as separate source-labelled data. */
export default function CardProviderInsights({ title }: { title: CardTitleIdentity }) {
  const omdb = trpc.ratings.omdb.useQuery({ title: title.title, releaseDate: title.releaseDate, mediaType: title.mediaType, imdbId: null }, { enabled: Boolean(title.title), retry: false, staleTime: 5 * 60_000 });
  const reviews = trpc.catalog.reviews.useQuery({ id: title.id, mediaType: title.mediaType }, { retry: false, staleTime: 5 * 60_000 });
  const firstReview = reviews.data?.reviews?.[0];
  return <aside className="mt-4 rounded-xl border border-[#dce0d1] bg-[#f8faf5] p-3" aria-label={`Source-labelled ratings and review for ${title.title}`}>
    <p className="mono text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#516d5a]">Ratings + review context</p>
    <div className="mt-2 flex flex-wrap gap-2 text-xs">
      <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f1e7] px-2.5 py-1 font-semibold text-[#315d47]"><Star className="size-3 fill-[#bd8a2b] text-[#bd8a2b]" />TMDb: {tmdbScore(title.tmdbVoteAverage)}{title.tmdbVoteCount ? ` · ${title.tmdbVoteCount.toLocaleString()} votes` : ""}</span>
      {omdb.isLoading ? <Skeleton className="h-6 w-36 rounded-full" /> : omdb.data?.status === "available" && omdb.data.ratings.length ? omdb.data.ratings.map(rating => <Badge key={rating.source} variant="outline" className="border-[#d5c694] bg-[#fffaf0] px-2 py-1 text-[0.68rem] text-[#66552d]">OMDb · {rating.source}: {rating.value}</Badge>) : <span className="rounded-full border border-[#dfd8c8] bg-white px-2.5 py-1 text-[#72766d]">{omdb.data?.status === "not_configured" ? "OMDb ratings not configured" : omdb.data?.status === "not_found" ? "No exact OMDb match" : "OMDb ratings unavailable"}</span>}
    </div>
    <div className="mt-3 border-t border-[#e1e4dc] pt-2 text-xs leading-5 text-[#5f7268]">
      <span className="font-bold text-[#3d6250]">TMDb review:</span>{" "}
      {reviews.isLoading ? <span>Loading a bounded TMDb user-review excerpt…</span> : reviews.error ? <span>TMDb review context could not be loaded.</span> : !reviews.data?.configured ? <span>TMDb review context is not configured.</span> : firstReview ? <><span className="font-semibold">{firstReview.author}:</span> {firstReview.content.slice(0, 220)}{firstReview.content.length > 220 ? "…" : ""}</> : <span>TMDb returned no user-review excerpts for this title.</span>}
    </div>
    <p className="mt-2 text-[0.65rem] leading-4 text-[#7b755f]">TMDb votes and user-review excerpts are separate from OMDb’s exact-match ratings. OMDb does not supply review excerpts here.</p>
  </aside>;
}
