"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Egg, preloadEgg } from "./Egg";
import type { EggId } from "@/lib/eggs";

/**
 * How it works — one continuous scene in four steps.
 *
 *   1 Choose      three shells; the outer two step away, the center is marked
 *   2 Contribute  a holding meter fills to $25
 *   3 Hatch       the egg settles, light opens along its seam (the shell never
 *                 breaks) and a "?" rises out of it — the pet is coming soon
 *   4 Earn        light drifts from the "?" into a compute-credit counter
 *
 * Plays once when scrolled into view and never touches page scrolling.
 * Reduced-motion users get the finished frame. A replay button follows.
 */

const MAIN: EggId = "cr-emerald";
const LEFT: EggId = "au-dune";
const RIGHT: EggId = "oc-wave";

// ms from start at which each step begins; the last entry is "done"
const TIMELINE = [0, 2000, 4000, 6600, 8700];

const STEPS = [
  { title: "Choose your egg", body: "Pick a shell from the collection." },
  { title: "Contribute AGI", body: "Hold at least $25 of AGI to become eligible." },
  { title: "Hatch", body: "Your egg opens. What's inside is coming soon." },
  { title: "Earn compute credits", body: "Your pet earns AGI you can convert to credits." },
];

type Phase = 0 | 1 | 2 | 3 | 4 | 5; // 0 = waiting, 1–4 = steps, 5 = done

function useCountUp(target: number, active: boolean, duration: number, instant: boolean) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) {
      setV(0);
      return;
    }
    if (instant) {
      setV(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      setV(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration, instant]);
  return v;
}

const delay = (ms: number) => ({ ["--d"]: `${ms}ms` }) as React.CSSProperties;

export function HowItWorksMotion() {
  const ref = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const [phase, setPhase] = useState<Phase>(0);
  const [reduced, setReduced] = useState(false);
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    [MAIN, LEFT, RIGHT].forEach(preloadEgg);
  }, []);

  const play = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase(0);
    TIMELINE.forEach((at, i) => {
      timers.current.push(
        window.setTimeout(() => setPhase((i + 1) as Phase), at + 60),
      );
    });
  }, []);

  // Start once the scene is mostly in view. Scrolling is never blocked.
  useEffect(() => {
    if (played || !ref.current) return;
    if (reduced) {
      setPhase(5);
      setPlayed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPlayed(true);
          play();
          io.disconnect();
        }
      },
      { threshold: 0.45 },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [played, reduced, play]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const usd = useCountUp(25, phase >= 2, 1500, reduced);
  const credits = useCountUp(100, phase >= 4, 1600, reduced);

  const activeStep = phase === 0 ? -1 : Math.min(phase, 4) - 1;

  return (
    <div
      ref={ref}
      className="hiw"
      data-phase={phase}
      role="img"
      aria-label="How it works: choose your egg, contribute AGI, hatch — what's inside is coming soon — then earn compute credits."
    >
      {/* ---------------- Stage ---------------- */}
      <div className="stage" aria-hidden>
        <div className="side left">
          <Egg egg={LEFT} size={128} />
        </div>
        <div className="side right">
          <Egg egg={RIGHT} size={128} />
        </div>

        <div className="halo" />

        <div className="qmark">
          <span className="q">?</span>
          <span className="soon">Coming soon</span>
        </div>

        <div className="main">
          <div className="settle">
            <Egg egg={MAIN} size={200} />
            <span className="seam" />
            <span className="seam-glow" />
          </div>
          <span className="marker" />
        </div>

        <div className="particles">
          <i style={delay(0)} />
          <i style={delay(140)} />
          <i style={delay(280)} />
          <i style={delay(420)} />
          <i style={delay(560)} />
        </div>

        <div className="hold">
          <div className="track">
            <span className="fill" />
          </div>
          <div className="hold-label">
            ${usd.toFixed(2)} <span className="of">/ $25.00 held</span>
          </div>
        </div>

        <div className="credits">
          <span className="amt">+{Math.round(credits)}</span>
          <span className="cr">compute credits</span>
        </div>
      </div>

      {/* ---------------- Step rail ---------------- */}
      <ol className="rail">
        {STEPS.map((s, i) => {
          const state =
            phase === 5 || i < activeStep
              ? "past"
              : i === activeStep
                ? "active"
                : "future";
          return (
            <li key={s.title} className={`step ${state}`}>
              <span className="bar">
                <span className="bar-fill" />
              </span>
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              <span className="title">{s.title}</span>
              <span className="desc">{s.body}</span>
            </li>
          );
        })}
      </ol>

      <div className="replay-row">
        <button
          type="button"
          className="replay"
          onClick={play}
          disabled={phase > 0 && phase < 5}
          aria-label="Replay how it works"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path
              d="M10 6a4 4 0 1 1-1.2-2.85M10 1.5V4H7.5"
              stroke="currentColor"
              strokeWidth="1.3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Replay
        </button>
      </div>

      <style jsx>{`
        .hiw {
          --ease: cubic-bezier(0.22, 1, 0.36, 1);
          position: relative;
        }

        /* ---------- stage ---------- */
        .stage {
          position: relative;
          height: 460px;
          border-radius: 24px;
          background: radial-gradient(60% 55% at 50% 52%, #f7f7f5 0%, #ffffff 70%);
          border: 1px solid var(--hair);
          overflow: hidden;
        }
        .stage > div {
          position: absolute;
          left: 50%;
        }

        /* side eggs: present for Choose, then step away */
        .side {
          top: 196px;
          opacity: 0;
          transition:
            transform 900ms var(--ease),
            opacity 700ms var(--ease);
        }
        .side.left { transform: translate(calc(-50% - 190px), 12px); }
        .side.right { transform: translate(calc(-50% + 190px), 12px); }
        .hiw[data-phase="1"] .side { opacity: 1; }
        .hiw[data-phase="1"] .side.left { transform: translate(calc(-50% - 170px), 0); }
        .hiw[data-phase="1"] .side.right { transform: translate(calc(-50% + 170px), 0); }
        .hiw[data-phase="2"] .side.left,
        .hiw[data-phase="3"] .side.left,
        .hiw[data-phase="4"] .side.left,
        .hiw[data-phase="5"] .side.left { transform: translate(calc(-50% - 260px), 0); }
        .hiw[data-phase="2"] .side.right,
        .hiw[data-phase="3"] .side.right,
        .hiw[data-phase="4"] .side.right,
        .hiw[data-phase="5"] .side.right { transform: translate(calc(-50% + 260px), 0); }

        /* main egg */
        .main {
          top: 150px;
          z-index: 1;
          width: 200px;
          height: 200px;
          transform: translateX(-50%);
          opacity: 0;
          transition: opacity 600ms var(--ease);
        }
        .hiw:not([data-phase="0"]) .main { opacity: 1; }
        .settle {
          position: relative;
          width: 200px;
          height: 200px;
          transition: transform 1100ms var(--ease);
        }
        .hiw[data-phase="3"] .settle,
        .hiw[data-phase="4"] .settle,
        .hiw[data-phase="5"] .settle { transform: translateY(18px); }

        /* light opening along the seam — the shell stays whole */
        .seam,
        .seam-glow {
          position: absolute;
          left: 50%;
          top: 14%;
          height: 72%;
          transform: translateX(-50%) scaleY(0);
          transform-origin: 50% 0%;
          opacity: 0;
          pointer-events: none;
          transition:
            transform 900ms var(--ease),
            opacity 500ms var(--ease);
        }
        .seam {
          width: 2px;
          border-radius: 2px;
          background: linear-gradient(180deg, transparent, #cdff4a 18%, #cdff4a 82%, transparent);
        }
        .seam-glow {
          width: 18px;
          filter: blur(10px);
          background: linear-gradient(180deg, transparent, rgba(205, 255, 74, 0.5) 25%, rgba(205, 255, 74, 0.5) 75%, transparent);
        }
        .hiw[data-phase="3"] .seam,
        .hiw[data-phase="4"] .seam,
        .hiw[data-phase="5"] .seam,
        .hiw[data-phase="3"] .seam-glow,
        .hiw[data-phase="4"] .seam-glow,
        .hiw[data-phase="5"] .seam-glow {
          opacity: 1;
          transform: translateX(-50%) scaleY(1);
        }

        /* lime selection marker */
        .marker {
          position: absolute;
          left: 14px;
          top: 30px;
          width: 3px;
          height: 22px;
          border-radius: 3px;
          background: #cdff4a;
          box-shadow: 0 0 0 4px rgba(205, 255, 74, 0.2);
          opacity: 0;
          transform: scaleY(0.4);
          transition:
            opacity 300ms var(--ease) 500ms,
            transform 300ms var(--ease) 500ms;
        }
        .hiw[data-phase="1"] .marker,
        .hiw[data-phase="2"] .marker {
          opacity: 1;
          transform: scaleY(1);
        }

        /* soft halo behind the egg while it hatches */
        .halo {
          top: 100px;
          width: 340px;
          height: 340px;
          margin-left: -170px;
          border-radius: 50%;
          background: radial-gradient(closest-side, rgba(205, 255, 74, 0.38), rgba(205, 255, 74, 0) 72%);
          opacity: 0;
          transform: scale(0.7);
          transition:
            opacity 900ms var(--ease),
            transform 1400ms var(--ease);
        }
        .hiw[data-phase="3"] .halo,
        .hiw[data-phase="4"] .halo,
        .hiw[data-phase="5"] .halo {
          opacity: 1;
          transform: scale(1);
        }

        /* the "?" rises out from behind the egg */
        .qmark {
          top: 34px;
          z-index: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          opacity: 0;
          transform: translate(-50%, 120px) scale(0.6);
          transition:
            transform 1100ms var(--ease) 650ms,
            opacity 700ms var(--ease) 650ms;
        }
        .q {
          font-family: "Inter", -apple-system, system-ui, sans-serif;
          font-weight: 800;
          font-size: 88px;
          line-height: 0.9;
          letter-spacing: -0.04em;
          color: #0a0a0a;
          text-shadow: 0 0 28px rgba(205, 255, 74, 0.6);
        }
        .soon {
          font-family: "SF Mono", ui-monospace, monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #0a0a0a;
          background: #cdff4a;
          padding: 3px 8px;
          border-radius: 999px;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 500ms var(--ease) 1400ms;
        }
        .hiw[data-phase="3"] .qmark,
        .hiw[data-phase="4"] .qmark,
        .hiw[data-phase="5"] .qmark {
          opacity: 1;
          transform: translate(-50%, 0) scale(1);
        }
        .hiw[data-phase="3"] .soon,
        .hiw[data-phase="4"] .soon,
        .hiw[data-phase="5"] .soon { opacity: 1; }

        /* holding meter (step 2 only) */
        .hold {
          top: 384px;
          width: 240px;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          opacity: 0;
          transition: opacity 500ms var(--ease);
        }
        .hiw[data-phase="2"] .hold { opacity: 1; }
        .track {
          width: 100%;
          height: 3px;
          background: var(--hair);
          border-radius: 3px;
          overflow: hidden;
        }
        .fill {
          display: block;
          height: 100%;
          background: #0a0a0a;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 1500ms var(--ease);
        }
        .hiw[data-phase="2"] .fill,
        .hiw[data-phase="3"] .fill,
        .hiw[data-phase="4"] .fill,
        .hiw[data-phase="5"] .fill { transform: scaleX(1); }
        .hold-label {
          font-family: "SF Mono", ui-monospace, monospace;
          font-size: 12px;
          color: #0a0a0a;
          font-variant-numeric: tabular-nums;
        }
        .hold-label .of { color: var(--ink-mute); }

        /* earned credits (step 4 onward) */
        .credits {
          top: 384px;
          display: inline-flex;
          align-items: baseline;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: #0a0a0a;
          color: #fff;
          white-space: nowrap;
          opacity: 0;
          transform: translate(-50%, 8px);
          transition:
            opacity 500ms var(--ease) 600ms,
            transform 500ms var(--ease) 600ms;
        }
        .amt {
          font-family: "SF Mono", ui-monospace, monospace;
          font-size: 15px;
          font-weight: 600;
          color: #cdff4a;
          font-variant-numeric: tabular-nums;
        }
        .cr {
          font-family: "SF Mono", ui-monospace, monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.8);
        }
        .hiw[data-phase="4"] .credits,
        .hiw[data-phase="5"] .credits {
          opacity: 1;
          transform: translate(-50%, 0);
        }

        /* light drifting from the "?" down into the credits */
        .particles {
          top: 90px;
          z-index: 2;
          width: 0;
          height: 0;
        }
        .particles i {
          position: absolute;
          left: -3px;
          top: 0;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #cdff4a;
          box-shadow: 0 0 10px rgba(205, 255, 74, 0.9);
          opacity: 0;
        }
        .particles i:nth-child(1) { --x: -70px; }
        .particles i:nth-child(2) { --x: 80px; }
        .particles i:nth-child(3) { --x: -40px; }
        .particles i:nth-child(4) { --x: 55px; }
        .particles i:nth-child(5) { --x: 0px; }
        .hiw[data-phase="4"] .particles i {
          animation: drift 1100ms var(--ease) var(--d) both;
        }
        @keyframes drift {
          0% { opacity: 0; transform: translate(0, 0) scale(0.6); }
          15% { opacity: 1; }
          55% { transform: translate(var(--x), 150px) scale(1); }
          100% { opacity: 0; transform: translate(0, 300px) scale(0.5); }
        }

        /* ---------- step rail ---------- */
        .rail {
          list-style: none;
          margin: 28px 0 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .step {
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: opacity 400ms var(--ease);
        }
        .step.future { opacity: 0.45; }
        .bar {
          height: 2px;
          margin-bottom: 10px;
          border-radius: 2px;
          background: var(--hair);
          overflow: hidden;
        }
        .bar-fill {
          display: block;
          height: 100%;
          background: #0a0a0a;
          transform: scaleX(0);
          transform-origin: left;
        }
        .step.past .bar-fill {
          transform: scaleX(1);
          transition: transform 300ms var(--ease);
        }
        .step.active .bar-fill {
          transform: scaleX(1);
          background: #cdff4a;
          transition: transform 2000ms linear;
        }
        .num {
          font-family: "SF Mono", ui-monospace, monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          color: var(--ink-mute);
        }
        .title {
          font-size: 16px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: #0a0a0a;
        }
        .desc {
          font-size: 14px;
          line-height: 1.5;
          color: var(--ink-mute);
        }

        .replay-row {
          margin-top: 20px;
          display: flex;
          justify-content: flex-end;
        }
        .replay {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 2px;
          border: 0;
          background: none;
          font-size: 13px;
          color: var(--ink-mute);
          cursor: pointer;
          transition: color 150ms;
        }
        .replay:hover:not(:disabled) { color: #0a0a0a; }
        .replay:disabled { opacity: 0.35; cursor: default; }
        .replay:focus-visible {
          outline: 2px solid #0a0a0a;
          outline-offset: 3px;
          border-radius: 4px;
        }

        /* ---------- mobile ---------- */
        @media (max-width: 640px) {
          .stage { height: 420px; border-radius: 20px; }
          .side { top: 186px; }
          .hiw[data-phase="1"] .side.left { transform: translate(calc(-50% - 120px), 0) scale(0.75); }
          .hiw[data-phase="1"] .side.right { transform: translate(calc(-50% + 120px), 0) scale(0.75); }
          .main { top: 140px; }
          .halo { top: 90px; }
          .hold,
          .credits { top: 360px; }
          .rail { grid-template-columns: 1fr 1fr; gap: 20px 16px; }
        }

        /* ---------- reduced motion: finished frame, no movement ---------- */
        @media (prefers-reduced-motion: reduce) {
          .hiw *,
          .hiw *::before,
          .hiw *::after {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
