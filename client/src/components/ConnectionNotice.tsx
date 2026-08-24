import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, DatabaseZap, ShieldCheck } from "lucide-react";

export function ConnectionNotice({ configured }: { configured: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${configured ? "border-[#a9cabb] bg-[#e8f2eb]" : "border-[#decfa9] bg-[#fbf3dd]"}`} role="status">
      <div className="flex gap-3">
        {configured ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#23704f]" /> : <DatabaseZap className="mt-0.5 size-5 shrink-0 text-[#956818]" />}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-[#204638]">{configured ? "Live legal availability is connected" : "Live catalog connection is not yet configured"}</p><Badge variant="outline" className="border-current bg-transparent text-[0.62rem] font-medium">TMDb / JustWatch</Badge></div>
          <p className="mt-1 text-sm leading-5 text-[#536a60]">{configured ? "Searches are checked against the selected country when you open a title. Every result shows the retrieval time; availability and price can still change." : "Streamwise will not invent title results or provider offers. Your wallet, watchlist, privacy controls, and decision logic are ready; a server-side catalog token activates live discovery."}</p>
        </div>
      </div>
    </div>
  );
}

export function PrivacyNote() {
  return <div className="flex gap-2 rounded-xl bg-[#eff0e9] px-3 py-2.5 text-xs leading-5 text-[#526860]"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#2c6951]" /><span><strong className="text-[#315a4a]">Private by design.</strong> Recommendations use only titles you save, the viewing intent you choose, availability snapshots, entered plan cost/cycle, and renewal timing. Streamwise does not inspect bank activity, transactions, viewing histories, or credit data.</span></div>;
}
