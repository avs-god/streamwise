import AppFrame from "@/components/AppFrame";
import TitleDialog from "@/components/TitleDialog";
import AiResearchPanel from "@/components/AiResearchPanel";
import CatalogOfferPreview from "@/components/CatalogOfferPreview";
import CardCommunityContribution from "@/components/CardCommunityContribution";
import LeavingSoonSignal from "@/components/LeavingSoonSignal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, BookmarkPlus, ExternalLink } from "lucide-react";
import React, { useState } from "react";
import { Link, useRoute } from "wouter";

const offerLabels = { stream: "Included with subscription", ads: "Ad-supported", free: "Free", rent: "Rent", buy: "Buy" } as const;
type LegalTitle = {
  offers: Array<{ id: number; name: string; type: keyof typeof offerLabels; source?: string; webUrl?: string | null }>;
  checkedAt: string;
  providerPageUrl: string | null;
  watchmodeOffers: Array<{ id: number; name: string; type: keyof typeof offerLabels; webUrl?: string | null; detail?: string | null }>;
  watchmodeStatus: "available" | "unavailable" | "not_configured";
  watchmodeCheckedAt: string | null;
  streamingAvailabilityOffers: Array<{ id: number; name: string; type: keyof typeof offerLabels; webUrl?: string | null; price?: string | null }>;
  streamingAvailabilityStatus: "available" | "unavailable" | "not_configured";
  streamingAvailabilityCheckedAt: string | null;
  releaseDate: string | null;
  runtime: number | null;
  genres: string[];
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
    {result.isLoading ? <section className="mt-7 rounded-3xl border border-[#b9d0bf] bg-[#edf5ee] p-7"><TitleLoadingNotice /></section> : !title || !result.data?.configured ? <section className="mt-7 rounded-3xl border border-[#d9cfb7] bg-[#fffaf0] p-7"><TitleStandbyNotice /><TitleCommunity titleId={id} titleName={`Catalog title ${id}`} mediaType={mediaType} /></section> : <section className="mt-7">
      <p className="eyebrow">Provider-first title page</p><h1 className="serif mt-2 text-5xl text-[#214a3a]">{title.title}</h1><TitleMetadata title={title} /><p className="mt-4 max-w-3xl leading-7 text-[#64766e]">{title.overview}</p>
      <LegalOfferPanel title={title} region={region} onSave={() => setSaveDialogOpen(true)} />
      <div className="mt-6"><AiResearchPanel region={region} language={language} query={`${title.title}${title.releaseDate ? ` ${title.releaseDate.slice(0, 4)}` : ""}`} /></div>
      <Link href={`/community?tmdbId=${title.id}&mediaType=${title.mediaType}&title=${encodeURIComponent(title.title)}`} className="mt-4 inline-flex items-center rounded-full border border-[#9eb6a4] bg-white px-4 py-2 text-sm font-semibold text-[#27543f] transition hover:bg-[#edf5ee]">Discuss this title with the community</Link>
      <ExternalReferencePanel encodedTitle={encodedTitle} />
      <TitleCommunity titleId={id} titleName={title.title} mediaType={mediaType} />
      <RelatedTitleGrid eyebrow="After this title" title="More catalog picks for next." titles={postWatch.data?.titles ?? []} mediaType={mediaType} region={region} language={language} />
      <RelatedTitleGrid eyebrow={`Catalog-derived similar ${mediaType === "tv" ? "series" : "films"}`} title="Keep watching from here." titles={similar.data?.titles ?? []} mediaType={mediaType} region={region} language={language} />
      <TitleDialog titleId={id} mediaType={mediaType} region={region} language={language} open={saveDialogOpen} onOpenChange={setSaveDialogOpen} />
    </section>}
  </main></AppFrame>;
}

export function TitleStandbyNotice() {
  return <><p className="eyebrow">Provider-first title page</p><h1 className="serif mt-2 text-4xl text-[#315343]">Legal catalog is safely on standby.</h1><p className="mt-3 text-sm leading-6 text-[#61756c]">Connect the server-side catalog credential to view country-specific legal offers, external rating references, and related titles. Streamwise will not invent any of these.</p><p className="mt-4 rounded-xl border border-[#ddd1b7] bg-white/65 p-3 text-sm leading-6 text-[#6b603f]">IMDb, Rotten Tomatoes, and critic-reading links are unavailable until the catalog resolves this title. Streamwise imports no external score, review text, or rating timestamp without a permitted licensed provider.</p></>;
}

export function TitleLoadingNotice() {
  return <><p className="eyebrow">Provider-first title page</p><h1 className="serif mt-2 text-4xl text-[#315343]">Checking legal offers in India.</h1><p className="mt-3 text-sm leading-6 text-[#61756c]">Streamwise is retrieving country-specific results from TMDb/JustWatch and separate comparison sources. This can take a moment; availability will be shown with its source and check time.</p><div className="mt-4 h-3 w-3/4 animate-pulse rounded-full bg-[#cfdfd1]" aria-label="Loading legal offers" /></>;
}

export function TitleMetadata({ title }: { title: Pick<LegalTitle, "releaseDate" | "runtime" | "genres"> }) {
  const details = [
    title.releaseDate ? { label: "Released", value: new Date(`${title.releaseDate}T00:00:00Z`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }) } : null,
    title.runtime ? { label: "Runtime", value: `${title.runtime} min` } : null,
    title.genres.length ? { label: "Genres", value: title.genres.join(" · ") } : null,
  ].filter((detail): detail is { label: string; value: string } => Boolean(detail));
  if (!details.length) return null;
  return <dl aria-label="Catalog title details" className="mt-4 flex flex-wrap gap-2">{details.map(detail => <div key={detail.label} className="rounded-full border border-[#d5ddd2] bg-[#f3f7f1] px-3 py-1.5 text-sm text-[#486557]"><dt className="sr-only">{detail.label}</dt><dd><span className="font-semibold">{detail.label}:</span> {detail.value}</dd></div>)}</dl>;
}

export function ExternalReferencePanel({ encodedTitle }: { encodedTitle: string }) {
  const sourceLinks = [
    { label: "IMDb reference", href: `https://www.imdb.com/find/?q=${encodedTitle}` },
    { label: "Rotten Tomatoes reference", href: `https://www.rottentomatoes.com/search?search=${encodedTitle}` },
    { label: "RogerEbert.com reading", href: `https://www.rogerebert.com/search?query=${encodedTitle}` },
    { label: "Variety reading", href: `https://variety.com/?s=${encodedTitle}` },
    { label: "The Guardian film reading", href: `https://www.theguardian.com/film` },
  ];
  return <section className="mt-8 rounded-2xl border border-[#d6d0c0] bg-[#fcfaf5] p-5"><p className="eyebrow">External ratings and critic reading</p><p className="mt-2 text-sm leading-6 text-[#64766e]">Open named editorial sources directly for their current coverage. Streamwise does not reproduce protected scores, review text, or publication metadata without a permitted licence.</p><p className="mt-3 rounded-lg bg-[#f0eee6] px-3 py-2 text-xs leading-5 text-[#617168]">IMDb and Rotten Tomatoes status: outbound-only references. Critic-reading links are source-specific outbound searches or editorial destinations, not imported criticism. No score, review text, or rating timestamp is imported until a permitted licensed integration is configured.</p><div className="mt-3 flex flex-wrap gap-2">{sourceLinks.map(link => <a key={link.label} className="rounded-full border border-[#cbd7cd] px-3 py-1.5 text-sm font-semibold text-[#315c49] hover:bg-[#eef5ef]" href={link.href} target="_blank" rel="noreferrer">{link.label}</a>)}</div></section>;
}

export function LegalOfferPanel({ title, region, onSave }: { title: LegalTitle; region: string; onSave: () => void }) {
  const groups = (["stream", "ads", "free", "rent", "buy"] as const).map(type => [type, title.offers.filter(offer => offer.type === type)] as const).filter(([, offers]) => offers.length);
  return <section className="mt-7 rounded-2xl border border-[#b9d0bf] bg-[#edf5ee] p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="eyebrow">Verified legal offers in {region}</p><h2 className="serif mt-1 text-3xl text-[#214a3a]">Where to stream</h2><p className="mt-2 text-sm leading-6 text-[#567166]">Availability via JustWatch and TMDb, checked {new Date(title.checkedAt).toLocaleString()}. Providers can change offers after this check.</p></div>{title.providerPageUrl ? <a href={title.providerPageUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#275843] underline underline-offset-4">Open source <ExternalLink className="size-3.5" /></a> : null}</div>
    {groups.length ? <div className="mt-5 space-y-4">{groups.map(([type, offers]) => <div key={type}><p className="mono text-[0.65rem] font-bold uppercase tracking-[0.11em] text-[#547266]">{offerLabels[type]}</p><div className="mt-2 flex flex-wrap gap-2">{offers.map(offer => <span key={`${type}-${offer.id}`} className="rounded-full border border-[#bad0c0] bg-white px-3 py-1.5 text-sm font-semibold text-[#315c49]">{offer.name}</span>)}</div></div>)}</div> : <p className="mt-4 rounded-xl bg-white/65 p-4 text-sm leading-6 text-[#5f746a]">No legal offer is currently reported for this title in {region}. Try another country or check again later.</p>}
    <section className="mt-5 rounded-xl border border-[#cdd9cd] bg-white/65 p-4" aria-label="Watchmode legal-offer comparison"><p className="mono text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#466b56]">Watchmode comparison</p>{title.watchmodeStatus === "available" && title.watchmodeOffers.length ? <><p className="mt-1 text-xs leading-5 text-[#62766d]">A separate licensed availability source for {region}, checked {title.watchmodeCheckedAt ? new Date(title.watchmodeCheckedAt).toLocaleString() : "just now"}. Results may differ from JustWatch via TMDb.</p><div className="mt-3 flex flex-wrap gap-2">{title.watchmodeOffers.map((offer, index) => offer.webUrl ? <a key={`${offer.type}-${offer.id}-${offer.detail ?? ""}-${index}`} href={offer.webUrl} target="_blank" rel="noreferrer" className="rounded-full border border-[#c5d6c8] bg-[#f7fbf6] px-3 py-1.5 text-sm font-semibold text-[#315c49]">{offer.name} · {offerLabels[offer.type]}{offer.detail ? ` · ${offer.detail}` : ""} · Watchmode</a> : <span key={`${offer.type}-${offer.id}-${offer.detail ?? ""}-${index}`} className="rounded-full border border-[#c5d6c8] bg-[#f7fbf6] px-3 py-1.5 text-sm font-semibold text-[#315c49]">{offer.name} · {offerLabels[offer.type]}{offer.detail ? ` · ${offer.detail}` : ""} · Watchmode</span>)}</div></> : <p className="mt-1 text-xs leading-5 text-[#62766d]">{title.watchmodeStatus === "not_configured" ? "Watchmode comparison is not configured." : "Watchmode has no mapped legal offer for this title and country right now. The primary TMDb/JustWatch result remains visible above."}</p>}</section>
    <section className="mt-4 rounded-xl border border-[#cdd9cd] bg-white/65 p-4" aria-label="Streaming Availability legal-offer comparison"><p className="mono text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#466b56]">Streaming Availability comparison</p>{title.streamingAvailabilityStatus === "available" && title.streamingAvailabilityOffers.length ? <><p className="mt-1 text-xs leading-5 text-[#62766d]">A separate country-specific source, checked {title.streamingAvailabilityCheckedAt ? new Date(title.streamingAvailabilityCheckedAt).toLocaleString() : "just now"}. <a href="https://www.movieofthenight.com/about/api" target="_blank" rel="noreferrer" className="underline underline-offset-2">Streaming availability information provided by Streaming Availability API by Movie of the Night.</a></p><div className="mt-3 flex flex-wrap gap-2">{title.streamingAvailabilityOffers.map(offer => offer.webUrl ? <a key={`${offer.type}-${offer.id}`} href={offer.webUrl} target="_blank" rel="noreferrer" className="rounded-full border border-[#c5d6c8] bg-[#f7fbf6] px-3 py-1.5 text-sm font-semibold text-[#315c49]">{offer.name} · {offerLabels[offer.type]}{offer.price ? ` · ${offer.price}` : ""} · Streaming Availability</a> : <span key={`${offer.type}-${offer.id}`} className="rounded-full border border-[#c5d6c8] bg-[#f7fbf6] px-3 py-1.5 text-sm font-semibold text-[#315c49]">{offer.name} · {offerLabels[offer.type]}{offer.price ? ` · ${offer.price}` : ""} · Streaming Availability</span>)}</div></> : <p className="mt-1 text-xs leading-5 text-[#62766d]">{title.streamingAvailabilityStatus === "not_configured" ? "Streaming Availability comparison is not configured." : "Streaming Availability has no country-specific record for this title right now. The other source-labelled results remain visible above."}</p>}</section>
    <Button onClick={onSave} className="mt-5 bg-[#1e4a3a] text-[#fbf8ee] hover:bg-[#153a2d]"><BookmarkPlus className="size-4" />Save or track these offers</Button>
  </section>;
}

function RelatedTitleGrid({ eyebrow, title, titles, mediaType, region, language }: { eyebrow: string; title: string; titles: Array<{ id: number; mediaType: "movie" | "tv"; title: string; overview: string | null }>; mediaType: "movie" | "tv"; region: string; language: string }) {
  if (!titles.length) return null;
  return <section className="mt-9 border-t border-[#d9d1c0] pt-7"><p className="eyebrow">{eyebrow}</p><h2 className="serif mt-2 text-3xl text-[#214a3a]">{title}</h2><p className="mt-2 text-sm text-[#65776f]">Catalog-derived related titles. Verified country-specific legal offers appear before any external or community context.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{titles.map(item => <article key={`${item.mediaType}-${item.id}`} className="rounded-xl border border-[#d8d1c2] bg-white/65 p-4 transition hover:-translate-y-0.5 hover:bg-[#f2f7f0]"><Link href={`/title/${item.mediaType}/${item.id}`} className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><p className="font-semibold text-[#315c49]">{item.title}</p><p className="mt-1 line-clamp-2 text-sm leading-5 text-[#6c7d74]">{item.overview || "Open this title to check country-specific legal offers."}</p><CatalogOfferPreview titleId={item.id} mediaType={item.mediaType} region={region} language={language} /></Link><LeavingSoonSignal titleId={item.id} mediaType={item.mediaType} /><CardCommunityContribution titleId={item.id} mediaType={item.mediaType} title={item.title} region={region} /></article>)}</div></section>;
}

export function TitleCommunity({ titleId, titleName, mediaType }: { titleId: number; titleName: string; mediaType: "movie" | "tv" }) {
  const { user } = useAuth(); const utils = trpc.useUtils();
  const [reviewBody, setReviewBody] = useState("");
  const summary = trpc.community.titleRatingSummary.useQuery({ tmdbId: titleId, mediaType });
  const reviews = trpc.community.titleReviews.useQuery({ tmdbId: titleId, mediaType });
  const rate = trpc.community.setTitleRating.useMutation({ onSuccess: () => { utils.community.titleRatingSummary.invalidate(); } });
  const submitReview = trpc.community.contribute.useMutation({ onSuccess: () => { setReviewBody(""); utils.community.titleReviews.invalidate(); } });
  const reportReview = trpc.community.report.useMutation();
  return <section className="mt-8 border-t border-[#d9d1c0] pt-7"><p className="eyebrow">Community ratings and reviews</p><h2 className="serif mt-2 text-3xl text-[#214a3a]">What Streamwise members think.</h2><p className="mt-2 text-sm leading-6 text-[#64766e]">This is Streamwise’s own community aggregate. IMDb and Rotten Tomatoes scores or review text are not reproduced here without a permitted data source.</p><div className="mt-4 rounded-2xl border border-[#d8d0c0] bg-[#fcfaf4] p-5"><p className="serif text-3xl text-[#224b3b]">{summary.data?.average ?? "—"}<span className="ml-1 text-base text-[#66776f]">/ 5 · {summary.data?.count ?? 0} member ratings</span></p>{user ? <div className="mt-3 flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map(value => <Button key={value} size="sm" variant="outline" onClick={() => rate.mutate({ tmdbId: titleId, mediaType, rating: value })} disabled={rate.isPending} className="border-[#b8cbbb] text-[#315c49]">{value} ★</Button>)}</div> : <p className="mt-3 text-sm text-[#63756e]">Sign in to add your private member rating.</p>}</div>{user ? <div className="mt-5 rounded-2xl border border-[#d8d0c0] bg-[#fcfaf4] p-5"><label htmlFor="title-review" className="font-semibold text-[#315c49]">Write a community review</label><textarea id="title-review" value={reviewBody} onChange={event => setReviewBody(event.target.value)} maxLength={2000} className="mt-2 min-h-24 w-full rounded-lg border border-[#cfd9d0] bg-white p-3 text-sm" placeholder="Share your perspective without personal information." /><Button onClick={() => submitReview.mutate({ tmdbId: titleId, title: titleName, mediaType, region: "IN", providerName: null, kind: "review", body: reviewBody.trim(), sourceUrl: null, shareAttribution: false })} disabled={submitReview.isPending || reviewBody.trim().length < 20} className="mt-3 bg-[#1e4a3a] text-white">Publish community review</Button></div> : null}<div className="mt-5 space-y-3">{reviews.data?.length ? reviews.data.map(review => <article key={review.id} className="rounded-xl border border-[#e0d8ca] bg-white/65 p-4"><p className="whitespace-pre-wrap text-sm leading-6 text-[#526b60]">{review.body}</p><div className="mt-2 flex items-center justify-between gap-3"><p className="text-xs text-[#75847c]">{review.contributorName ? `Shared by ${review.contributorName}` : "Anonymous Streamwise member"}</p>{user ? <ReviewReportAction postId={review.id} disabled={reportReview.isPending} onReport={postId => reportReview.mutate({ postId, reason: "other", detail: "Reported from title review." })} /> : null}</div></article>) : <p className="rounded-xl bg-[#f0f4ee] p-4 text-sm text-[#62756d]">No title-linked community reviews are visible yet.</p>}</div></section>;
}

export function ReviewReportAction({ postId, disabled, onReport }: { postId: number; disabled: boolean; onReport: (postId: number) => void }) {
  return <Button size="sm" variant="ghost" className="text-xs text-[#8b5c39]" onClick={() => onReport(postId)} disabled={disabled}>Report review</Button>;
}
