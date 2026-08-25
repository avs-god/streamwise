import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpRight, BellRing, Bookmark, Bot, Compass, LayoutList, LogOut, MessagesSquare, Star, TimerReset, WalletCards } from "lucide-react";
import { Link, useLocation } from "wouter";

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

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [location] = useLocation();

  return (
    <div className="page-shell paper-grain">
      <header className="sticky top-0 z-30 border-b border-[#d9d3c4]/80 bg-[#faf8f1]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
            <span className="grid size-8 place-items-center rounded-full bg-[#1e4a3a] text-sm font-bold text-[#fbf8ee] shadow-[0_5px_16px_rgba(18,59,46,.20)]">S</span>
            <span className="serif text-[1.4rem] font-semibold tracking-[-0.04em] text-[#193d31]">Streamwise</span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {nav.map(item => {
              const active = location === item.href;
              return <Link key={item.href} href={item.href} className={cn("rounded-full px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active ? "bg-[#e7dfc8] text-[#173d30]" : "text-[#557066] hover:bg-[#eee9dc]")}>{item.label}</Link>;
            })}
          </nav>

          <div className="flex items-center gap-2">
            {!loading && user ? (
              <div className="flex items-center gap-1.5 rounded-full border border-[#d9d3c4] bg-white/70 py-1 pl-1 pr-2">
                <span className="grid size-7 place-items-center rounded-full bg-[#e8dfc3] text-xs font-bold text-[#194133]">{user.name?.slice(0, 1).toUpperCase() ?? "U"}</span>
                <span className="hidden max-w-24 truncate text-sm font-medium text-[#285041] sm:block">{user.name ?? "Your account"}</span>
                <button onClick={logout} title="Sign out" aria-label="Sign out" className="rounded-full p-1.5 text-[#557066] transition-colors hover:bg-[#eee9dc] hover:text-[#234c3c]"><LogOut className="size-4" /></button>
              </div>
            ) : (
              <Button onClick={startLogin} size="sm" className="rounded-full bg-[#1e4a3a] px-4 text-[#fbf8ee] hover:bg-[#153a2d]">Sign in <ArrowUpRight className="size-3.5" /></Button>
            )}
          </div>
        </div>
        <nav aria-label="Mobile primary" className="flex gap-1 overflow-x-auto border-t border-[#e3ddcf] px-3 py-1.5 [scrollbar-width:none] md:hidden">
          {nav.map(item => {
            const active = location === item.href;
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} className={cn("flex min-w-[4.25rem] shrink-0 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[0.62rem] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active ? "bg-[#e7dfc8] text-[#1e4a3a]" : "text-[#72847d]")}><Icon className="size-4" />{item.label}</Link>;
          })}
        </nav>
      </header>
      {children}
      <footer className="border-t border-[#d9d3c4] bg-[#f5f1e7]">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-7 text-sm text-[#5b7068] sm:px-6 md:grid-cols-[1fr_auto] md:items-end">
          <p className="max-w-2xl leading-6">Streamwise helps you organise legal viewing options and your own subscription data. Availability can change at any time; always confirm the offer and price with the provider before you watch, rent, buy, pause, or cancel.</p>
          <p className="mono text-[0.65rem] uppercase tracking-[0.12em] text-[#6c7b75]">Built for deliberate watching</p>
        </div>
      </footer>
    </div>
  );
}
