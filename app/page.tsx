"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Egg, preloadEgg } from "@/components/Egg";
import { EGG_CATALOG, FAMILY_LABEL } from "@/lib/eggs";
import { useGame } from "@/components/StateProvider";
import { HATCH_HOLDINGS_USD } from "@/lib/economics";
import { HowItWorksMotion } from "@/components/HowItWorksMotion";

/** Hand-curated viewer order — the premium shells lead. */
const VIEWER = [
  "cr-emerald",
  "au-fissure",
  "stn-geode",
  "cr-rhombus",
  "au-fold",
  "wd-maple",
  "cr-prism",
  "au-guilloche",
  "hex-dome",
] as const;

export default function LandingPage() {
  const { state } = useGame();
  const [motionState, setMotionState] = useState<"idle" | "playing" | "done">("idle");

  // --- Viewer state ---------------------------------------------------------
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
      }, 180);
    },
    [idx, transitioning, viewerList],
  );

  useEffect(() => {
    viewerList.slice(0, 4).forEach(preloadEgg);
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
       *  Hero — one centerpiece. Headline, egg, controls, CTA.
       * =========================================================== */}
      <section className="pad-x max-shell section-sm" aria-labelledby="hero-h">
        <div className="max-w-3xl">
          <h1 id="hero-h" className="h-hero">Life, waiting to unfold.</h1>
          <p className="body mt-5 max-w-md text-ink-soft">
            Choose an egg. Meet what comes next.
          </p>
        </div>

        {/* Egg stage */}
        <div className="relative mt-10 md:mt-16">
          <div className="relative mx-auto hero-stage">
            {/* The lime seam signature — dot · line · dot — framing the egg */}
            <span className="seam-dot top" aria-hidden />
            <span className="seam-line" aria-hidden />
            <span className="seam-dot bottom" aria-hidden />

            {/* Egg crossfade */}
            <div
              key={current.id}
              className="hero-egg-slot"
              style={{
                opacity: transitioning ? 0 : 1,
                transition: "opacity 180ms cubic-bezier(0.2, 0.8, 0.2, 1)",
              }}
            >
              <Egg egg={current} size={420} eager />
            </div>

            {/* Prev/next controls — right-side, like the reference */}
            <div className="hero-controls">
              <button
                type="button"
                aria-label="Previous egg"
                className="round-btn"
                onClick={() => go(-1)}
                disabled={transitioning}
              >
                <ArrowLeft />
              </button>
              <button
                type="button"
                aria-label="Next egg"
                className="round-btn"
                onClick={() => go(1)}
                disabled={transitioning}
              >
                <ArrowRight />
              </button>
            </div>
          </div>

          {/* Egg caption — bottom-left of the stage, like the reference */}
          <div className="mt-6 flex items-center justify-between gap-6 max-w-3xl mx-auto">
            <div aria-live="polite">
              <div className="text-[22px] font-semibold tracking-tight">
                {current.name}
              </div>
              <div className="eyebrow-mute mt-1">
                {FAMILY_LABEL[current.family]} · {current.theme}
              </div>
            </div>
            <div className="mono text-[12px] text-ink-mute">
              {String(idx + 1).padStart(2, "0")}
              <span className="opacity-50">
                {" "}/ {String(viewerList.length).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="mt-10 max-w-3xl mx-auto">
          <Link
            href="/choose"
            className="btn btn-primary btn-xl w-full justify-between"
          >
            <span>Choose your egg</span>
            <ArrowRight />
          </Link>
          <div className="mt-6 flex justify-center">
            <a href="#how" className="btn-link text-[14px]">
              How it works <span aria-hidden>↓</span>
            </a>
          </div>
        </div>
      </section>

      {/* ===========================================================
       *  Editorial — "A shell is only the start"
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
       *  Hero stage styles — kept scoped to this page
       * =========================================================== */}
      <style jsx>{`
        .hero-stage {
          position: relative;
          width: 100%;
          max-width: 460px;
          aspect-ratio: 1 / 1;
          margin: 0 auto;
        }
        .hero-egg-slot {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        /* Lime seam signature */
        .seam-line {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 1px;
          margin-left: -0.5px;
          background: #cdff4a;
          opacity: 0.9;
          z-index: 1;
        }
        .seam-dot {
          position: absolute;
          left: 50%;
          width: 8px;
          height: 8px;
          margin-left: -4px;
          border-radius: 2px;
          background: #cdff4a;
          z-index: 2;
        }
        .seam-dot.top { top: -4px; }
        .seam-dot.bottom { bottom: -4px; }

        /* Prev/next controls — right side, mid-egg */
        .hero-controls {
          position: absolute;
          right: -12px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 3;
        }
        .round-btn {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          border: 1px solid var(--hair);
          background: var(--surface);
          color: var(--ink);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 150ms, background 150ms;
        }
        .round-btn:hover:not(:disabled) {
          border-color: var(--ink);
        }
        .round-btn:focus-visible {
          outline: 2px solid var(--ink);
          outline-offset: 3px;
        }
        .round-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        @media (max-width: 640px) {
          .hero-stage { max-width: 340px; }
          .hero-controls {
            right: -4px;
            flex-direction: row;
            top: auto;
            bottom: -58px;
            transform: none;
          }
          .round-btn { width: 44px; height: 44px; }
        }
      `}</style>
    </>
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

function ArrowLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M9 2 L3 7 L9 12"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M5 2 L11 7 L5 12"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
