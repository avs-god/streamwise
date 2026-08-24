import AppFrame from "@/components/AppFrame";
import TitleDialog from "@/components/TitleDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, BookmarkPlus, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Link, useRoute } from "wouter";

const offerLabels = { stream: "Included with subscription", ads: "Ad-supported", free: "Free", rent: "Rent", buy: "Buy" } as const;
type LegalTitle = {
  offers: Array<{ id: number; name: string; type: keyof typeof offerLabels }>;
  checkedAt: string;
  providerPageUrl: string | null;
};

export default function TitlePage() {
  const [, params] = useRoute("/title/:mediaType/:id");
  const id = Number(params?.id);
  const mediaType = params?.mediaType === "tv" ? "tv" : "movie";
  const [region] = useState("IN");
  const [language] = useState(() => typeof navigator === "undefined" ? "en-US" : navigator.language || "en-US");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const validId = Number.isInteger(id) && id > 0;
  const result = trpc.catalog.title.useQuery({ id: validId ? id : 1, mediaType, region, language }, { enabled: validId, retry: false });
  const title = result.data?.title;
  const similar = trpc.catalog.similar.useQuery({ id: validId ? id : 1, mediaType, language }, { enabled: Boolean(result.data?.configured && validId), retry: false });
  const postWatch = trpc.catalog.recommended.useQuery({ id: validId ? id : 1, mediaType, language }, { enabled: Boolean(result.data?.configured && validId), retry: false });
  const encodedTitle = title ? encodeURIComponent(title.title) : "";

  return <AppFrame><main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
    <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-[#315c4b] underline underline-offset-4"><ArrowLeft className="size-4" />Back to discovery</Link>
    {!title || !result.data?.configured ? <section className="mt-7 rounded-3xl border border-[#d9cfb7] bg-[#fffaf0] p-7"><p className="eyebrow">Provider-first title page</p><h1 className="serif mt-2 text-4xl text-[#315343]">Legal catalog is safely on standby.</h1><p className="mt-3 text-sm leading-6 text-[#61756c]">Connect the server-side catalog credential to view country-specific legal offers, external rating references, and related titles. Streamwise will not invent any of these.</p><TitleCommunity titleId={id} titleName={`Catalog title ${id}`} mediaType={mediaType} /></section> : <section className="mt-7">
      <p className="eyebrow">Provider-first title page</p><h1 className="serif mt-2 text-5xl text-[#214a3a]">{title.title}</h1><p className="mt-4 max-w-3xl leading-7 text-[#64766e]">{title.overview}</p>
      <LegalOfferPanel title={title} region={region} onSave={() => setSaveDialogOpen(true)} />
      <Link href={`/community?tmdbId=${title.id}&mediaType=${title.mediaType}&title=${encodeURIComponent(title.title)}`} className="mt-4 inline-flex items-center rounded-full border border-[#9eb6a4] bg-white px-4 py-2 text-sm font-semibold text-[#27543f] transition hover:bg-[#edf5ee]">Discuss this title with the community</Link>
      <section className="mt-8 rounded-2xl border border-[#d6d0c0] bg-[#fcfaf5] p-5"><p className="eyebrow">External ratings and critic reading</p><p className="mt-2 text-sm leading-6 text-[#64766e]">Open these sources directly for their current ratings or reviews. Streamwise does not reproduce their protected scores or review text without a permitted licence.</p><div className="mt-3 flex flex-wrap gap-2"><a className="rounded-full border border-[#cbd7cd] px-3 py-1.5 text-sm font-semibold text-[#315c49] hover:bg-[#eef5ef]" href={`https://www.imdb.com/find/?q=${encodedTitle}`} target="_blank" rel="noreferrer">IMDb reference</a><a className="rounded-full border border-[#cbd7cd] px-3 py-1.5 text-sm font-semibold text-[#315c49] hover:bg-[#eef5ef]" href={`https://www.rottentomatoes.com/search?search=${encodedTitle}`} target="_blank" rel="noreferrer">Rotten Tomatoes reference</a><a className="rounded-full border border-[#cbd7cd] px-3 py-1.5 text-sm font-semibold text-[#315c49] hover:bg-[#eef5ef]" href={`https://www.google.com/search?q=${encodedTitle}%20critic%20reviews`} target="_blank" rel="noreferrer">Critic and blog reading</a></div></section>
      <TitleCommunity titleId={id} titleName={title.title} mediaType={mediaType} />
      <RelatedTitleGrid eyebrow="After this title" title="More catalog picks for next." titles={postWatch.data?.titles ?? []} mediaType={mediaType} />
      <RelatedTitleGrid eyebrow={`Catalog-derived similar ${mediaType === "tv" ? "series" : "films"}`} title="Keep watching from here." titles={similar.data?.titles ?? []} mediaType={mediaType} />
      <TitleDialog titleId={id} mediaType={mediaType} region={region} language={language} open={saveDialogOpen} onOpenChange={setSaveDialogOpen} />
    </section>}
  </main></AppFrame>;
}

function LegalOfferPanel({ title, region, onSave }: { title: LegalTitle; region: string; onSave: () => void }) {
  const groups = (["stream", "ads", "free", "rent", "buy"] as const).map(type => [type, title.offers.filter(offer => offer.type === type)] as const).filter(([, offers]) => offers.length);
  return <section className="mt-7 rounded-2xl border border-[#b9d0bf] bg-[#edf5ee] p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="eyebrow">Verified legal offers in {region}</p><h2 className="serif mt-1 text-3xl text-[#214a3a]">Where to stream</h2><p className="mt-2 text-sm leading-6 text-[#567166]">Availability via JustWatch and TMDb, checked {new Date(title.checkedAt).toLocaleString()}. Providers can change offers after this check.</p></div>{title.providerPageUrl ? <a href={title.providerPageUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#275843] underline underline-offset-4">Open source <ExternalLink className="size-3.5" /></a> : null}</div>
    {groups.length ? <div className="mt-5 space-y-4">{groups.map(([type, offers]) => <div key={type}><p className="mono text-[0.65rem] font-bold uppercase tracking-[0.11em] text-[#547266]">{offerLabels[type]}</p><div className="mt-2 flex flex-wrap gap-2">{offers.map(offer => <span key={`${type}-${offer.id}`} className="rounded-full border border-[#bad0c0] bg-white px-3 py-1.5 text-sm font-semibold text-[#315c49]">{offer.name}</span>)}</div></div>)}</div> : <p className="mt-4 rounded-xl bg-white/65 p-4 text-sm leading-6 text-[#5f746a]">No legal offer is currently reported for this title in {region}. Try another country or check again later.</p>}
    <Button onClick={onSave} className="mt-5 bg-[#1e4a3a] text-[#fbf8ee] hover:bg-[#153a2d]"><BookmarkPlus className="size-4" />Save or track these offers</Button>
  </section>;
}

function RelatedTitleGrid({ eyebrow, title, titles, mediaType }: { eyebrow: string; title: string; titles: Array<{ id: number; mediaType: "movie" | "tv"; title: string; overview: string | null }>; mediaType: "movie" | "tv" }) {
  if (!titles.length) return null;
  return <section className="mt-9 border-t border-[#d9d1c0] pt-7"><p className="eyebrow">{eyebrow}</p><h2 className="serif mt-2 text-3xl text-[#214a3a]">{title}</h2><p className="mt-2 text-sm text-[#65776f]">Catalog-derived related titles. Open one to check its country-specific legal offers.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{titles.map(item => <Link key={`${item.mediaType}-${item.id}`} href={`/title/${item.mediaType}/${item.id}`} className="rounded-xl border border-[#d8d1c2] bg-white/65 p-4 transition hover:-translate-y-0.5 hover:bg-[#f2f7f0]"><p className="font-semibold text-[#315c49]">{item.title}</p><p className="mt-1 line-clamp-2 text-sm leading-5 text-[#6c7d74]">{item.overview || "Open this title to check country-specific legal offers."}</p></Link>)}</div></section>;
}

function TitleCommunity({ titleId, titleName, mediaType }: { titleId: number; titleName: string; mediaType: "movie" | "tv" }) {
  const { user } = useAuth(); const utils = trpc.useUtils();
  const [reviewBody, setReviewBody] = useState("");
  const summary = trpc.community.titleRatingSummary.useQuery({ tmdbId: titleId, mediaType });
  const reviews = trpc.community.titleReviews.useQuery({ tmdbId: titleId, mediaType });
  const rate = trpc.community.setTitleRating.useMutation({ onSuccess: () => { utils.community.titleRatingSummary.invalidate(); } });
  const submitReview = trpc.community.contribute.useMutation({ onSuccess: () => { setReviewBody(""); utils.community.titleReviews.invalidate(); } });
  const reportReview = trpc.community.report.useMutation();
  return <section className="mt-8 border-t border-[#d9d1c0] pt-7"><p className="eyebrow">Community ratings and reviews</p><h2 className="serif mt-2 text-3xl text-[#214a3a]">What Streamwise members think.</h2><p className="mt-2 text-sm leading-6 text-[#64766e]">This is Streamwise’s own community aggregate. IMDb and Rotten Tomatoes scores or review text are not reproduced here without a permitted data source.</p><div className="mt-4 rounded-2xl border border-[#d8d0c0] bg-[#fcfaf4] p-5"><p className="serif text-3xl text-[#224b3b]">{summary.data?.average ?? "—"}<span className="ml-1 text-base text-[#66776f]">/ 5 · {summary.data?.count ?? 0} member ratings</span></p>{user ? <div className="mt-3 flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map(value => <Button key={value} size="sm" variant="outline" onClick={() => rate.mutate({ tmdbId: titleId, mediaType, rating: value })} disabled={rate.isPending} className="border-[#b8cbbb] text-[#315c49]">{value} ★</Button>)}</div> : <p className="mt-3 text-sm text-[#63756e]">Sign in to add your private member rating.</p>}</div>{user ? <div className="mt-5 rounded-2xl border border-[#d8d0c0] bg-[#fcfaf4] p-5"><label htmlFor="title-review" className="font-semibold text-[#315c49]">Write a community review</label><textarea id="title-review" value={reviewBody} onChange={event => setReviewBody(event.target.value)} maxLength={2000} className="mt-2 min-h-24 w-full rounded-lg border border-[#cfd9d0] bg-white p-3 text-sm" placeholder="Share your perspective without personal information." /><Button onClick={() => submitReview.mutate({ tmdbId: titleId, title: titleName, mediaType, region: "IN", providerName: null, kind: "review", body: reviewBody.trim(), sourceUrl: null, shareAttribution: false })} disabled={submitReview.isPending || reviewBody.trim().length < 20} className="mt-3 bg-[#1e4a3a] text-white">Publish community review</Button></div> : null}<div className="mt-5 space-y-3">{reviews.data?.length ? reviews.data.map(review => <article key={review.id} className="rounded-xl border border-[#e0d8ca] bg-white/65 p-4"><p className="whitespace-pre-wrap text-sm leading-6 text-[#526b60]">{review.body}</p><div className="mt-2 flex items-center justify-between gap-3"><p className="text-xs text-[#75847c]">{review.contributorName ? `Shared by ${review.contributorName}` : "Anonymous Streamwise member"}</p>{user ? <Button size="sm" variant="ghost" className="text-xs text-[#8b5c39]" onClick={() => reportReview.mutate({ postId: review.id, reason: "other", detail: "Reported from title review." })} disabled={reportReview.isPending}>Report review</Button> : null}</div></article>) : <p className="rounded-xl bg-[#f0f4ee] p-4 text-sm text-[#62756d]">No title-linked community reviews are visible yet.</p>}</div></section>;
}
