import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CalendarClock, ExternalLink } from "lucide-react";
import React from "react";

function sourceLabel(sourceUrl: string | null) {
  if (!sourceUrl) return "Member report";
  try {
    const host = new URL(sourceUrl).hostname.replace(/^www\./, "");
    return /(?:reddit|x\.com|twitter|instagram|quora|facebook|tiktok)\.com$/i.test(host) ? `Public discussion · ${host}` : `Linked public-web source · ${host}`;
  } catch { return "Linked source"; }
}

function selectedRegionFallback() {
  try { const saved = typeof window === "undefined" ? null : window.localStorage.getItem("streamwise-selected-region"); return saved && /^[A-Z]{2}$/.test(saved) ? saved : "IN"; } catch { return "IN"; }
}

/** Legal snapshot removals and contextual reports are deliberately rendered as different evidence lanes. */
export default function LeavingSoonSignal({ titleId, mediaType, region }: { titleId: number; mediaType: "movie" | "tv"; region?: string }) {
  const effectiveRegion = region ?? selectedRegionFallback();
  const signals = trpc.leavingSoon.titleSignals.useQuery({ tmdbId: titleId, mediaType, region: effectiveRegion }, { staleTime: 60_000, retry: false });
  const confirmed = signals.data?.confirmed?.find(signal => signal.sourceKind === "change_feed") ?? signals.data?.confirmed?.[0];
  const community = signals.data?.community?.[0];
  const publicWeb = signals.data?.publicWeb;
  if (!confirmed && !community && !publicWeb) return null;
  const reportedDate = community?.reportedLeavingAt ? new Date(community.reportedLeavingAt).toLocaleDateString() : null;
  const observedDate = confirmed ? new Date(confirmed.lastObservedAt).toLocaleDateString() : null;
  const expiryDate = confirmed?.sourceKind === "change_feed" ? new Date(confirmed.expiresAt).toLocaleDateString() : null;
  return <div className="mt-3 space-y-2" aria-label="Leaving Soon signals">
    {confirmed ? <div className="rounded-xl border border-[#dfbb78] bg-[#fff4d9] px-3 py-2 text-xs leading-5 text-[#704b16]"><div className="flex flex-wrap items-center gap-1.5"><Badge className="bg-[#f1d58f] text-[#694514]"><CalendarClock className="mr-1 size-3" />Leaving soon from {confirmed.providerName}</Badge><span className="font-semibold">{confirmed.sourceKind === "change_feed" ? "Provider expiry feed" : "Observed legal provider departure"}</span></div><p className="mt-1">{confirmed.sourceKind === "change_feed" ? `${confirmed.providerName} lists this title as expiring in ${confirmed.region}${expiryDate ? ` on ${expiryDate}` : ""}.` : `${confirmed.providerName} no longer appeared in the ${confirmed.region} legal catalog snapshot on ${observedDate}. An exact departure date was not supplied.`} Check the current catalog before acting.</p>{confirmed.sourceUrl ? <a href={confirmed.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-semibold underline underline-offset-2">{confirmed.sourceKind === "change_feed" ? "Open provider change source" : "Review legal catalog source"} <ExternalLink className="size-3" /></a> : null}</div> : null}
    {publicWeb && publicWeb.status === "lead" ? <div className="rounded-xl border border-[#c7d8d9] bg-[#f0f8f8] px-3 py-2 text-xs leading-5 text-[#496a6d]"><div className="flex flex-wrap items-center gap-1.5"><Badge className="bg-[#d8ecec] text-[#366063]">Public-web context</Badge><span className="font-semibold">Not a legal provider departure</span></div><p className="mt-1">{publicWeb.directResponse}</p>{[...publicWeb.sources, ...publicWeb.communitySources].slice(0, 3).map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="mt-1 mr-3 inline-flex items-center gap-1 font-semibold underline underline-offset-2">{source.domain} <ExternalLink className="size-3" /></a>)}</div> : null}
    {community ? <div className="rounded-xl border border-[#e5c993] bg-[#fff8e6] px-3 py-2 text-xs leading-5 text-[#745a2c]"><div className="flex flex-wrap items-center gap-1.5"><Badge className="bg-[#f6e5bd] text-[#75561e]"><CalendarClock className="mr-1 size-3" />Community Leaving-soon signal</Badge><span className="font-semibold">{community.providerName ?? "Provider not named"}</span>{reportedDate ? <span>· reported {reportedDate}</span> : null}</div><p className="mt-1">Unverified {sourceLabel(community.sourceUrl ?? null)}. Check the legal catalog or provider before acting.</p>{community.sourceUrl ? <a href={community.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-semibold underline underline-offset-2">Inspect source <ExternalLink className="size-3" /></a> : null}</div> : null}
  </div>;
}
