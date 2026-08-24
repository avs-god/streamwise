import AppFrame from "@/components/AppFrame";
import TitleDialog from "@/components/TitleDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useRoute } from "wouter";

export default function TitlePage() {
  const [, params] = useRoute("/title/:mediaType/:id");
  const id = Number(params?.id);
  const mediaType = params?.mediaType === "tv" ? "tv" : "movie";
  const [region] = useState("IN");
  const [language] = useState(() => typeof navigator === "undefined" ? "en-US" : navigator.language || "en-US");
  const result = trpc.catalog.title.useQuery({ id: Number.isInteger(id) && id > 0 ? id : 1, mediaType, region, language }, { enabled: Number.isInteger(id) && id > 0, retry: false });
  const title = result.data?.title;
  return <AppFrame><main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14"><Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-[#315c4b] underline underline-offset-4"><ArrowLeft className="size-4" />Back to discovery</Link>{!title || !result.data?.configured ? <section className="mt-7 rounded-3xl border border-[#d9cfb7] bg-[#fffaf0] p-7"><p className="eyebrow">Provider-first title page</p><h1 className="serif mt-2 text-4xl text-[#315343]">Legal catalog is safely on standby.</h1><p className="mt-3 text-sm leading-6 text-[#61756c]">Connect the server-side catalog credential to view country-specific legal offers, external rating references, and related titles. Streamwise will not invent any of these.</p><TitleCommunity titleId={id} titleName={`Catalog title ${id}`} mediaType={mediaType} /></section> : <section className="mt-7"><p className="eyebrow">Provider-first title page</p><h1 className="serif mt-2 text-5xl text-[#214a3a]">{title.title}</h1><p className="mt-4 max-w-3xl leading-7 text-[#64766e]">{title.overview}</p><div className="mt-6 rounded-2xl border border-[#bfd1c1] bg-[#eef5ef] p-5"><p className="eyebrow">Where to stream in {region}</p><p className="mt-2 text-sm text-[#567166]">Open the availability panel below to compare verified subscription, ad-supported, free, rental, and purchase offers.</p></div><div className="mt-6"><TitleDialog titleId={id} mediaType={mediaType} region={region} language={language} open onOpenChange={() => {}} /></div><TitleCommunity titleId={id} titleName={title.title} mediaType={mediaType} /></section>}</main></AppFrame>;
}

function TitleCommunity({ titleId, titleName, mediaType }: { titleId: number; titleName: string; mediaType: "movie" | "tv" }) {
  const { user } = useAuth(); const utils = trpc.useUtils();
  const [reviewBody, setReviewBody] = useState("");
  const summary = trpc.community.titleRatingSummary.useQuery({ tmdbId: titleId, mediaType });
  const reviews = trpc.community.titleReviews.useQuery({ tmdbId: titleId, mediaType });
  const rate = trpc.community.setTitleRating.useMutation({ onSuccess: () => { utils.community.titleRatingSummary.invalidate(); } });
  const submitReview = trpc.community.contribute.useMutation({ onSuccess: () => { setReviewBody(""); utils.community.titleReviews.invalidate(); } });
  return <section className="mt-8 border-t border-[#d9d1c0] pt-7"><p className="eyebrow">Community ratings and reviews</p><h2 className="serif mt-2 text-3xl text-[#214a3a]">What Streamwise members think.</h2><p className="mt-2 text-sm leading-6 text-[#64766e]">This is Streamwise’s own community aggregate. IMDb and Rotten Tomatoes scores or review text are not reproduced here without a permitted data source.</p><div className="mt-4 rounded-2xl border border-[#d8d0c0] bg-[#fcfaf4] p-5"><p className="serif text-3xl text-[#224b3b]">{summary.data?.average ?? "—"}<span className="ml-1 text-base text-[#66776f]">/ 5 · {summary.data?.count ?? 0} member ratings</span></p>{user ? <div className="mt-3 flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map(value => <Button key={value} size="sm" variant="outline" onClick={() => rate.mutate({ tmdbId: titleId, mediaType, rating: value })} disabled={rate.isPending} className="border-[#b8cbbb] text-[#315c49]">{value} ★</Button>)}</div> : <p className="mt-3 text-sm text-[#63756e]">Sign in to add your private member rating.</p>}</div>{user ? <div className="mt-5 rounded-2xl border border-[#d8d0c0] bg-[#fcfaf4] p-5"><label htmlFor="title-review" className="font-semibold text-[#315c49]">Write a community review</label><textarea id="title-review" value={reviewBody} onChange={event => setReviewBody(event.target.value)} maxLength={2000} className="mt-2 min-h-24 w-full rounded-lg border border-[#cfd9d0] bg-white p-3 text-sm" placeholder="Share your perspective without personal information." /><Button onClick={() => submitReview.mutate({ tmdbId: titleId, title: titleName, mediaType, region: "IN", providerName: null, kind: "review", body: reviewBody.trim(), sourceUrl: null, shareAttribution: false })} disabled={submitReview.isPending || reviewBody.trim().length < 20} className="mt-3 bg-[#1e4a3a] text-white">Publish community review</Button></div> : null}<div className="mt-5 space-y-3">{reviews.data?.length ? reviews.data.map(review => <article key={review.id} className="rounded-xl border border-[#e0d8ca] bg-white/65 p-4"><p className="whitespace-pre-wrap text-sm leading-6 text-[#526b60]">{review.body}</p><p className="mt-2 text-xs text-[#75847c]">{review.contributorName ? `Shared by ${review.contributorName}` : "Anonymous Streamwise member"}</p></article>) : <p className="rounded-xl bg-[#f0f4ee] p-4 text-sm text-[#62756d]">No title-linked community reviews are visible yet.</p>}</div></section>;
}
