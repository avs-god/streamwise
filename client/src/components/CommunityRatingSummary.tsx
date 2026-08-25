import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function CommunityRatingSummary({ titleId, mediaType }: { titleId: number; mediaType: "movie" | "tv" }) {
  const summary = trpc.community.titleRatingSummary.useQuery({ tmdbId: titleId, mediaType }, { retry: false, staleTime: 60_000 });
  if (summary.isLoading) return <p className="mt-3 text-xs text-[#71847a]">Loading member rating…</p>;
  if (summary.error) return <p className="mt-3 text-xs text-[#71847a]">Member rating is unavailable right now.</p>;
  const count = summary.data?.count ?? 0;
  return <p className="mt-3 text-xs leading-5 text-[#60786d]">Community: <strong className="text-[#315c49]">{count ? `${summary.data?.average ?? "—"}/5` : "No ratings yet"}</strong>{count ? ` · ${count} member rating${count === 1 ? "" : "s"}` : ""} · <Link href={`/title/${mediaType}/${titleId}`} className="font-semibold text-[#2f634f] underline underline-offset-2">read or contribute</Link></p>;
}
