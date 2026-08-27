import AppFrame from "@/components/AppFrame";
import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Check, Eye, Languages, LayoutPanelTop, Settings2, SlidersHorizontal, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const genreOptions = [[28, "Action"], [12, "Adventure"], [16, "Animation"], [35, "Comedy"], [80, "Crime"], [18, "Drama"], [14, "Fantasy"], [27, "Horror"], [10749, "Romance"], [878, "Science fiction"]] as const;
const languageOptions = [["en", "English"], ["hi", "Hindi"], ["ja", "Japanese"], ["ko", "Korean"], ["es", "Spanish"], ["fr", "French"]] as const;
const regionOptions = [["IN", "India"], ["US", "United States"], ["GB", "United Kingdom"], ["CA", "Canada"], ["AU", "Australia"], ["DE", "Germany"], ["FR", "France"]] as const;

function ChipToggle({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "border-[#2e654d] bg-[#dfeee2] text-[#214d3b]" : "border-[#c7d4c8] bg-white/75 text-[#587168] hover:bg-white"}`}>{active ? <Check className="mr-1 inline size-3.5" /> : null}{children}</button>;
}

export default function Settings() {
  const { user, loading } = useAuth();
  const profile = trpc.tasteProfile.get.useQuery(undefined, { enabled: Boolean(user), retry: false });
  const [genreIds, setGenreIds] = useState<number[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [runtime, setRuntime] = useState<number | null>(120);
  const [includeMovies, setIncludeMovies] = useState(true);
  const [includeSeries, setIncludeSeries] = useState(true);
  const [defaultRegion, setDefaultRegion] = useState("IN");
  const [interfaceDensity, setInterfaceDensity] = useState<"comfortable" | "compact">("comfortable");
  const [reducedMotion, setReducedMotion] = useState(false);
  const save = trpc.tasteProfile.save.useMutation({ onSuccess: () => { profile.refetch(); toast.success("Your Streamwise preferences were saved."); }, onError: error => toast.error(error.message) });

  useEffect(() => {
    const saved = profile.data;
    if (!saved) return;
    try { const parsed = JSON.parse(saved.favoriteGenresJson); setGenreIds(Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === "number") : []); } catch { setGenreIds([]); }
    try { const parsed = JSON.parse(saved.preferredLanguagesJson); setLanguages(Array.isArray(parsed) ? parsed.filter((code): code is string => typeof code === "string" && /^[a-z]{2}$/.test(code)) : []); } catch { setLanguages([]); }
    setRuntime(saved.maxRuntimeMinutes ?? null);
    setIncludeMovies(saved.includeMovies);
    setIncludeSeries(saved.includeSeries);
    setDefaultRegion(/^[A-Z]{2}$/.test(saved.defaultRegion ?? "") ? saved.defaultRegion : "IN");
    setInterfaceDensity(saved.interfaceDensity === "compact" ? "compact" : "comfortable");
    setReducedMotion(Boolean(saved.reducedMotion));
  }, [profile.data]);

  const toggleGenre = (genreId: number) => setGenreIds(current => current.includes(genreId) ? current.filter(id => id !== genreId) : [...current, genreId]);
  const toggleLanguage = (language: string) => setLanguages(current => current.includes(language) ? current.filter(code => code !== language) : [...current, language]);
  const submit = () => save.mutate({ favoriteGenreIds: genreIds, preferredLanguages: languages, maxRuntimeMinutes: runtime, includeMovies, includeSeries, defaultRegion, interfaceDensity, reducedMotion });
  const resetForm = () => { setGenreIds([]); setLanguages([]); setRuntime(null); setIncludeMovies(true); setIncludeSeries(true); setDefaultRegion("IN"); setInterfaceDensity("comfortable"); setReducedMotion(false); };

  return <AppFrame><main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-14"><section className="max-w-3xl"><p className="eyebrow">Your settings</p><h1 className="serif mt-2 text-4xl tracking-[-0.045em] text-[#214a3a] sm:text-5xl">Make Streamwise feel like yours.</h1><p className="mt-3 leading-7 text-[#63756e]">Choose what guides your recommendations, the country used for legal-offer checks, and a viewing experience that is comfortable on this device. Every setting below is an explicit choice—not an inference from browsing, community activity, or other accounts.</p></section>
    {!loading && !user ? <section className="mt-8 rounded-3xl border border-dashed border-[#c9c0ae] bg-[#faf8f1] p-8 text-center"><Settings2 className="mx-auto size-8 text-[#53776a]" /><h2 className="serif mt-3 text-2xl text-[#315343]">Sign in to manage settings.</h2><p className="mt-2 text-sm text-[#64766e]">Saved preferences belong only to your Streamwise account.</p></section> : <>{profile.isLoading ? <div className="mt-8 rounded-3xl border border-[#c7d9ca] bg-[#edf5ee] p-6 text-sm text-[#567167]">Loading your saved preferences…</div> : <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <section className="rounded-3xl border border-[#c7d9ca] bg-[#edf5ee] p-5 sm:p-6"><div className="flex items-start gap-3"><Sparkles className="mt-1 size-5 text-[#2e624b]" /><div><p className="eyebrow">Recommendation profile</p><h2 className="serif mt-1 text-3xl text-[#214a3a]">What sounds good today?</h2><p className="mt-2 text-sm leading-6 text-[#567167]">These are optional filters for recommendation chat. Individual prompts can always override them.</p></div></div>
        <fieldset className="mt-6"><legend className="text-sm font-bold text-[#315b47]">Favourite genres</legend><div className="mt-3 flex flex-wrap gap-2">{genreOptions.map(([id, label]) => <ChipToggle key={id} active={genreIds.includes(id)} onClick={() => toggleGenre(id)}>{label}</ChipToggle>)}</div></fieldset>
        <fieldset className="mt-6"><legend className="text-sm font-bold text-[#315b47]">Preferred original languages</legend><div className="mt-3 flex flex-wrap gap-2">{languageOptions.map(([code, label]) => <ChipToggle key={code} active={languages.includes(code)} onClick={() => toggleLanguage(code)}>{label}</ChipToggle>)}</div></fieldset>
        <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-[#315b47]">Maximum film runtime<select aria-label="Maximum film runtime" value={runtime ?? ""} onChange={event => setRuntime(event.target.value ? Number(event.target.value) : null)} className="mt-2 min-h-11 w-full rounded-xl border border-[#b9cfbd] bg-white px-3 text-sm font-normal text-[#294f3e]"><option value="">No limit</option><option value="90">Up to 90 minutes</option><option value="120">Up to 120 minutes</option><option value="150">Up to 150 minutes</option><option value="180">Up to 180 minutes</option></select></label><div><p className="text-sm font-bold text-[#315b47]">Include in picks</p><div className="mt-2 grid gap-2"><ChipToggle active={includeMovies} onClick={() => setIncludeMovies(value => !value)}>Films</ChipToggle><ChipToggle active={includeSeries} onClick={() => setIncludeSeries(value => !value)}>Series</ChipToggle></div>{!includeMovies && !includeSeries ? <p role="alert" className="mt-2 text-xs text-[#a04e32]">Choose films, series, or both.</p> : null}</div></div>
      </section>
      <div className="grid gap-5"><section className="rounded-3xl border border-[#cad9d6] bg-[#eef5f5] p-5"><div className="flex items-start gap-3"><Languages className="mt-1 size-5 text-[#356675]" /><div><p className="eyebrow">Discovery defaults</p><h2 className="serif mt-1 text-2xl text-[#294e58]">Start in your country.</h2><p className="mt-2 text-sm leading-6 text-[#526f77]">This country opens Discovery and recommendations with your preferred legal-offer region. You can still change it for any search.</p></div></div><label className="mt-5 block text-sm font-bold text-[#315b47]">Default country<select aria-label="Default discovery country" value={defaultRegion} onChange={event => setDefaultRegion(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-[#b8ceca] bg-white px-3 text-sm font-normal text-[#294f3e]">{regionOptions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label></section>
        <section className="rounded-3xl border border-[#ddd2ba] bg-[#fff9ec] p-5"><div className="flex items-start gap-3"><LayoutPanelTop className="mt-1 size-5 text-[#806038]" /><div><p className="eyebrow">Viewing comfort</p><h2 className="serif mt-1 text-2xl text-[#5d4828]">Tune the interface.</h2><p className="mt-2 text-sm leading-6 text-[#6d5a3b]">These preferences apply across Streamwise after saving.</p></div></div><fieldset className="mt-5"><legend className="text-sm font-bold text-[#6b5129]">Card density</legend><div className="mt-2 grid grid-cols-2 gap-2"><ChipToggle active={interfaceDensity === "comfortable"} onClick={() => setInterfaceDensity("comfortable")}>Comfortable</ChipToggle><ChipToggle active={interfaceDensity === "compact"} onClick={() => setInterfaceDensity("compact")}>Compact</ChipToggle></div></fieldset><label className="mt-4 flex min-h-11 items-center gap-3 rounded-xl border border-[#e1d2b1] bg-white/75 px-3 py-2 text-sm font-semibold text-[#6b5129]"><input type="checkbox" checked={reducedMotion} onChange={event => setReducedMotion(event.target.checked)} className="size-4 accent-[#8b6431]" />Reduce non-essential motion</label></section></div>
    </div>}
    <section className="mt-5 rounded-3xl border border-[#d9d3c4] bg-[#fbf8ef] p-5 sm:flex sm:items-center sm:justify-between sm:gap-5"><div className="flex items-start gap-3"><Eye className="mt-1 size-5 text-[#56786a]" /><div><h2 className="serif text-2xl text-[#315343]">Keep control close.</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-[#62766c]">Alert delivery stays off until you opt in under <a href="/updates" className="font-semibold text-[#2e624b] underline underline-offset-4">Updates</a>. Wallet and watchlist changes are still confirmed in their own tools.</p></div></div><div className="mt-4 flex flex-wrap gap-2 sm:mt-0"><Button variant="outline" onClick={resetForm} className="border-[#b9cbbc] text-[#315b47]">Reset choices</Button><Button onClick={submit} disabled={save.isPending || !includeMovies && !includeSeries} className="bg-[#1e4a3a] text-white hover:bg-[#153a2d]">{save.isPending ? "Saving…" : "Save preferences"}</Button></div></section></>}</main></AppFrame>;
}
