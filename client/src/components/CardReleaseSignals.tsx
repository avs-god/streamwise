import React from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { CalendarClock, Clapperboard, ExternalLink } from "lucide-react";

/** Current theatrical listing and announced streaming dates are explicitly not legal-offer badges. */
export default function CardReleaseSignals({ titleId, mediaType, region, language }: { titleId: number; mediaType: "movie" | "tv"; region: string; language: string }) {
  const signals = trpc.releaseSignals.title.useQuery({ tmdbId: titleId, mediaType, region, language }, { retry: false, staleTime: 10 * 60_000 });
  if (signals.isLoading) return <div className="mt-3 flex items-center gap-2 text-[0.66rem] text-[#72827a]"><Skeleton className="h-5 w-40 rounded-full" /></div>;
  if (signals.error || !signals.data) return null;
  const theatrical = signals.data.theatrical;
  const upcoming = signals.data.announcedStreaming ?? [];
  if (theatrical.status !== "listed" && !upcoming.length) return null;
  return <aside className="mt-3 rounded-xl border border-[#d8d0be] bg-[#fffaf0] p-3" aria-label="Theatrical and announced streaming status">
    {theatrical.status === "listed" ? <div className="flex items-start gap-2"><Clapperboard className="mt-0.5 size-4 shrink-0 text-[#8a6331]" /><div><p className="text-xs font-bold text-[#705024]">In theatres in {region}</p><p className="mt-0.5 text-[0.68rem] leading-4 text-[#786647]">TMDb currently lists this film in its regional theatrical results. This is not a streaming offer.</p>{theatrical.sourceUrl ? <a href={theatrical.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[0.68rem] font-semibold text-[#76552a] underline underline-offset-2">TMDb source <ExternalLink className="size-3" /></a> : null}</div></div> : null}
    {upcoming.map(item => <div key={`${item.providerName}-${item.announcedFor}`} className={`flex items-start gap-2 ${theatrical.status === "listed" ? "mt-3 border-t border-[#e2d6bd] pt-3" : ""}`}><CalendarClock className="mt-0.5 size-4 shrink-0 text-[#55706c]" /><div><p className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-[#315d55]">Announced OTT date <Badge className="bg-[#e5f0ec] text-[0.62rem] text-[#315d55]">{item.providerName}</Badge></p><p className="mt-0.5 text-[0.68rem] leading-4 text-[#586f68]">Provider change feed reports {new Date(item.announcedFor).toLocaleDateString()} in {region}. This is an announced future date, not a current offer.</p>{item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[0.68rem] font-semibold text-[#315d55] underline underline-offset-2">Provider source <ExternalLink className="size-3" /></a> : null}</div></div>)}
  </aside>;
}
