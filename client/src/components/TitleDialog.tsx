import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { BookmarkPlus, ExternalLink, Film, ShoppingBag, Tv2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const offerLabels = { stream: "Included with subscription", ads: "Ad-supported", free: "Free", rent: "Rent", buy: "Buy" } as const;

export default function TitleDialog({ titleId, mediaType, region, language, open, onOpenChange }: { titleId: number | null; mediaType: "movie" | "tv" | null; region: string; language: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [plannedFor, setPlannedFor] = useState<"this_week" | "this_month" | "someday">("this_month");
  const [providerFilter, setProviderFilter] = useState("all");
  const titleQuery = trpc.catalog.title.useQuery({ id: titleId ?? 1, mediaType: mediaType ?? "movie", region, language }, { enabled: open && Boolean(titleId && mediaType), retry: false });
  const addToWatchlist = trpc.watchlist.add.useMutation({
    onSuccess: async () => { await utils.watchlist.list.invalidate(); toast.success("Saved to your watchlist."); },
    onError: error => toast.error(error.message),
  });
  useEffect(() => { if (!open) { setPlannedFor("this_month"); setProviderFilter("all"); } }, [open]);
  const title = titleQuery.data?.title;
  const providers = title ? Array.from(new Set(title.offers.map(offer => offer.name))).sort((a, b) => a.localeCompare(b)) : [];
  const visibleOffers = title?.offers.filter(offer => providerFilter === "all" || offer.name === providerFilter) ?? [];
  const groups = title ? (["stream", "ads", "free", "rent", "buy"] as const).map(type => [type, visibleOffers.filter(offer => offer.type === type)] as const).filter(([, offers]) => offers.length) : [];

  function save() {
    if (!user) return startLogin();
    if (!title) return;
    addToWatchlist.mutate({ tmdbId: title.id, mediaType: title.mediaType, title: title.title, posterPath: title.posterPath, releaseDate: title.releaseDate, plannedFor, providerNames: title.offers.map(offer => offer.name), availabilityCheckedAt: new Date(title.checkedAt), availabilitySourceUrl: title.providerPageUrl });
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] overflow-y-auto border-[#d9d3c4] bg-[#fcfaf4] p-0 sm:max-w-2xl"><div className="p-5 sm:p-7">
    {titleQuery.isLoading ? <div className="space-y-4"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-20 w-full" /><Skeleton className="h-24 w-full" /></div> : !title || !titleQuery.data?.configured ? <><DialogHeader><DialogTitle className="serif text-2xl text-[#1e4a3a]">Availability is not connected</DialogTitle><DialogDescription>Connect a supported catalog token to inspect current legal options for this title. Streamwise does not display guessed availability.</DialogDescription></DialogHeader></> : <>
      <DialogHeader><div className="flex gap-2"><Badge className="bg-[#1e4a3a] text-[#f9f7f0]">{title.mediaType === "movie" ? "Film" : "Series"}</Badge>{title.releaseDate && <Badge variant="outline" className="border-[#cfc7b5]">{title.releaseDate.slice(0, 4)}</Badge>}</div><DialogTitle className="serif mt-2 text-3xl leading-tight text-[#1e4a3a]">{title.title}</DialogTitle><DialogDescription className="leading-6">{title.overview || "No summary is currently supplied by the catalog source."}</DialogDescription></DialogHeader>
      <div className="mt-5 flex flex-wrap gap-2 text-xs text-[#597067]">{title.genres.map(genre => <span key={genre} className="rounded-full bg-[#eae5d9] px-3 py-1">{genre}</span>)}{title.runtime ? <span className="rounded-full bg-[#eae5d9] px-3 py-1">{title.runtime} min</span> : null}</div>
      <div className="mt-6 rounded-xl border border-[#dfd8c9] bg-white/65 p-4"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Legal options in {region}</p><p className="mt-1 text-sm text-[#597067]">Checked {format(new Date(title.checkedAt), "PPp")}. A provider can change an offer after this check.</p></div>{title.providerPageUrl && <a className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#205241] underline underline-offset-4" href={title.providerPageUrl} target="_blank" rel="noreferrer">Open source <ExternalLink className="size-3.5" /></a>}</div>
        {providers.length > 1 && <div className="mt-4 flex items-center gap-2"><span className="text-xs font-semibold text-[#60746b]">Provider</span><Select value={providerFilter} onValueChange={setProviderFilter}><SelectTrigger className="h-9 w-52 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All reported providers</SelectItem>{providers.map(provider => <SelectItem key={provider} value={provider}>{provider}</SelectItem>)}</SelectContent></Select></div>}
        {groups.length ? <div className="mt-4 space-y-3">{groups.map(([type, offers]) => <div key={type}><p className="mono text-[0.65rem] uppercase tracking-[0.11em] text-[#6e7d76]">{offerLabels[type]}</p><div className="mt-1.5 flex flex-wrap gap-2">{offers.map(offer => <span key={`${type}-${offer.id}`} className="rounded-full border border-[#d9d3c4] bg-[#fbfaf6] px-3 py-1.5 text-sm font-medium text-[#315746]">{offer.name}</span>)}</div></div>)}</div> : <div className="mt-4 rounded-lg bg-[#f1eee6] px-3 py-3 text-sm text-[#596f66]">No legal offer is currently reported for this title in the selected country. Try another country or check again later.</div>}</div>
      <div className="mt-5 rounded-xl bg-[#e8f0e9] p-4"><p className="text-sm font-semibold text-[#20483a]">Save the evidence, not a guess</p><p className="mt-1 text-xs leading-5 text-[#557167]">We store this title, your viewing intent, and the provider names reported at the check time. That snapshot is the only availability input used in your subscription decisions.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><Select value={plannedFor} onValueChange={value => setPlannedFor(value as typeof plannedFor)}><SelectTrigger className="bg-white sm:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="this_week">Watch this week</SelectItem><SelectItem value="this_month">Watch this month</SelectItem><SelectItem value="someday">Keep for later</SelectItem></SelectContent></Select><Button onClick={save} disabled={addToWatchlist.isPending} className="bg-[#1e4a3a] text-[#fbf8ee] hover:bg-[#153a2d]">{user ? <><BookmarkPlus className="size-4" />Save to watchlist</> : "Sign in to save"}</Button></div></div>
    </>}
  </div></DialogContent></Dialog>;
}
