import AppFrame from "@/components/AppFrame";
import { ConnectionNotice, PrivacyNote } from "@/components/ConnectionNotice";
import TitleDialog from "@/components/TitleDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CalendarClock, CircleAlert, Clapperboard, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { Link } from "wouter";

const regions = [
  ["IN", "India"], ["US", "United States"], ["GB", "United Kingdom"], ["CA", "Canada"], ["AU", "Australia"], ["DE", "Germany"], ["FR", "France"],
] as const;

export default function Home() {
  const [region, setRegion] = useState("IN");
  const [language] = useState(() => typeof navigator === "undefined" ? "en-US" : navigator.language || "en-US");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [selected, setSelected] = useState<{ id: number; mediaType: "movie" | "tv" } | null>(null);
  const [methodOpen, setMethodOpen] = useState(false);
  const methodButtonRef = useRef<HTMLButtonElement>(null);
  const catalogStatus = trpc.catalog.status.useQuery();
  const search = trpc.catalog.search.useQuery({ query: submittedQuery, language }, { enabled: submittedQuery.length >= 2, retry: false });

  function submit(event: FormEvent) {
    event.preventDefault();
    const normalized = query.trim();
    if (normalized.length >= 2) setSubmittedQuery(normalized);
  }

  return <AppFrame>
    <main>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:pb-14 lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
          <div className="reveal">
            <p className="eyebrow">Legal viewing, fewer loose ends</p>
            <h1 className="serif mt-3 max-w-3xl text-5xl leading-[0.98] tracking-[-0.055em] text-[#1c4536] sm:text-6xl lg:text-7xl">Find the film.<br /><em className="font-normal text-[#7b5a2b]">Know the cost.</em></h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#5d7169] sm:text-lg">Search lawful options across services in your country, then connect every subscription decision to the viewing you have actually planned.</p>
          </div>
          <div className="reveal rounded-[1.75rem] border border-[#d8d0bf] bg-[#f8f5ed]/90 p-5 shadow-[0_14px_44px_rgba(55,76,63,.08)]" style={{ animationDelay: "80ms" }}>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#315c4b]"><Sparkles className="size-4" /> The Streamwise promise</div>
            <p className="mt-2 text-sm leading-6 text-[#5b7068]">We explain the inputs behind every recommendation. We never infer your budget from bank accounts, receipts, or viewing history.</p>
            <button ref={methodButtonRef} onClick={() => setMethodOpen(true)} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#255643] underline decoration-[#9fb7aa] underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">How it works <ArrowRight className="size-3.5" /></button>
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_18rem]">
          <form onSubmit={submit} className="relative"><label htmlFor="title-search" className="sr-only">Search for a movie or series</label><Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[#668075]" /><Input id="title-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try a movie, series, or local title" className="h-16 rounded-2xl border-[#cfc7b6] bg-white/85 pl-13 pr-32 text-base shadow-sm placeholder:text-[#829188] focus-visible:ring-[#5f8d76]" /><Button type="submit" className="absolute right-2 top-2 h-12 rounded-xl bg-[#1e4a3a] px-5 text-[#f9f7f0] hover:bg-[#153a2d]">Search</Button></form>
          <div><label className="sr-only" htmlFor="country">Country</label><Select value={region} onValueChange={setRegion}><SelectTrigger id="country" className="h-16 rounded-2xl border-[#cfc7b6] bg-white/85 px-5 shadow-sm"><div className="flex items-center gap-2"><SlidersHorizontal className="size-4 text-[#60786d]" /><SelectValue /></div></SelectTrigger><SelectContent>{regions.map(([code, name]) => <SelectItem key={code} value={code}>{name}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-[#6a7d75]"><CircleAlert className="size-3.5" /> Country selection affects availability. Search results and provider options are not a promise of price, catalog permanence, or eligibility.</p>

        <div className="mt-7"><ConnectionNotice configured={catalogStatus.data?.configured ?? false} /></div>
      </section>

      <section className="border-y border-[#d9d1c0] bg-[#f4f0e6]/65"><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {!submittedQuery ? <div className="grid gap-6 rounded-3xl border border-dashed border-[#c9c0ae] bg-[#faf8f1]/60 p-7 sm:grid-cols-[auto_1fr] sm:items-center"><div className="grid size-14 place-items-center rounded-2xl bg-[#e7deca] text-[#315d4a]"><Clapperboard className="size-6" /></div><div><p className="serif text-2xl font-semibold text-[#264d3e]">Start with what you want to watch.</p><p className="mt-1 max-w-2xl text-sm leading-6 text-[#62746d]">Enter a title above to see its legal streaming, rental, and purchase categories in the selected country. We only show the catalog’s returned data and when it was checked.</p></div></div> : search.isLoading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-2xl" />)}</div> : search.error ? <div className="rounded-2xl border border-[#e0b9a7] bg-[#fbede6] p-5 text-sm text-[#8a4b2c]">We could not reach the catalog source right now. No availability was recorded. Please try again later.</div> : !search.data?.configured ? <div className="rounded-3xl border border-[#d9cfb7] bg-[#fffaf0] p-7"><p className="serif text-2xl text-[#315343]">Search is safely on standby.</p><p className="mt-2 max-w-2xl text-sm leading-6 text-[#61756c]">The catalog credential has not been connected yet, so there are no search results to show. This avoids the misleading practice of filling an availability tool with made-up titles or provider offers.</p></div> : search.data.titles.length ? <><div className="mb-5 flex items-end justify-between gap-4"><div><p className="eyebrow">Search results</p><h2 className="serif mt-1 text-3xl text-[#244b3b]">Legal options start with the right title.</h2></div><p className="hidden text-right text-xs leading-5 text-[#6c7b74] sm:block">Metadata retrieved {search.data.checkedAt ? new Date(search.data.checkedAt).toLocaleString() : "now"}<br />Open a title for country-specific offers.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{search.data.titles.map(title => <button key={`${title.mediaType}-${title.id}`} onClick={() => setSelected({ id: title.id, mediaType: title.mediaType })} className="group rounded-2xl border border-[#d9d1c0] bg-[#fcfaf4] p-5 text-left shadow-[0_4px_16px_rgba(43,66,53,.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[#afc4b7] hover:shadow-[0_12px_22px_rgba(43,66,53,.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f8d76]"><div className="flex items-start justify-between gap-4"><span className="rounded-full bg-[#e8dfca] px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-[#5e673d]">{title.mediaType === "movie" ? "Film" : "Series"}</span>{title.releaseDate && <span className="mono text-xs text-[#708078]">{title.releaseDate.slice(0, 4)}</span>}</div><h3 className="serif mt-5 text-2xl leading-tight text-[#274f3f] group-hover:text-[#16543d]">{title.title}</h3>{title.originalTitle && title.originalTitle !== title.title && <p className="mt-1 text-sm italic text-[#77867e]">{title.originalTitle}</p>}<p className="mt-3 line-clamp-2 text-sm leading-6 text-[#64766e]">{title.overview || "Open this title to check its legal availability."}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#2f634f]">Check options <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" /></span></button>)}</div></> : <div className="rounded-3xl border border-dashed border-[#c9c0ae] bg-[#faf8f1]/60 p-7"><p className="serif text-2xl text-[#315343]">No matching catalogue titles.</p><p className="mt-2 text-sm leading-6 text-[#61756c]">Try a different spelling, translated title, original title, or release year. No availability was assumed from an empty search.</p></div>}</div></section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:px-6 lg:grid-cols-[1.25fr_.75fr]">
        <div className="rounded-3xl bg-[#1e4a3a] p-7 text-[#f8f6ec] sm:p-9"><p className="eyebrow text-[#c6d8ae]">Decision hygiene</p><h2 className="serif mt-2 max-w-xl text-3xl leading-tight">Subscriptions should answer to a plan, not a fear of missing out.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#d2e0d8]">Add the plans you already pay for, save titles with a viewing horizon, and see keep, pause, or cancel candidates—each with the exact inputs and a plain-language rationale.</p><Link href="/wallet" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#f0e3c1] px-4 py-2.5 text-sm font-bold text-[#1e4a3a] transition hover:bg-white">Open subscription wallet <ArrowRight className="size-4" /></Link></div>
        <div className="rounded-3xl border border-[#d8d0bf] bg-[#fbf8ef] p-7"><CalendarClock className="size-5 text-[#8c6b32]" /><h3 className="serif mt-4 text-2xl text-[#365444]">Time it to renewals.</h3><p className="mt-2 text-sm leading-6 text-[#64766e]">Renewal timing is never hidden in the score. It is shown only to help you review a low-use plan before it renews.</p><Link href="/decisions" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#2f634f] underline underline-offset-4">Explore transparent decisions <ArrowRight className="size-3.5" /></Link></div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6"><PrivacyNote /></section>
    </main>
    <TitleDialog titleId={selected?.id ?? null} mediaType={selected?.mediaType ?? null} region={region} language={language} open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }} />
    <MethodDialog open={methodOpen} onOpenChange={setMethodOpen} onCloseAutoFocus={() => methodButtonRef.current?.focus()} />
  </AppFrame>;
}

function MethodDialog({ open, onOpenChange, onCloseAutoFocus }: { open: boolean; onOpenChange: (open: boolean) => void; onCloseAutoFocus: () => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent onCloseAutoFocus={event => { event.preventDefault(); onCloseAutoFocus(); }} className="border-[#d9d3c4] bg-[#fcfaf4] sm:max-w-xl"><DialogHeader><p className="eyebrow">Explainable by design</p><DialogTitle className="serif text-3xl text-[#214a3a]">How Streamwise works</DialogTitle><DialogDescription className="leading-6">Streamwise makes its inputs visible instead of pretending it knows more about you than it does.</DialogDescription></DialogHeader><div className="mt-2 grid gap-3"><div className="rounded-xl bg-[#eaf0e9] p-3 text-sm leading-6 text-[#506a5f]"><strong className="text-[#2f5d49]">Availability:</strong> we use a legal-provider snapshot for the country you selected and show when it was checked.</div><div className="rounded-xl bg-[#f4ecd9] p-3 text-sm leading-6 text-[#675a3c]"><strong className="text-[#5d4923]">Subscription decisions:</strong> we use saved titles, their viewing horizon, your entered plan cost/cycle and intent, and any renewal date you enter.</div><div className="rounded-xl bg-[#eff0e9] p-3 text-sm leading-6 text-[#526860]"><strong className="text-[#2f5d49]">What we do not use:</strong> bank activity, card transactions, viewing history, credit data, or an undisclosed affordability score.</div></div></DialogContent></Dialog>;
}
