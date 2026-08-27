import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { MessageSquarePlus, Star } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

const providers = ["Netflix", "Prime Video", "Disney+", "JioHotstar", "Apple TV", "Max", "Hulu", "MUBI", "YouTube", "Other"];
const regions = [["IN", "India"], ["US", "United States"], ["GB", "United Kingdom"], ["CA", "Canada"], ["AU", "Australia"], ["DE", "Germany"], ["FR", "France"]] as const;

export default function CardCommunityContribution({ titleId, mediaType, title, region }: { titleId: number; mediaType: "movie" | "tv"; title: string; region: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"leaving_soon" | "review">("leaving_soon");
  const [provider, setProvider] = useState("Netflix");
  const [selectedRegion, setSelectedRegion] = useState(region);
  const [otherProvider, setOtherProvider] = useState("");
  const [reportedLeavingAt, setReportedLeavingAt] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [shareAttribution, setShareAttribution] = useState(false);
  const utils = trpc.useUtils();
  const contribute = trpc.community.contribute.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.community.titleLeavingSoonSignals.invalidate({ tmdbId: titleId, mediaType }), utils.community.titleReviews.invalidate({ tmdbId: titleId, mediaType })]);
      setBody(""); setSourceUrl(""); setReportedLeavingAt(""); setRating(null); setOpen(false); toast.success(mode === "leaving_soon" ? "Leaving-soon report published as unverified community context." : "Community review published as unverified community context.");
    }, onError: error => toast.error(error.message),
  });
  const setTitleRating = trpc.community.setTitleRating.useMutation({ onSuccess: () => utils.community.titleRatingSummary.invalidate({ tmdbId: titleId, mediaType }), onError: error => toast.error(error.message) });
  const selectedProvider = provider === "Other" ? otherProvider.trim() : provider;
  const submit = async () => {
    if (body.trim().length < 20) return;
    if (mode === "leaving_soon" && !selectedProvider) return;
    if (mode === "review" && rating) await setTitleRating.mutateAsync({ tmdbId: titleId, mediaType, rating });
    contribute.mutate({ tmdbId: titleId, title, mediaType, region: selectedRegion, providerName: mode === "leaving_soon" ? selectedProvider : null, kind: mode, body: body.trim(), reportedLeavingAt: mode === "leaving_soon" && reportedLeavingAt ? new Date(`${reportedLeavingAt}T00:00:00`) : null, sourceUrl: mode === "leaving_soon" && sourceUrl.trim() ? sourceUrl.trim() : null, shareAttribution });
  };
  const busy = contribute.isPending || setTitleRating.isPending;
  return <><Button type="button" size="sm" variant="outline" onClick={() => user ? setOpen(true) : startLogin()} className="mt-3 border-[#b9cdbd] bg-white text-[#2a5c46]"><MessageSquarePlus className="size-3.5" />Contribute</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[92vh] overflow-y-auto border-[#d9d3c4] bg-[#fcfaf4] sm:max-w-lg"><DialogHeader><p className="eyebrow">Community contribution</p><DialogTitle className="serif text-3xl text-[#214a3a]">Add context for {title}</DialogTitle><DialogDescription>Contributions publish immediately as unverified community context and can be reported for moderator review. They never update verified legal offers or provider-change alerts.</DialogDescription></DialogHeader><div className="mt-2 flex rounded-xl bg-[#edf3ed] p-1"><button type="button" onClick={() => setMode("leaving_soon")} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${mode === "leaving_soon" ? "bg-white text-[#214a3a] shadow-sm" : "text-[#60756b]"}`}>Leaving-soon report</button><button type="button" onClick={() => setMode("review")} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${mode === "review" ? "bg-white text-[#214a3a] shadow-sm" : "text-[#60756b]"}`}>Write a review</button></div><div className="mt-4"><Label htmlFor={`region-${titleId}`}>Country</Label><Select value={selectedRegion} onValueChange={setSelectedRegion}><SelectTrigger id={`region-${titleId}`} className="mt-1 bg-white"><SelectValue /></SelectTrigger><SelectContent>{regions.map(([code, label]) => <SelectItem key={code} value={code}>{label}</SelectItem>)}</SelectContent></Select></div>{mode === "leaving_soon" ? <div className="mt-4 space-y-3"><div><Label htmlFor={`provider-${titleId}`}>Platform</Label><Select value={provider} onValueChange={setProvider}><SelectTrigger id={`provider-${titleId}`} className="mt-1 bg-white"><SelectValue /></SelectTrigger><SelectContent>{providers.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>{provider === "Other" ? <div><Label htmlFor={`other-provider-${titleId}`}>Other platform</Label><Input id={`other-provider-${titleId}`} value={otherProvider} onChange={event => setOtherProvider(event.target.value)} maxLength={150} className="mt-1 bg-white" /></div> : null}<div><Label htmlFor={`leaving-date-${titleId}`}>Reported leaving date <span className="font-normal">(optional)</span></Label><Input id={`leaving-date-${titleId}`} type="date" value={reportedLeavingAt} onChange={event => setReportedLeavingAt(event.target.value)} className="mt-1 bg-white" /></div><div><Label htmlFor={`source-${titleId}`}>Public source link <span className="font-normal">(optional)</span></Label><Input id={`source-${titleId}`} type="url" value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} placeholder="https://…" className="mt-1 bg-white" /></div></div> : <div className="mt-4"><Label>Your rating <span className="font-normal">(optional)</span></Label><div className="mt-2 flex gap-2">{[1, 2, 3, 4, 5].map(value => <Button key={value} type="button" size="sm" variant={rating === value ? "default" : "outline"} onClick={() => setRating(value)} className={rating === value ? "bg-[#1e4a3a] text-white" : "border-[#b8cbbb] text-[#315c49]"}>{value} <Star className="size-3" /></Button>)}</div></div>}<div className="mt-4"><Label htmlFor={`contribution-${titleId}`}>{mode === "leaving_soon" ? "What did you see?" : "Your review"}</Label><textarea id={`contribution-${titleId}`} value={body} onChange={event => setBody(event.target.value)} maxLength={2000} className="mt-1 min-h-28 w-full rounded-lg border border-[#cfd9d0] bg-white p-3 text-sm" placeholder={mode === "leaving_soon" ? "Describe the source-linked observation without personal information." : "Share your perspective without personal information."} /></div><div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-[#edf3ed] p-3"><div><p className="text-sm font-semibold text-[#285442]">Show my display name</p><p className="text-xs leading-5 text-[#61776d]">Otherwise your contribution appears as a Streamwise member.</p></div><Switch checked={shareAttribution} onCheckedChange={setShareAttribution} aria-label="Show my display name" /></div><Button type="button" onClick={submit} disabled={busy || body.trim().length < 20 || (mode === "leaving_soon" && !selectedProvider)} className="mt-4 w-full bg-[#1e4a3a] text-white hover:bg-[#153a2d]">{busy ? "Publishing…" : mode === "leaving_soon" ? "Publish leaving-soon report" : "Publish community review"}</Button></DialogContent></Dialog></>;
}
