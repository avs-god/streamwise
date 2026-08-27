import { Bot } from "lucide-react";
import { Link } from "wouter";

export default function AssistantLauncher() {
  return <Link href="/assistant" aria-label="Open your Streamwise assistant" className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#1e4a3a] px-4 py-3 text-sm font-semibold text-[#fbf8ee] shadow-[0_12px_28px_rgba(18,59,46,.28)] transition-transform duration-150 hover:bg-[#153a2d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6c17c] focus-visible:ring-offset-2 active:scale-[.97] [bottom:max(1rem,env(safe-area-inset-bottom))] sm:right-6"><Bot className="size-4" /><span>Assistant</span></Link>;
}
