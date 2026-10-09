"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PUBLIC_PATHS = new Set(["/"]);
const APP_PATHS = ["/choose", "/eggs", "/evolve", "/brain", "/chat", "/arena"];

const APP_LINKS = [
  { href: "/choose", label: "Discover" },
  { href: "/eggs", label: "Chamber" },
  { href: "/evolve", label: "Evolution" },
  { href: "/brain", label: "Intelligence" },
  { href: "/chat", label: "Chat" },
  { href: "/arena", label: "Arena" },
];

export function Nav() {
  const pathname = usePathname() || "/";
  const inApp = APP_PATHS.some((p) => pathname.startsWith(p));
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Primary header — approximately 72px desktop / 64px mobile */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur">
        <div className="pad-x max-shell flex items-center justify-between h-16 md:h-[72px]">
          <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="AGI.Pets home">
            <Logo />
            <span className="font-semibold tracking-tight text-[17px]">AGI.Pets</span>
          </Link>

          {/* Desktop public nav */}
          <nav className="hidden md:flex items-center gap-10">
            <Link
              href="/choose"
              className={`nav-link ${pathname === "/choose" ? "active" : ""}`}
            >
              Discover
            </Link>
            <Link
              href="/#how"
              className="nav-link"
            >
              How it works
            </Link>
          </nav>

          <div className="hidden md:block">
            <Link
              href={inApp ? "/choose" : "/choose"}
              className="btn btn-primary"
            >
              {inApp ? "Discover" : "Open app"}
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden p-2 -mr-2"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
              {open ? (
                <path
                  d="M4 4 L18 18 M18 4 L4 18"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              ) : (
                <>
                  <line x1="3" y1="7" x2="19" y2="7" stroke="currentColor" strokeWidth="1.6" />
                  <line x1="3" y1="15" x2="19" y2="15" stroke="currentColor" strokeWidth="1.6" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile sheet */}
        {open && (
          <div className="md:hidden rule-b">
            <nav className="pad-x py-6 flex flex-col gap-4 text-[18px]">
              <Link href="/choose" onClick={() => setOpen(false)} className="nav-link">
                Discover
              </Link>
              <Link href="/#how" onClick={() => setOpen(false)} className="nav-link">
                How it works
              </Link>
              <Link
                href="/choose"
                onClick={() => setOpen(false)}
                className="btn btn-primary w-full mt-2"
              >
                Open app
              </Link>
            </nav>
          </div>
        )}

        {/* Fine seam under the header — the shell signature */}
        <div className="h-px bg-hair" />
      </header>

      {/* App-mode sub-navigation — only on the connected pages */}
      {inApp && <AppSubNav pathname={pathname} />}
    </>
  );
}

function AppSubNav({ pathname }: { pathname: string }) {
  return (
    <div className="rule-b bg-surface-soft/60">
      <nav className="pad-x max-shell flex gap-6 overflow-x-auto py-3">
        {APP_LINKS.map((l) => {
          const active = pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`subnav-link ${active ? "active" : ""}`}
            >
              <span className="mark" />
              {l.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function Logo() {
  return (
    <svg width="22" height="28" viewBox="0 0 22 28" fill="none" aria-hidden>
      <path
        d="M11 1C5.5 1 1.5 9 1.5 16c0 5.8 4.3 11 9.5 11s9.5-5.2 9.5-11C20.5 9 16.5 1 11 1Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <line x1="11" y1="3" x2="11" y2="25" stroke="#CDFF4A" strokeWidth="1.4" />
    </svg>
  );
}

// re-exported so other code can get the public path list if needed
export { PUBLIC_PATHS };
