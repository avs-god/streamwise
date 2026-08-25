import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ExternalLink, FileSearch, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

function sourceCategory(domain: string) {
  const value = domain.toLowerCase();
  if (/(indiewire|variety|hollywoodreporter|empireonline|rogerebert|letterboxd|film|cinema|screenrant)/.test(value)) return { label: "Critic / film reading", className: "bg-[#e8e1f4] text-[#5c477d]" };
  return { label: "Reporting / reference", className: "bg-[#e3edf0] text-[#3d6670]" };
}

export default function AiResearchPanel({ region, language, query }: { region: string; language: string; query: string }) {
  const { user, loading } = useAuth();
  const executedQuery = useRef("");
  const research = trpc.ai.research.useMutation({ onError: error => toast.error(error.message) });
  useEffect(() => {
    const normalized = query.trim();
    const key = `${normalized}|${region}|${language}|${user?.id ?? "guest"}`;
    if (normalized.length < 2 || !user || executedQuery.current === key) return;
    executedQuery.current = key;
    research.mutate({ query: normalized, region, language });
  }, [query, region, language, user?.id]);

  return <aside aria-labelledby="ai-research-title" className="h-full rounded-3xl border border-[#cbd8cc] bg-[#eef4ed]/70 p-5 shadow-[0_9px_28px_rgba(48,86,65,.05)] sm:p-6"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-sm font-bold text-[#2c634c]"><Sparkles className="size-4" />AI public-web context</div><h2 id="ai-research-title" className="serif mt-2 text-2xl text-[#234a3a]">Unverified web context.</h2></div><div className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#c5d5c6] bg-white/70 px-2.5 py-1 text-[0.64rem] font-semibold text-[#426655]"><ShieldCheck className="size-3.5" />Separate evidence</div></div>
    {!query.trim() ? <div className="mt-6 rounded-2xl border border-dashed border-[#c7d2c6] bg-white/50 p-4 text-sm leading-6 text-[#64766e]">Search a title once above. Streamwise will run the legal country catalog and AI public-web research side by side, then keep their evidence clearly separate.</div> : loading ? <div className="mt-6 text-sm text-[#64766e]">Checking whether AI research can be run for this signed-in session…</div> : !user ? <div className="mt-6 rounded-2xl border border-[#d8cfb8] bg-[#fffaf0] p-4"><p className="text-sm leading-6 text-[#695b3e]">Legal catalog results can be viewed without an account. Sign in to run the separate AI public-web research for “{query}”.</p><Button onClick={() => startLogin()} className="mt-3 bg-[#275d47] text-[#fbf8ee] hover:bg-[#194634]"><FileSearch className="size-4" />Sign in for web context</Button></div> : research.isPending ? <div className="mt-6 flex items-center gap-2 rounded-2xl border border-[#c7d7ca] bg-white/60 p-4 text-sm text-[#426655]"><Loader2 className="size-4 animate-spin" />Resolving title intent and grounding public sources…</div> : research.isError ? <div role="alert" className="mt-6 rounded-2xl border border-[#e0b9a7] bg-[#fbede6] p-4 text-sm leading-6 text-[#8a4b2c]">Public-web research could not be completed. Legal catalog results remain separate and unaffected.</div> : research.data ? <div className="mt-5 rounded-2xl border border-[#d4dfd4] bg-[#fcfcf8] p-4"><p className="mono text-[0.65rem] uppercase tracking-[0.1em] text-[#537366]">{research.data.status === "lead" ? "Grounded public-web context" : "No grounded source returned"}</p>{research.data.correctionNote ? <p className="mt-2 rounded-lg bg-[#edf4ed] px-3 py-2 text-xs leading-5 text-[#426655]">{research.data.correctionNote.replace(/\*\*/g, "")}</p> : null}<p className="mt-2 text-sm leading-6 text-[#38584b]">{research.data.summary}</p>{research.data.sources.length ? <div className="mt-4 border-t border-[#e1e7df] pt-3"><p className="text-xs font-bold uppercase tracking-[0.08em] text-[#597366]">Inspectable reporting and editorial sources</p><ul className="mt-2 space-y-2">{research.data.sources.map(source => { const category = sourceCategory(source.domain); return <li key={source.url}><span className={`mr-2 inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${category.className}`}>{category.label}</span><a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 text-sm font-semibold text-[#2d664e] underline underline-offset-4"><span>{source.title} <span className="font-normal text-[#6a7d74]">· {source.domain}</span></span><ExternalLink className="mt-0.5 size-3.5 shrink-0" /></a></li>; })}</ul></div> : null}{research.data.communitySources.length ? <div className="mt-4 rounded-xl border border-dashed border-[#dcc9a7] bg-[#fffaf0] p-3"><p className="text-xs font-bold uppercase tracking-[0.08em] text-[#7a6031]">Community and web discussion — unverified</p><p className="mt-1 text-xs leading-5 text-[#796c50]">Public links only. No copied post text or handles; never used as availability, alert, tracking, or recommendation evidence.</p><ul className="mt-2 space-y-2">{research.data.communitySources.map(source => <li key={source.url}><span className="mr-2 inline-flex rounded-full bg-[#f2dfb9] px-2 py-0.5 text-[0.65rem] font-bold text-[#7b5b26]">Unverified discussion</span><a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-[#8b6431] underline underline-offset-4">Open {source.title}<ExternalLink className="size-3.5" /></a></li>)}</ul></div> : null}<p className="mt-4 rounded-xl bg-[#f3ead7] px-3 py-2 text-xs leading-5 text-[#6d5d37]">{research.data.limitation}</p></div> : <div className="mt-6 text-sm text-[#64766e]">No AI research has run for this query.</div>}
  </aside>;
}
