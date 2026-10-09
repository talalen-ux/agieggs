"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGame } from "./StateProvider";
import { fmtUsd } from "@/lib/format";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/eggs", label: "Egg Chamber" },
  { href: "/choose", label: "Choose Egg" },
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
    <header className="sticky top-0 z-30 bg-canvas/85 backdrop-blur-md border-b border-hair">
      <div className="container-pad max-w-[1400px] mx-auto flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <svg width="28" height="36" viewBox="0 0 28 36" fill="none" aria-hidden>
            <path
              d="M14 2C7 2 2 12 2 21c0 7.2 5.4 13 12 13s12-5.8 12-13C26 12 21 2 14 2Z"
              stroke="#0A0A0A"
              strokeWidth="1.5"
            />
            <line
              x1="14"
              y1="4"
              x2="14"
              y2="32"
              stroke="#CDFF4A"
              strokeWidth="1.5"
            />
          </svg>
          <span className="font-semibold tracking-tightest text-[17px]">
            AGI.Pets
          </span>
        </Link>

        <nav className="hidden md:flex gap-6 overflow-x-auto">
          {LINKS.map((l) => {
            const active =
              pathname === l.href ||
              (l.href !== "/" && pathname?.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-link ${active ? "active" : ""}`}
              >
                <span className="dot" />
                <span>{l.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0 text-right">
          <div>
            <div className="font-semibold text-[15px] mono">
              {Math.floor(state?.wallet.agi ?? 0).toLocaleString()} AGI
            </div>
            <div className="eyebrow-mute">{fmtUsd(usd)} held</div>
          </div>
        </div>
      </div>

      {/* mobile nav */}
      <nav className="md:hidden container-pad max-w-[1400px] mx-auto flex gap-5 overflow-x-auto pt-0 pb-3">
        {LINKS.map((l) => {
          const active =
            pathname === l.href ||
            (l.href !== "/" && pathname?.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link whitespace-nowrap ${active ? "active" : ""}`}
            >
              <span className="dot" />
              <span>{l.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
