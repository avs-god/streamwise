import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { BookmarkPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function QuickWatchlistSave({ titleId, mediaType, title, posterPath, releaseDate, region, language }: { titleId: number; mediaType: "movie" | "tv"; title: string; posterPath: string | null; releaseDate: string | null; region: string; language: string }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const detail = trpc.catalog.title.useQuery({ id: titleId, mediaType, region, language }, { enabled: Boolean(user), retry: false, staleTime: 60_000 });
  const add = trpc.watchlist.add.useMutation({ onSuccess: async () => { await utils.watchlist.list.invalidate(); toast.success("Saved to your watchlist."); }, onError: error => toast.error(error.message) });
  const save = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user) return startLogin();
    const resolved = detail.data?.title;
    if (!resolved) return toast.error("Legal offer details are still loading. Try again in a moment.");
    add.mutate({ tmdbId: titleId, mediaType, title, posterPath, releaseDate, plannedFor: "this_month", note: null, monitorAvailability: true, availabilityRegion: region, providerNames: Array.from(new Set(resolved.offers.map(offer => offer.name))), offers: resolved.offers.map(offer => ({ id: offer.id, name: offer.name, type: offer.type })), availabilityCheckedAt: new Date(resolved.checkedAt), availabilitySourceUrl: resolved.providerPageUrl });
  };
  return <Button type="button" size="sm" variant="outline" onClick={save} disabled={Boolean(user) && (detail.isLoading || add.isPending)} className="mt-3 w-full border-[#9db9a5] bg-white text-[#2d6049] hover:bg-[#edf5ee]">{add.isPending ? <Loader2 className="size-4 animate-spin" /> : <BookmarkPlus className="size-4" />}{user ? "Save to watchlist" : "Sign in to save"}</Button>;
}
