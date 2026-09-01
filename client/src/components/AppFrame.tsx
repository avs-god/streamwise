import { useAuth } from "@/_core/hooks/useAuth";
import AssistantLauncher from "@/components/AssistantLauncher";
import PwaInstallButton from "@/components/PwaInstallButton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, BellRing, Bookmark, Bot, Compass, LayoutList, LogOut, Menu, MessagesSquare, Settings2, ShieldCheck, Star, TimerReset, WalletCards } from "lucide-react";
import { Link, useLocation } from "wouter";
import StreamwiseLogo from "./StreamwiseLogo";
import { useEffect, useState } from "react";

const nav = [
  { href: "/", label: "Discover", icon: Compass },
  { href: "/recommendations", label: "Recommendations", icon: Star },
  { href: "/watchlist", label: "Watchlist", icon: Bookmark },
  { href: "/wallet", label: "Wallet", icon: WalletCards },
  { href: "/decisions", label: "Decisions", icon: LayoutList },
  { href: "/updates", label: "Updates", icon: BellRing },
  { href: "/leaving-soon", label: "Leaving soon", icon: TimerReset },
  { href: "/assistant", label: "Assistant", icon: Bot },
  { href: "/community", label: "Community", icon: MessagesSquare },
];
const mobileExploreNav = nav.filter(item => ["/", "/recommendations", "/community", "/assistant"].includes(item.href));
const mobilePlanningNav = nav.filter(item => !["/", "/recommendations", "/community", "/assistant"].includes(item.href));

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, signIn } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profile = trpc.tasteProfile.get.useQuery(undefined, { enabled: Boolean(user), retry: false });

  useEffect(() => {
    document.documentElement.classList.toggle("streamwise-user-reduced-motion", Boolean(profile.data?.reducedMotion));
    return () => document.documentElement.classList.remove("streamwise-user-reduced-motion");
  }, [profile.data?.reducedMotion]);

  return (
    <div className={cn("page-shell paper-grain", profile.data?.interfaceDensity === "compact" && "streamwise-compact-density")}>
      <header className="sticky top-0 z-30 border-b border-[#d9d3c4]/80 bg-[#faf8f1]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <StreamwiseLogo size={34} aria-hidden="true" className="shrink-0 drop-shadow-[0_5px_12px_rgba(18,59,46,.18)]" />
            <span className="serif text-[1.4rem] font-semibold tracking-[-0.04em] text-[#193d31]">Streamwise</span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {nav.map(item => {
              const active = location === item.href;
              return <Link key={item.href} href={item.href} className={cn("rounded-full px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active ? "bg-[#e7dfc8] text-[#173d30]" : "text-[#557066] hover:bg-[#eee9dc]")}>{item.label}</Link>;
            })}
            {user?.role === "admin" ? <Link href="/moderation" className={cn("rounded-full px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", location === "/moderation" ? "bg-[#e7dfc8] text-[#173d30]" : "text-[#557066] hover:bg-[#eee9dc]")}>Moderation</Link> : null}
          </nav>

          <div className="flex items-center gap-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild><Button type="button" variant="outline" size="icon" aria-label="Open menu" className="border-[#d9d3c4] bg-white/70 text-[#285041] md:hidden"><Menu className="size-5" /></Button></SheetTrigger>
              <SheetContent side="left" className="flex h-[100dvh] w-[min(22rem,88vw)] flex-col border-[#d9d3c4] bg-[#faf8f1] p-0"><SheetHeader className="shrink-0 border-b border-[#d9d3c4] px-6 pb-4 pt-5 text-left"><SheetTitle className="serif text-3xl text-[#1e4a3a]">Streamwise menu</SheetTitle><SheetDescription>Discovery, community, and your private planning tools.</SheetDescription></SheetHeader><nav aria-label="Mobile navigation" className="min-h-0 flex-1 overflow-y-auto p-4"><p className="px-2 pb-2 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#6b7f75]">Explore</p><div className="grid gap-1">{mobileExploreNav.map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className={cn("flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", location === item.href ? "bg-[#e7dfc8] text-[#1e4a3a]" : "text-[#48665a] hover:bg-[#eee9dc]")}><Icon className="size-4" />{item.label}</Link>; })}</div><p className="px-2 pb-2 pt-5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#6b7f75]">My Streamwise</p><div className="grid gap-1">{mobilePlanningNav.map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className={cn("flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", location === item.href ? "bg-[#e7dfc8] text-[#1e4a3a]" : "text-[#48665a] hover:bg-[#eee9dc]")}><Icon className="size-4" />{item.label}</Link>; })}<Link href="/settings" onClick={() => setMobileMenuOpen(false)} className={cn("flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", location === "/settings" ? "bg-[#e7dfc8] text-[#1e4a3a]" : "text-[#48665a] hover:bg-[#eee9dc]")}><Settings2 className="size-4" />Settings</Link>{user?.role === "admin" ? <Link href="/moderation" onClick={() => setMobileMenuOpen(false)} className={cn("flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", location === "/moderation" ? "bg-[#e7dfc8] text-[#1e4a3a]" : "text-[#48665a] hover:bg-[#eee9dc]")}><ShieldCheck className="size-4" />Moderation</Link> : null}</div></nav><div className="shrink-0 border-t border-[#d9d3c4] p-4"><PwaInstallButton /></div></SheetContent>
            </Sheet>
            {!loading && user ? (
              <div className="flex items-center gap-1.5 rounded-full border border-[#d9d3c4] bg-white/70 py-1 pl-1 pr-2">
                <span className="grid size-7 place-items-center rounded-full bg-[#e8dfc3] text-xs font-bold text-[#194133]">{user.name?.slice(0, 1).toUpperCase() ?? "U"}</span>
                <span className="hidden max-w-24 truncate text-sm font-medium text-[#285041] sm:block">{user.name ?? "Your account"}</span>
                <Link href="/settings" title="Settings" aria-label="Settings" className="rounded-full p-1.5 text-[#557066] transition-colors hover:bg-[#eee9dc] hover:text-[#234c3c]"><Settings2 className="size-4" /></Link>
                <button onClick={logout} title="Sign out" aria-label="Sign out" className="rounded-full p-1.5 text-[#557066] transition-colors hover:bg-[#eee9dc] hover:text-[#234c3c]"><LogOut className="size-4" /></button>
              </div>
            ) : (
              <Button onClick={() => void signIn()} size="sm" className="rounded-full bg-[#1e4a3a] px-4 text-[#fbf8ee] hover:bg-[#153a2d]">Sign in <ArrowUpRight className="size-3.5" /></Button>
            )}
          </div>
        </div>
      </header>
      <div className="pb-20 sm:pb-0">{children}</div>
      <AssistantLauncher />
      <footer className="border-t border-[#d9d3c4] bg-[#f5f1e7]">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-7 text-sm text-[#5b7068] sm:px-6 md:grid-cols-[1fr_auto] md:items-end">
          <p className="max-w-2xl leading-6">Streamwise helps you organise legal viewing options and your own subscription data. Availability can change at any time; always confirm the offer and price with the provider before you watch, rent, buy, pause, or cancel.</p>
          <p className="mono text-[0.65rem] uppercase tracking-[0.12em] text-[#6c7b75]">Built for deliberate watching</p>
        </div>
      </footer>
    </div>
  );
}
