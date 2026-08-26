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

/** A contextual report indicator. It deliberately does not claim current legal availability or a confirmed departure. */
export default function LeavingSoonSignal({ titleId, mediaType }: { titleId: number; mediaType: "movie" | "tv" }) {
  const signals = trpc.community.titleLeavingSoonSignals.useQuery({ tmdbId: titleId, mediaType }, { staleTime: 60_000, retry: false });
  const signal = signals.data?.[0];
  if (!signal) return null;
  const date = signal.reportedLeavingAt ? new Date(signal.reportedLeavingAt).toLocaleDateString() : null;
  return <div className="mt-3 rounded-xl border border-[#e5c993] bg-[#fff8e6] px-3 py-2 text-xs leading-5 text-[#745a2c]" aria-label={`Leaving Soon community signal for ${signal.providerName ?? "an unnamed provider"}`}>
    <div className="flex flex-wrap items-center gap-1.5"><Badge className="bg-[#f6e5bd] text-[#75561e]"><CalendarClock className="mr-1 size-3" />Leaving-soon signal</Badge><span className="font-semibold">{signal.providerName ?? "Provider not named"}</span>{date ? <span>· reported {date}</span> : null}</div>
    <p className="mt-1">Unverified {sourceLabel(signal.sourceUrl ?? null)}. Check the legal catalog or provider before acting.</p>
    {signal.sourceUrl ? <a href={signal.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-semibold underline underline-offset-2">Inspect source <ExternalLink className="size-3" /></a> : null}
  </div>;
}
