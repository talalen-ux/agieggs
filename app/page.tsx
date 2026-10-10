"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Egg, preloadEgg } from "@/components/Egg";
import { EGG_CATALOG, FAMILY_LABEL } from "@/lib/eggs";
import { useGame } from "@/components/StateProvider";
import { HATCH_HOLDINGS_USD } from "@/lib/economics";
import { HowItWorksMotion } from "@/components/HowItWorksMotion";

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

  // Scroll lock during motion playback
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
       *  HERO — clean 2-column: massive type on left, egg on right
       * =========================================================== */}
      <section
        className="pad-x max-shell pt-4 md:pt-8 pb-16"
        aria-labelledby="hero-h"
      >
        <div className="hero-frame">
          {/* Content grid: TYPE | EGG */}
          <div className="hero-grid">
            <div className="hero-left">
              <div className="eyebrow-mute mb-5">A living protocol</div>
              <h1 id="hero-h" className="display-mega">
                LIFE
                <br />
                UNFOLDS<span className="dot">.</span>
              </h1>
              <p className="hero-sub mt-6 max-w-md">
                Choose a shell. Contribute AGI. Hatch, then earn compute
                credits as your pet grows into intelligence of its own.
              </p>
              <div className="mt-10 flex items-center gap-5 flex-wrap">
                <Link href="/choose" className="btn-pill btn-pill-primary">
                  Choose your egg
                  <ArrowOut />
                </Link>
                <Link href="#how" className="btn-link">
                  How it works
                </Link>
              </div>
            </div>

            <div className="hero-right">
              <div
                className="egg-slot"
                key={current.id}
                style={{
                  opacity: transitioning ? 0 : 1,
                  transition: "opacity 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
              >
                <Egg egg={current} size={460} eager />
              </div>
            </div>
          </div>

          {/* Footer rail: name tag · controls · scroll · watermark */}
          <div className="hero-foot">
            <div className="foot-name">
              <div className="eyebrow-mute">Featured</div>
              <div className="text-[18px] font-semibold tracking-tight mt-1">
                {current.name}
                <span className="text-ink-mute font-normal ml-2 text-[14px]">
                  · {FAMILY_LABEL[current.family]}
                </span>
              </div>
            </div>

            <div className="foot-controls">
              <button
                type="button"
                aria-label="Previous egg"
                onClick={() => go(-1)}
                disabled={transitioning}
                className="round-btn"
              >
                <ArrowLeftIcon />
              </button>
              <span className="mono text-[11px] text-ink-mute w-14 text-center">
                {String(idx + 1).padStart(2, "0")}
                <span className="opacity-50">
                  {" "}/ {String(viewerList.length).padStart(2, "0")}
                </span>
              </span>
              <button
                type="button"
                aria-label="Next egg"
                onClick={() => go(1)}
                disabled={transitioning}
                className="round-btn"
              >
                <ArrowRightIcon />
              </button>
            </div>

            <a href="#how" className="foot-scroll" aria-label="Scroll to how it works">
              <span>SCROLL</span>
              <svg width="10" height="14" viewBox="0 0 10 14" aria-hidden>
                <line x1="5" y1="1" x2="5" y2="11" stroke="currentColor" strokeWidth="1.2" />
                <path
                  d="M1 8 L5 12 L9 8"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>

          {/* Watermark letters — behind the frame, bottom-right, subtle */}
          <div className="hero-watermark" aria-hidden>
            AGI·PETS
          </div>
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
            Choose your egg <ArrowOut />
          </Link>
        </div>
      </section>

      {/* ===========================================================
       *  Hero styles — scoped
       * =========================================================== */}
      <style jsx>{`
        .hero-frame {
          position: relative;
          border-radius: 24px;
          border: 1px solid var(--hair);
          background: linear-gradient(180deg, #ffffff, #fafafa);
          padding: clamp(28px, 4vw, 56px);
          overflow: hidden;
          isolation: isolate;
        }

        .hero-grid {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 32px;
          align-items: center;
          min-height: clamp(420px, 54vh, 560px);
        }

        .hero-left {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding-right: 8px;
        }

        .display-mega {
          font-family: "Inter", -apple-system, system-ui, sans-serif;
          font-weight: 900;
          color: var(--ink);
          font-size: clamp(56px, 9vw, 128px);
          line-height: 0.86;
          letter-spacing: -0.055em;
          text-transform: uppercase;
          margin: 0;
        }
        .display-mega .dot { color: var(--lime); }

        .hero-sub {
          font-size: 17px;
          line-height: 1.55;
          color: var(--ink-soft);
        }

        .hero-right {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .egg-slot {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          /* Soft lime halo behind the egg so it anchors the composition */
          background: radial-gradient(
            60% 60% at 50% 50%,
            rgba(205, 255, 74, 0.18),
            transparent 70%
          );
          padding: 20px;
          border-radius: 24px;
        }

        /* Footer rail inside the frame */
        .hero-foot {
          position: relative;
          z-index: 2;
          margin-top: clamp(24px, 3vw, 40px);
          padding-top: 20px;
          border-top: 1px solid var(--hair);
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 16px;
        }
        .foot-name { justify-self: start; }
        .foot-controls {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          justify-self: center;
        }
        .foot-scroll {
          justify-self: end;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: "SF Mono", ui-monospace, monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          color: var(--ink-mute);
          text-transform: uppercase;
        }
        .foot-scroll:hover { color: var(--ink); }

        /* Round prev/next */
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

        /* Watermark — subtle brand burn in the empty top-right corner,
         * clear of the egg, the CTA and the footer controls */
        .hero-watermark {
          position: absolute;
          right: clamp(20px, 3vw, 44px);
          top: clamp(16px, 2.4vw, 32px);
          z-index: 0;
          font-family: "Inter", sans-serif;
          font-weight: 800;
          font-size: clamp(40px, 5vw, 72px);
          letter-spacing: 0.02em;
          line-height: 0.9;
          color: transparent;
          -webkit-text-stroke: 1px rgba(10, 10, 10, 0.06);
          pointer-events: none;
          user-select: none;
        }

        /* ===========================================================
         *  Mobile — stack type above egg, tighten paddings
         * =========================================================== */
        @media (max-width: 820px) {
          .hero-frame {
            padding: 24px 20px;
            border-radius: 20px;
          }
          .hero-grid {
            grid-template-columns: 1fr;
            gap: 24px;
            min-height: unset;
            text-align: left;
          }
          .display-mega {
            font-size: clamp(48px, 15vw, 80px);
          }
          .hero-right { order: 2; }
          .hero-left { order: 1; }
          .egg-slot { padding: 12px; }
          .hero-foot {
            grid-template-columns: 1fr;
            text-align: left;
            gap: 12px;
          }
          .foot-name,
          .foot-controls,
          .foot-scroll { justify-self: start; }
          .foot-scroll { display: none; }
          .hero-watermark { display: none; }
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

function ArrowOut() {
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
