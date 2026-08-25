import { useEffect } from "react";

declare global { interface Window { adsbygoogle?: unknown[] } }

const client = import.meta.env.VITE_ADSENSE_CLIENT_ID?.trim();
const slot = import.meta.env.VITE_ADSENSE_DISCOVERY_SLOT_ID?.trim();

export default function SponsoredPlacement({ className = "" }: { className?: string }) {
  useEffect(() => { if (client && slot) { try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { /* provider script may defer; do not interrupt content */ } } }, []);
  if (!client || !slot) return null;
  return <aside aria-label="Sponsored placement" className={`rounded-2xl border border-[#d7d1c1] bg-[#faf8f1] p-4 ${className}`}><div className="flex items-center justify-between gap-3"><p className="mono text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#756747]">Sponsored</p><p className="text-[0.68rem] text-[#7d877e]">Does not affect results</p></div><ins className="adsbygoogle mt-3 block min-h-20" style={{ display: "block" }} data-ad-client={client} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" /></aside>;
}
