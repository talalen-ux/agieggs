"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Egg, preloadEgg } from "@/components/Egg";
import { EGG_CATALOG, FAMILY_LABEL } from "@/lib/eggs";
import { useGame } from "@/components/StateProvider";
import { STAGE_USD_THRESHOLD } from "@/lib/types";
import { HowItWorksMotion } from "@/components/HowItWorksMotion";

/** The egg featured in the hero. One, chosen for presence. */
const HERO = "cr-emerald";

/** The viewer's starting list. Hand-curated so the first ones feel strong. */
const DISCOVERY_ORDER = [
  "cr-emerald",
  "au-fissure",
  "stn-geode",
  "cr-petal",
  "au-fold",
  "wd-maple",
  "cr-prism",
  "au-guilloche",
  "hex-dome",
  "cr-onyx",
  "au-craquelure",
  "ind-orb",
] as const;

export default function LandingPage() {
  const { state } = useGame();
  const [motionState, setMotionState] = useState<"idle" | "playing" | "done">("idle");

  // Scroll-lock during motion playback. The motion fires when the stage is
  // mostly visible (threshold 0.6 in the component), then we pin the page
  // with the iOS-safe fixed-body pattern and release on "done". A safety
  // timer guarantees the lock cannot outlive the motion's end state.
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

    // Safety: never pin for longer than 9s (motion lands at ~7.6s)
    const safety = window.setTimeout(restore, 9000);

    return () => {
      window.clearTimeout(safety);
      restore();
    };
  }, [motionState]);
  const remaining = state
    ? Math.max(0, state.supply.petCap - state.supply.petsMinted)
    : null;

  // --- Viewer (section 2) ---------------------------------------------------
  const viewerList = useMemo(
    () => DISCOVERY_ORDER.map((id) => EGG_CATALOG.find((e) => e.id === id)!),
    [],
  );
  const [idx, setIdx] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (transitioning) return;
      // preload the next egg's sheet before swapping
      const next = (idx + dir + viewerList.length) % viewerList.length;
      preloadEgg(viewerList[next]);
      setTransitioning(true);
      setTimeout(() => {
        setIdx(next);
        setTransitioning(false);
      }, 200);
    },
    [idx, transitioning, viewerList],
  );

  // Preload the viewer's first few sheets after initial paint
  useEffect(() => {
    viewerList.slice(0, 4).forEach(preloadEgg);
  }, [viewerList]);

  // Keyboard navigation on the viewer
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [go]);

  const current = viewerList[idx];
  const prev = viewerList[(idx - 1 + viewerList.length) % viewerList.length];
  const next = viewerList[(idx + 1) % viewerList.length];

  return (
    <>
      {/* ======================================================
       *  Section 1 — Focused introduction
       * ====================================================== */}
      <section className="pad-x max-shell section">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-16 items-center">
          <div className="enter">
            <h1 className="h-hero max-w-xl">A new form of life.</h1>
            <p className="body mt-6 max-w-md">
              Choose an egg. Hold AGI within its band. Collect fragments
              until one is ready to hatch.
            </p>
            <div className="mt-10 flex items-center gap-6">
              <Link href="/choose" className="btn btn-primary btn-xl">
                Choose your egg
                <Arrow />
              </Link>
              <Link href="#how" className="btn-link">
                How it works
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center">
            {/* Egg scales down on narrow screens via a wrapping scale transform;
             * the box's intrinsic size is still 420px so layout stays stable. */}
            <div className="hero-egg">
              <Egg egg={HERO} size={420} drift eager />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
       *  Section 2 — Curated egg discovery
       * ====================================================== */}
      <section
        className="pad-x max-shell section"
        aria-labelledby="discovery-heading"
      >
        <div className="flex items-end justify-between gap-6 mb-16">
          <div>
            <h2 id="discovery-heading" className="h-section max-w-md">
              Forty-eight shells. One of them is yours.
            </h2>
          </div>
          <Link href="/choose" className="btn-link hidden sm:inline-flex">
            View all eggs
          </Link>
        </div>

        <div className="relative grid lg:grid-cols-[1fr_minmax(0,420px)_1fr] items-center gap-6">
          {/* previous peek — hidden on narrow screens */}
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous egg"
            className="hidden lg:flex opacity-30 hover:opacity-70 transition-opacity justify-end"
            disabled={transitioning}
          >
            <Egg egg={prev} size={180} />
          </button>

          {/* center viewer */}
          <div className="flex flex-col items-center text-center">
            <div className="viewer-frame relative">
              <div
                key={current.id}
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  opacity: transitioning ? 0 : 1,
                  transition: "opacity 200ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
              >
                <Egg egg={current} size={320} className="viewer-egg" />
              </div>
            </div>
            <div className="mt-10" aria-live="polite">
              <div className="eyebrow-mute">
                {FAMILY_LABEL[current.family]} · {current.theme}
              </div>
              <div className="h-sub mt-3">{current.name}</div>
              <p className="body-mute mt-3 max-w-sm mx-auto min-h-[48px]">
                {current.description}
              </p>
            </div>
          </div>

          {/* next peek */}
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next egg"
            className="hidden lg:flex opacity-30 hover:opacity-70 transition-opacity"
            disabled={transitioning}
          >
            <Egg egg={next} size={180} />
          </button>
        </div>

        {/* viewer controls — position indicator + buttons */}
        <div className="mt-12 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => go(-1)}
            className="btn"
            aria-label="Previous"
            disabled={transitioning}
          >
            <ArrowLeft />
          </button>
          <span className="mono text-ink-mute text-[13px]">
            {String(idx + 1).padStart(2, "0")}
            <span className="opacity-50"> / {String(viewerList.length).padStart(2, "0")}</span>
          </span>
          <button
            type="button"
            onClick={() => go(1)}
            className="btn"
            aria-label="Next"
            disabled={transitioning}
          >
            <ArrowRight />
          </button>
        </div>

        <div className="mt-10 text-center sm:hidden">
          <Link href="/choose" className="btn-link">View all eggs</Link>
        </div>
      </section>

      {/* ======================================================
       *  Section 3 — How it works (motion graphic, scroll-locked)
       *
       *  When the section enters the viewport the motion plays and the
       *  page scroll is pinned. The lock releases when the motion lands
       *  on its end frame (handled in the useEffect above).
       * ====================================================== */}
      <section
        id="how"
        className="pad-x max-shell section rule"
        aria-labelledby="how-heading"
      >
        <h2 id="how-heading" className="h-section mb-10 max-w-lg">
          How it works
        </h2>
        <HowItWorksMotion onStateChange={setMotionState} />
      </section>

      {/* ======================================================
       *  Section 4 — Essential facts
       * ====================================================== */}
      <section className="pad-x max-shell section-sm">
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-10">
          <Fact k="Supply" v="100,000,000" sub="AGI, fixed" />
          <Fact k="Pets, ever" v="5,000" sub="hard cap" />
          <Fact
            k="To accrue"
            v={`$${STAGE_USD_THRESHOLD.hatchling}`}
            sub="held, minimum"
          />
          <Fact
            k="Remaining"
            v={remaining !== null ? remaining.toLocaleString() : "—"}
            sub="unminted"
            live
          />
        </dl>
      </section>

      {/* ======================================================
       *  Section 5 — Quiet closing
       * ====================================================== */}
      <section className="pad-x max-shell section">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-10">
          <h2 className="h-section max-w-md">Pick a shell. See what answers.</h2>
          <Link href="/choose" className="btn btn-primary btn-xl">
            Choose your egg
            <Arrow />
          </Link>
        </div>
      </section>
    </>
  );
}

/* ---------- small components ------------------------------------------- */

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

function Arrow() {
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
function ArrowLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M9 2 L3 7 L9 12" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M5 2 L11 7 L5 12" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

