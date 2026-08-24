import AppFrame from "@/components/AppFrame";
import TitleDialog from "@/components/TitleDialog";
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
  return <AppFrame><main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14"><Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-[#315c4b] underline underline-offset-4"><ArrowLeft className="size-4" />Back to discovery</Link>{!title || !result.data?.configured ? <section className="mt-7 rounded-3xl border border-[#d9cfb7] bg-[#fffaf0] p-7"><p className="eyebrow">Provider-first title page</p><h1 className="serif mt-2 text-4xl text-[#315343]">Legal catalog is safely on standby.</h1><p className="mt-3 text-sm leading-6 text-[#61756c]">Connect the server-side catalog credential to view country-specific legal offers, community discussion, external rating references, and related titles. Streamwise will not invent any of these.</p></section> : <section className="mt-7"><p className="eyebrow">Provider-first title page</p><h1 className="serif mt-2 text-5xl text-[#214a3a]">{title.title}</h1><p className="mt-4 max-w-3xl leading-7 text-[#64766e]">{title.overview}</p><div className="mt-6 rounded-2xl border border-[#bfd1c1] bg-[#eef5ef] p-5"><p className="eyebrow">Where to stream in {region}</p><p className="mt-2 text-sm text-[#567166]">Open the availability panel below to compare verified subscription, ad-supported, free, rental, and purchase offers.</p></div><div className="mt-6"><TitleDialog titleId={id} mediaType={mediaType} region={region} language={language} open onOpenChange={() => {}} /></div></section>}</main></AppFrame>;
}
