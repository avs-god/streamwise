import { Download } from "lucide-react";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export default function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const installedNow = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(installedNow);
    const onPrompt = (event: Event) => { event.preventDefault(); setDeferredPrompt(event as InstallPromptEvent); };
    const onInstalled = () => { setInstalled(true); setDeferredPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt); window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  if (installed || !deferredPrompt) return null;
  return <button type="button" onClick={async () => { await deferredPrompt.prompt(); const choice = await deferredPrompt.userChoice; if (choice.outcome === "accepted") setInstalled(true); setDeferredPrompt(null); }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#b9d2bf] bg-[#eef6ee] px-4 py-3 text-sm font-semibold text-[#285540] transition hover:bg-[#e2efe1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Download className="size-4" />Install Streamwise</button>;
}
