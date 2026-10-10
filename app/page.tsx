"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Egg, preloadEgg } from "@/components/Egg";
import { EGG_CATALOG, FAMILY_LABEL } from "@/lib/eggs";
import { useGame } from "@/components/StateProvider";
import { HATCH_HOLDINGS_USD } from "@/lib/economics";
import { HowItWorksMotion } from "@/components/HowItWorksMotion";

/** Rotating hero shells. The viewer cycles between a few premium picks. */
const VIEWER = [
  "cr-emerald",
  "au-fissure",
  "cr-rhombus",
  "au-fold",
  "stn-geode",
] as const;

export default function LandingPage() {
  const { state } = useGame();
  const [motionState, setMotionState] =
    useState<"idle" | "playing" | "done">("idle");

  // --- Viewer -------------------------------------------------------------
  const viewerList = useMemo(
    () => VIEWER.map((id) => EGG_CATALOG.find((e) => e.id === id)!),
    [],
  );
  const [idx, setIdx] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (transitioning) return;
      const next = (idx + dir + viewerList.length) % viewerList.length;
      preloadEgg(viewerList[next]);
      setTransitioning(true);
      setTimeout(() => {
        setIdx(next);
        setTransitioning(false);
      }, 220);
    },
    [idx, transitioning, viewerList],
  );

  useEffect(() => {
    viewerList.slice(0, 3).forEach(preloadEgg);
  }, [viewerList]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [go]);

  const current = viewerList[idx];

  // --- Scroll lock during motion playback ---------------------------------
  useEffect(() => {
    if (motionState !== "playing") return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    const block = (e: TouchEvent) => e.preventDefault();
    window.addEventListener("touchmove", block, { passive: false });

    const restore = () => {
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
      window.removeEventListener("touchmove", block);
    };
    const safety = window.setTimeout(restore, 9000);
    return () => {
      window.clearTimeout(safety);
      restore();
    };
  }, [motionState]);

  const remaining = state
    ? Math.max(0, state.supply.petCap - state.supply.petsMinted)
    : null;

  return (
    <>
      {/* ===========================================================
       *  HERO — cinematic frame, massive stacked type, right-side egg
       * =========================================================== */}
      <section
        className="pad-x max-shell pt-6 pb-16"
        aria-labelledby="hero-h"
      >
        <div className="hero-frame">
          {/* Left vertical icon rail */}
          <nav className="hero-rail" aria-label="Jump to">
            <RailLink href="/choose" label="Discover">
              <IconEgg />
            </RailLink>
            <RailLink href="/chat" label="Chat">
              <IconChat />
            </RailLink>
            <RailLink href="/arena" label="Arena">
              <IconArena />
            </RailLink>
            <RailLink href="/brain" label="Intelligence">
              <IconBrain />
            </RailLink>
            <RailLink href="#how" label="How it works" scroll>
              <IconHow />
            </RailLink>
          </nav>

          {/* Background egg — behind the type, large */}
          <div className="hero-visual" aria-hidden>
            <div
              key={current.id}
              style={{
                opacity: transitioning ? 0 : 1,
                transition: "opacity 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
              }}
            >
              <Egg egg={current} size={620} eager />
            </div>
          </div>

          {/* Foreground copy */}
          <div className="hero-copy">
            <div className="eyebrow-mute mb-6">A living protocol</div>
            <h1 id="hero-h" className="display-mega">
              LIFE
              <br />
              <span className="line-two">UNFOLDS<span className="dot">.</span></span>
            </h1>
            <p className="body hero-sub mt-6 max-w-md">
              Choose a shell. Contribute AGI. Hatch, then earn compute credits
              as your pet grows into intelligence of its own.
            </p>
            <div className="mt-10 flex items-center gap-5 flex-wrap">
              <Link href="/choose" className="btn-pill btn-pill-primary">
                Choose your egg
                <ArrowRight />
              </Link>
              <Link href="#how" className="btn-link">
                How it works
              </Link>
            </div>
          </div>

          {/* Rotating control + name tag */}
          <div className="hero-tag">
            <div className="flex items-end justify-between gap-6">
              <div>
                <div className="eyebrow-mute">Featured</div>
                <div className="text-[20px] font-semibold tracking-tight mt-1">
                  {current.name}
                </div>
                <div className="eyebrow-mute mt-1">
                  {FAMILY_LABEL[current.family]} · {current.theme}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Previous"
                  onClick={() => go(-1)}
                  disabled={transitioning}
                  className="round-btn"
                >
                  <ArrowLeftIcon />
                </button>
                <span className="mono text-[11px] text-ink-mute">
                  {String(idx + 1).padStart(2, "0")}
                  <span className="opacity-50">
                    {" "}/ {String(viewerList.length).padStart(2, "0")}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label="Next"
                  onClick={() => go(1)}
                  disabled={transitioning}
                  className="round-btn"
                >
                  <ArrowRightIcon />
                </button>
              </div>
            </div>
          </div>

          {/* Watermark letters, bottom-right */}
          <div className="hero-watermark" aria-hidden>
            AGI·PETS
          </div>

          {/* Scroll cue */}
          <a href="#how" className="hero-scroll" aria-label="Scroll to how it works">
            <span className="mono text-[10px] tracking-widest">SCROLL</span>
            <svg width="12" height="18" viewBox="0 0 12 18" aria-hidden>
              <line
                x1="6"
                y1="2"
                x2="6"
                y2="14"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path
                d="M2 10 L6 14 L10 10"
                stroke="currentColor"
                strokeWidth="1.2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </section>

      {/* ===========================================================
       *  Editorial — a shell is only the start
       * =========================================================== */}
      <section className="pad-x max-shell section rule">
        <div className="eyebrow-mute mb-6">The beginning</div>
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-12 items-start">
          <h2 className="h-section max-w-2xl">A shell is only the start.</h2>
          <p className="body text-ink-soft max-w-md">
            Hold AGI, hatch your egg, and earn compute credits as your pet
            grows. The shell you pick decides who wakes up — the credits you
            earn decide what they get to do.
          </p>
        </div>
      </section>

      {/* ===========================================================
       *  How it works — scroll-locked motion graphic
       * =========================================================== */}
      <section
        id="how"
        className="pad-x max-shell section rule"
        aria-labelledby="how-h"
      >
        <h2 id="how-h" className="h-section mb-10 max-w-lg">How it works</h2>
        <HowItWorksMotion onStateChange={setMotionState} />
      </section>

      {/* ===========================================================
       *  Facts
       * =========================================================== */}
      <section className="pad-x max-shell section-sm">
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-10">
          <Fact k="Supply" v="100,000,000" sub="AGI, fixed" />
          <Fact k="Pets, ever" v="5,000" sub="hard cap" />
          <Fact k="To hatch" v={`$${HATCH_HOLDINGS_USD}`} sub="held, minimum" />
          <Fact
            k="Remaining"
            v={remaining !== null ? remaining.toLocaleString() : "—"}
            sub="unminted"
            live
          />
        </dl>
      </section>

      {/* ===========================================================
       *  Closer
       * =========================================================== */}
      <section className="pad-x max-shell section">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-10">
          <h2 className="h-section max-w-md">Pick a shell. See what answers.</h2>
          <Link href="/choose" className="btn btn-primary btn-xl">
            Choose your egg <ArrowRight />
          </Link>
        </div>
      </section>

      {/* ===========================================================
       *  Hero styles (scoped)
       * =========================================================== */}
      <style jsx>{`
        .hero-frame {
          position: relative;
          border-radius: 28px;
          border: 1px solid var(--hair);
          background:
            radial-gradient(1200px 500px at 65% 40%, rgba(205, 255, 74, 0.08), transparent 60%),
            linear-gradient(180deg, #ffffff, #fafafa);
          padding: clamp(28px, 4vw, 56px) clamp(24px, 4vw, 64px);
          min-height: clamp(560px, 78vh, 820px);
          overflow: hidden;
          isolation: isolate;
        }

        /* --- icon rail ------------------------------------------------ */
        .hero-rail {
          position: absolute;
          left: clamp(16px, 2vw, 28px);
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 3;
        }

        /* --- massive stacked type ------------------------------------- */
        .display-mega {
          font-family: "Inter", -apple-system, system-ui, sans-serif;
          font-weight: 900;
          color: var(--ink);
          font-size: clamp(80px, 14vw, 200px);
          line-height: 0.86;
          letter-spacing: -0.055em;
          text-transform: uppercase;
        }
        .display-mega .line-two { display: inline-flex; align-items: baseline; }
        .display-mega .dot {
          color: var(--lime);
          display: inline-block;
          margin-left: -0.05em;
        }

        .hero-copy {
          position: relative;
          z-index: 2;
          max-width: 760px;
          padding-left: clamp(44px, 6vw, 76px);
        }
        .hero-sub { color: var(--ink-soft); }

        /* --- hero egg --------------------------------------------------- */
        .hero-visual {
          position: absolute;
          top: 50%;
          right: -2%;
          transform: translateY(-50%);
          z-index: 1;
          pointer-events: none;
          opacity: 0.95;
          filter: drop-shadow(0 30px 40px rgba(0, 0, 0, 0.08));
        }
        .hero-visual :global(img) {
          max-width: 60vw;
          height: auto;
        }

        /* --- bottom-right tag ----------------------------------------- */
        .hero-tag {
          position: absolute;
          left: clamp(60px, 7vw, 100px);
          right: clamp(24px, 4vw, 64px);
          bottom: clamp(24px, 3vw, 40px);
          z-index: 2;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
        }

        /* --- watermark letters --------------------------------------- */
        .hero-watermark {
          position: absolute;
          right: clamp(-18px, -1vw, -8px);
          bottom: clamp(-12px, -0.5vw, -4px);
          font-family: "Inter", sans-serif;
          font-weight: 800;
          font-size: clamp(80px, 14vw, 180px);
          letter-spacing: 0.02em;
          color: transparent;
          -webkit-text-stroke: 1px rgba(10, 10, 10, 0.08);
          pointer-events: none;
          user-select: none;
          z-index: 0;
          line-height: 0.9;
        }

        /* --- scroll cue ---------------------------------------------- */
        .hero-scroll {
          position: absolute;
          left: 50%;
          bottom: 20px;
          transform: translateX(-50%);
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          color: var(--ink-mute);
          z-index: 3;
        }

        /* --- pill button --------------------------------------------- */
        .btn-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 28px;
          border-radius: 999px;
          border: 1px solid var(--ink);
          background: transparent;
          color: var(--ink);
          font-weight: 600;
          font-size: 15px;
          transition:
            background 150ms,
            color 150ms,
            transform 150ms;
          cursor: pointer;
        }
        .btn-pill:hover { background: var(--ink); color: #fff; }
        .btn-pill-primary {
          background: var(--ink);
          color: #fff;
          padding: 18px 32px;
        }
        .btn-pill-primary:hover {
          background: #000;
          transform: translateY(-1px);
        }

        /* --- rail link ---------------------------------------------- */
        .rail-link {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          color: var(--ink-mute);
          transition: background 150ms, color 150ms;
          position: relative;
        }
        .rail-link:hover { color: var(--ink); background: var(--hair-soft); }
        .rail-link .lbl {
          position: absolute;
          left: 48px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 11px;
          color: var(--ink);
          background: var(--ink);
          color: #fff;
          padding: 4px 8px;
          border-radius: 6px;
          opacity: 0;
          pointer-events: none;
          white-space: nowrap;
          transition: opacity 150ms;
        }
        .rail-link:hover .lbl { opacity: 1; }

        /* --- round controls ------------------------------------------ */
        .round-btn {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          border: 1px solid var(--hair);
          background: var(--surface);
          color: var(--ink);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 150ms;
        }
        .round-btn:hover:not(:disabled) { border-color: var(--ink); }
        .round-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ===========================================================
         *  Mobile — stacked, egg behind type, shorter frame
         * =========================================================== */
        @media (max-width: 820px) {
          .hero-frame {
            padding: 24px 20px 32px;
            min-height: unset;
            border-radius: 20px;
          }
          .hero-rail {
            position: static;
            transform: none;
            flex-direction: row;
            gap: 6px;
            margin-bottom: 12px;
            overflow-x: auto;
          }
          .hero-copy { padding-left: 0; padding-top: 8px; }
          .display-mega {
            font-size: clamp(56px, 16vw, 96px);
            line-height: 0.9;
          }
          .hero-visual {
            position: static;
            transform: none;
            display: flex;
            justify-content: center;
            margin-top: 24px;
            opacity: 1;
          }
          .hero-visual :global(img) {
            max-width: 300px;
            width: 100%;
          }
          .hero-tag {
            position: static;
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid var(--hair);
          }
          .hero-watermark {
            font-size: 70px;
            right: 10px;
            bottom: -4px;
          }
          .hero-scroll { display: none; }
          .rail-link .lbl { display: none; }
        }
      `}</style>
    </>
  );
}

/* ---------- small components -------------------------------------------- */

function RailLink({
  href,
  label,
  children,
  scroll,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const el = (
    <>
      <span className="rail-link-inner">{children}</span>
      <span className="lbl">{label}</span>
      <style jsx>{`
        .rail-link-inner {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
        }
      `}</style>
    </>
  );
  if (scroll) {
    return (
      <a href={href} className="rail-link" aria-label={label}>
        {el}
      </a>
    );
  }
  return (
    <Link href={href} className="rail-link" aria-label={label}>
      {el}
    </Link>
  );
}

function Fact({
  k,
  v,
  sub,
  live,
}: {
  k: string;
  v: string;
  sub?: string;
  live?: boolean;
}) {
  return (
    <div>
      <dt className="eyebrow-mute">{k}</dt>
      <dd className="mt-3">
        <span className="text-[clamp(28px,3vw,36px)] font-semibold tracking-tight">
          {v}
        </span>
        {sub && (
          <span className="block mt-1 eyebrow-mute">
            {live && (
              <span
                className="inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle"
                style={{ background: "#CDFF4A" }}
                aria-label="live"
              />
            )}
            {sub}
          </span>
        )}
      </dd>
    </div>
  );
}

/* ---------- icons ------------------------------------------------------- */

function IconEgg() {
  return (
    <svg width="18" height="22" viewBox="0 0 18 22" fill="none" aria-hidden>
      <path
        d="M9 1C4.5 1 1.5 7 1.5 12c0 5 3.5 9 7.5 9s7.5-4 7.5-9C16.5 7 13.5 1 9 1Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <line x1="9" y1="3" x2="9" y2="19" stroke="#CDFF4A" strokeWidth="1.4" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg width="20" height="18" viewBox="0 0 20 18" fill="none" aria-hidden>
      <path
        d="M2 4a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9l-4 4v-4H5a3 3 0 0 1-3-3V4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconArena() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="6" cy="10" r="3" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="14" cy="10" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 10 h2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function IconBrain() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M7 3a3 3 0 0 0-3 3v1a3 3 0 0 0-1 2v2a3 3 0 0 0 1 2v1a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-1a3 3 0 0 0 1-2v-2a3 3 0 0 0-1-2V6a3 3 0 0 0-3-3H7Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="M10 3v14" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
function IconHow() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <line x1="4" y1="6" x2="16" y2="6" stroke="currentColor" strokeWidth="1.4" />
      <line x1="4" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="1.4" />
      <line x1="4" y1="14" x2="12" y2="14" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function ArrowLeftIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M9 2 L3 7 L9 12" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M5 2 L11 7 L5 12" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2 11 L11 2 M5 2 H11 V8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
