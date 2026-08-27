import React from "react";
import netflixIcon from "simple-icons/icons/netflix.svg";

type ProviderMark = { name: string; accent: string; icon?: string; monogram?: string };
const providers: ProviderMark[] = [
  { name: "Netflix", accent: "#e50914", icon: netflixIcon }, { name: "Prime Video", accent: "#00a8e1", monogram: "p" },
  { name: "YouTube", accent: "#ff0000", monogram: "▶" }, { name: "Hulu", accent: "#1ce783", monogram: "H" },
  { name: "Disney+", accent: "#113ccf", monogram: "D" }, { name: "JioHotstar", accent: "#1b63d9", monogram: "J" },
  { name: "Crunchyroll", accent: "#f47521", monogram: "C" }, { name: "Apple TV+", accent: "#202020", monogram: "a" },
  { name: "Max", accent: "#002be7", monogram: "M" }, { name: "MUBI", accent: "#1d1d1b", monogram: "M" },
  { name: "SonyLIV", accent: "#3d1b89", monogram: "S" }, { name: "ZEE5", accent: "#f4bf2a", monogram: "Z" },
];

function ProviderMarkItem({ provider, duplicate = false }: { provider: ProviderMark; duplicate?: boolean }) {
  return <li aria-hidden={duplicate || undefined} className="flex shrink-0 items-center gap-2 rounded-full border border-[#ded6c4] bg-[#fffdf8] px-3 py-2 shadow-[0_2px_8px_rgba(43,66,53,.04)]"><span className="grid size-5 place-items-center rounded-full text-[0.65rem] font-extrabold text-white" style={{ background: provider.accent }}>{provider.icon ? <img src={provider.icon} alt="" className="size-3.5 brightness-0 invert" /> : provider.monogram}</span><span className="text-xs font-bold tracking-[-0.01em] text-[#405e51]">{provider.name}</span></li>;
}

/** Provider marks communicate platforms Streamwise can compare; they are not current-offer claims or endorsements. */
export default function ProviderRibbon() {
  return <section className="mt-5 overflow-hidden rounded-2xl border border-[#ddd4c2] bg-[#f9f5ea] py-3" aria-label="Major streaming platforms"><div className="px-4 pb-2 sm:px-5"><p className="mono text-[0.61rem] font-medium uppercase tracking-[0.14em] text-[#6b7c72]">Explore across major services</p></div><div className="provider-ribbon-viewport"><ul className="provider-ribbon-track" aria-label="Streaming provider marks">{providers.map(provider => <ProviderMarkItem key={provider.name} provider={provider} />)}{providers.map(provider => <ProviderMarkItem key={`${provider.name}-duplicate`} provider={provider} duplicate />)}</ul></div><p className="px-4 pt-2 text-[0.67rem] text-[#708078] sm:px-5">Provider marks indicate services Streamwise can compare when supported in your country. They do not show current availability.</p></section>;
}
