"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGame } from "./StateProvider";
import { fmtAgi, fmtUsd } from "@/lib/format";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/eggs", label: "Egg Chamber" },
  { href: "/evolve", label: "Evolution" },
  { href: "/brain", label: "Intelligence" },
  { href: "/chat", label: "Chat" },
  { href: "/arena", label: "Arena" },
];

export function Nav() {
  const pathname = usePathname();
  const { state } = useGame();
  const usd = state ? state.wallet.agi * state.supply.agiPriceUsd : 0;

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-ink-950/60 border-b border-white/5">
      <div className="container-pad max-w-6xl mx-auto flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-glow-violet via-glow-cyan to-glow-rose animate-pulse_glow" />
          <span className="font-semibold tracking-tight">AGI.Pets</span>
          <span className="kbd ml-2 hidden sm:inline">protocol</span>
        </Link>
        <nav className="flex gap-1 overflow-x-auto">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link whitespace-nowrap ${pathname === l.href ? "active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3 text-xs text-white/60">
          <div className="text-right">
            <div className="text-white">{fmtAgi(state?.wallet.agi ?? 0)}</div>
            <div className="kbd">{fmtUsd(usd)} held</div>
          </div>
        </div>
      </div>
    </header>
  );
}
