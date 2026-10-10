"use client";

import { useEffect, useRef, useState } from "react";
import { Egg } from "./Egg";
import { eggById, type EggId } from "@/lib/eggs";

/**
 * How-it-works motion graphic.
 *
 * Three choreographed acts, then it settles into a static triptych that
 * is itself the diagram the section would carry on its own.
 *
 *   01 Choose      three real shells slide in; the center one is marked
 *   02 Band        the chosen shell lands; a dashed $25 holding line
 *                  draws across; AGI tokens tick up past it
 *   03 Fragments   lime particles converge; a counter steps 0.00 → 1.00
 *
 * Triggers on scroll (IntersectionObserver, once). Respects
 * prefers-reduced-motion by rendering the end frame immediately.
 */

const SELECTED: EggId = "cr-emerald";
const LEFT: EggId = "au-dune";
const RIGHT: EggId = "stn-geode";

const END_LEFT: EggId = "au-fold";
const END_CENTER: EggId = "cr-emerald";
const END_RIGHT: EggId = "wd-maple";

export function HowItWorksMotion({
  onStateChange,
}: {
  /** Called whenever the motion changes state. The parent uses this to
   *  lock page scroll while "playing" and release it on "done".
   */
  onStateChange?: (state: "idle" | "playing" | "done") => void;
} = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "playing" | "done">("idle");
  const [reducedMotion, setReducedMotion] = useState(false);

  // Notify the parent on every state transition.
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    if (reducedMotion) {
      setState("done");
      return;
    }
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && state === "idle") {
            setState("playing");
            io.disconnect();
            break;
          }
        }
      },
      // Wait until most of the stage is on screen so the scroll-lock
      // doesn't engage with the content halfway visible.
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [state, reducedMotion]);

  useEffect(() => {
    if (state !== "playing") return;
    const t = setTimeout(() => setState("done"), 7600);
    return () => clearTimeout(t);
  }, [state]);

  // Preload the sprite sheets used in the motion so there are no blank frames
  useEffect(() => {
    [SELECTED, LEFT, RIGHT, END_LEFT, END_CENTER, END_RIGHT].forEach((id) => {
      const e = eggById(id);
      if (typeof window !== "undefined") {
        const img = new window.Image();
        img.src = e.sheet;
      }
    });
  }, []);

  return (
    <div
      ref={ref}
      className="hiw-stage"
      data-state={state}
      aria-label="How it works, animated: choose an egg, meet the holding requirement, collect fragments"
    >
      {/* --- Act 01 : Choose an egg --------------------------------- */}
      <div className="act act-1">
        <div className="eggs-row">
          <div className="egg-slot a act1-slot">
            <Egg egg={LEFT} size={108} />
          </div>
          <div className="egg-slot b act1-slot">
            <Egg egg={SELECTED} size={108} />
            <span className="sel-mark" aria-hidden />
          </div>
          <div className="egg-slot c act1-slot">
            <Egg egg={RIGHT} size={108} />
          </div>
        </div>
        <Caption n="01" title="Choose an egg" />
      </div>

      {/* --- Act 02 : Band ----------------------------------------- */}
      <div className="act act-2">
        <div className="band-stage">
          <Egg egg={SELECTED} size={140} className="act2-egg" />
          <svg
            className="band-svg"
            viewBox="0 0 600 260"
            preserveAspectRatio="none"
            aria-hidden
          >
            <line
              className="act2-band"
              x1="40"
              y1="150"
              x2="560"
              y2="150"
              stroke="#0A0A0A"
              strokeWidth="1"
              strokeDasharray="520"
            />
            <g className="act2-ticker">
              <circle cx="420" cy="240" r="6" fill="#0A0A0A" />
              <circle cx="420" cy="240" r="6" fill="#0A0A0A" opacity="0.55" />
              <circle cx="420" cy="240" r="6" fill="#0A0A0A" opacity="0.25" />
            </g>
          </svg>
          <div className="band-label mono">band · $25</div>
          <div className="band-value mono">$25.00</div>
        </div>
        <Caption n="02" title="Meet the holding requirement" />
      </div>

      {/* --- Act 03 : Fragments ------------------------------------ */}
      <div className="act act-3">
        <div className="fragments-stage">
          <Egg egg={SELECTED} size={140} className="act3-egg" />
          <div className="particles" aria-hidden>
            <span className="p p1" />
            <span className="p p2" />
            <span className="p p3" />
            <span className="p p4" />
            <span className="p p5" />
            <span className="p p6" />
          </div>
          <div className="counter mono">
            <span className="n n0">0.00</span>
            <span className="n n25">0.25</span>
            <span className="n n50">0.50</span>
            <span className="n n75">0.75</span>
            <span className="n n100">1.00</span>
          </div>
          <div className="counter-sub eyebrow-mute">fragments</div>
        </div>
        <Caption n="03" title="Collect fragments" />
      </div>

      {/* --- End frame : static triptych --------------------------- */}
      <div className="end-frame">
        <EndStep
          n="01"
          title="Choose an egg"
          egg={END_LEFT}
          seam={{ right: true }}
        />
        <EndStep
          n="02"
          title="Hold at least $25"
          egg={END_CENTER}
          seam={{ right: true }}
          midRule
        />
        <EndStep n="03" title="Collect fragments" egg={END_RIGHT} frag />
      </div>

      <style jsx>{`
        .hiw-stage {
          position: relative;
          width: 100%;
          /* Reserved height matches the end frame + captions. Prevents layout shift */
          min-height: 440px;
        }

        /* -------- Common act container ------------------------------ */
        .act {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 40px;
          opacity: 0;
          pointer-events: none;
        }

        /* -------- Act 01 -------- */
        .eggs-row {
          display: flex;
          align-items: flex-end;
          gap: 56px;
        }
        .egg-slot {
          position: relative;
        }
        .sel-mark {
          position: absolute;
          top: 6px;
          left: -14px;
          width: 2px;
          height: 22px;
          border-radius: 2px;
          background: #cdff4a;
          box-shadow: 0 0 0 4px rgba(205, 255, 74, 0.18);
          opacity: 0;
          transform: scale(0.6);
          transform-origin: center;
        }

        /* -------- Act 02 : band stage -------- */
        .band-stage {
          position: relative;
          width: 600px;
          max-width: 100%;
          height: 260px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        :global(.hiw-stage .act2-egg) {
          position: relative;
          z-index: 2;
        }
        .band-svg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .band-label {
          position: absolute;
          top: 118px;
          left: 20px;
          font-size: 11px;
          letter-spacing: 0.14em;
          color: #0a0a0a;
          text-transform: uppercase;
          opacity: 0;
        }
        .band-value {
          position: absolute;
          top: 118px;
          right: 20px;
          font-size: 11px;
          letter-spacing: 0.14em;
          color: #0a0a0a;
          opacity: 0;
        }

        /* -------- Act 03 : fragments -------- */
        .fragments-stage {
          position: relative;
          width: 400px;
          max-width: 100%;
          height: 260px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }
        :global(.hiw-stage .act3-egg) {
          position: relative;
          z-index: 2;
        }
        .particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .p {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 6px;
          height: 6px;
          margin: -3px;
          border-radius: 999px;
          background: #cdff4a;
          opacity: 0;
          transform: translate(0, 0);
        }
        .counter {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 28px;
          font-weight: 600;
          color: #0a0a0a;
          display: flex;
          align-items: baseline;
          height: 1em;
        }
        .counter .n {
          position: absolute;
          left: 50%;
          top: 0;
          transform: translateX(-50%);
          opacity: 0;
        }
        .counter-sub {
          position: absolute;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
        }

        /* -------- Captions -------- */
        :global(.hiw-stage .caption-wrap) {
          text-align: center;
          margin-top: 4px;
        }
        :global(.hiw-stage .caption-title) {
          font-size: 20px;
          font-weight: 600;
          letter-spacing: -0.015em;
          color: #0a0a0a;
        }
        :global(.hiw-stage .caption-num) {
          font-family: "SF Mono", ui-monospace, monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #737373;
          margin-top: 4px;
        }

        /* -------- End frame : triptych -------- */
        .end-frame {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          align-items: center;
          opacity: 0;
          pointer-events: none;
        }
        :global(.hiw-stage .end-step) {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          position: relative;
        }
        :global(.hiw-stage .end-step.seam-right::after) {
          content: "";
          position: absolute;
          right: -2px;
          top: 20%;
          bottom: 20%;
          width: 1px;
          background: #cdff4a;
          opacity: 0.6;
        }
        :global(.hiw-stage .end-step .end-num) {
          font-family: "SF Mono", ui-monospace, monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #737373;
        }
        :global(.hiw-stage .end-step .end-ttl) {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: #0a0a0a;
          text-align: center;
        }
        :global(.hiw-stage .end-step .end-mid-rule) {
          height: 1px;
          width: 60%;
          background: #0a0a0a;
          opacity: 0.4;
          margin-top: 4px;
          background-image: linear-gradient(
            to right,
            #0a0a0a 0,
            #0a0a0a 3px,
            transparent 3px,
            transparent 6px
          );
          background-size: 6px 1px;
          background-color: transparent;
        }
        :global(.hiw-stage .end-step .end-frag) {
          font-family: "SF Mono", ui-monospace, monospace;
          font-size: 13px;
          font-weight: 600;
          color: #0a0a0a;
          padding: 2px 8px;
          border-radius: 999px;
          background: #cdff4a;
        }

        /* ===========================================================
         *  State = idle  →  everything hidden
         * =========================================================== */
        .hiw-stage[data-state="idle"] .act,
        .hiw-stage[data-state="idle"] .end-frame {
          opacity: 0;
        }

        /* ===========================================================
         *  State = done  →  only end frame
         * =========================================================== */
        .hiw-stage[data-state="done"] .act {
          display: none;
        }
        .hiw-stage[data-state="done"] .end-frame {
          opacity: 1;
        }

        /* ===========================================================
         *  State = playing  →  orchestrate
         * =========================================================== */
        .hiw-stage[data-state="playing"] .act-1 {
          animation: act-run 2.3s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s both;
        }
        .hiw-stage[data-state="playing"] .act-2 {
          animation: act-run 2.4s cubic-bezier(0.2, 0.8, 0.2, 1) 2.4s both;
        }
        .hiw-stage[data-state="playing"] .act-3 {
          animation: act-run 2.4s cubic-bezier(0.2, 0.8, 0.2, 1) 4.8s both;
        }
        .hiw-stage[data-state="playing"] .end-frame {
          animation: fade-in 500ms cubic-bezier(0.2, 0.8, 0.2, 1) 7.2s both;
        }

        /* Act 1 inner choreography */
        .hiw-stage[data-state="playing"] .egg-slot {
          opacity: 0;
          transform: translateY(10px);
        }
        .hiw-stage[data-state="playing"] .egg-slot.a {
          animation: slide-in-l 500ms cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s both;
        }
        .hiw-stage[data-state="playing"] .egg-slot.b {
          animation: slide-up 500ms cubic-bezier(0.2, 0.8, 0.2, 1) 0.35s both,
            egg-nod 1s cubic-bezier(0.4, 0, 0.2, 1) 1.1s both;
        }
        .hiw-stage[data-state="playing"] .egg-slot.c {
          animation: slide-in-r 500ms cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s both;
        }
        .hiw-stage[data-state="playing"] .sel-mark {
          animation: pop 300ms cubic-bezier(0.2, 0.8, 0.2, 1) 1.1s both;
        }

        /* Act 2 inner choreography */
        .hiw-stage[data-state="playing"] :global(.act2-egg) {
          opacity: 0;
          animation: fade-in 400ms ease-out 2.5s both;
        }
        .hiw-stage[data-state="playing"] .act2-band {
          stroke-dashoffset: 520;
          animation: draw-line 700ms cubic-bezier(0.2, 0.8, 0.2, 1) 2.7s both;
        }
        .hiw-stage[data-state="playing"] .band-label {
          animation: fade-in 400ms ease-out 3.2s both;
        }
        .hiw-stage[data-state="playing"] .act2-ticker {
          opacity: 0;
          animation: ticker-rise 1500ms cubic-bezier(0.2, 0.8, 0.2, 1) 3.1s both;
        }
        .hiw-stage[data-state="playing"] .act2-ticker circle:nth-child(1) {
          animation: ticker-blink 600ms ease-out 4.4s both;
        }
        .hiw-stage[data-state="playing"] .band-value {
          animation: fade-in 400ms ease-out 4.3s both;
        }

        /* Act 3 inner choreography */
        .hiw-stage[data-state="playing"] :global(.act3-egg) {
          opacity: 0;
          animation: fade-in 400ms ease-out 4.9s both;
        }
        .hiw-stage[data-state="playing"] .p {
          animation: particle-converge 1200ms cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .hiw-stage[data-state="playing"] .p1 {
          animation-delay: 5.1s;
          --from-x: -140px;
          --from-y: -40px;
        }
        .hiw-stage[data-state="playing"] .p2 {
          animation-delay: 5.25s;
          --from-x: -130px;
          --from-y: 60px;
        }
        .hiw-stage[data-state="playing"] .p3 {
          animation-delay: 5.4s;
          --from-x: 140px;
          --from-y: -50px;
        }
        .hiw-stage[data-state="playing"] .p4 {
          animation-delay: 5.55s;
          --from-x: 130px;
          --from-y: 60px;
        }
        .hiw-stage[data-state="playing"] .p5 {
          animation-delay: 5.7s;
          --from-x: -100px;
          --from-y: 100px;
        }
        .hiw-stage[data-state="playing"] .p6 {
          animation-delay: 5.85s;
          --from-x: 100px;
          --from-y: 90px;
        }
        .hiw-stage[data-state="playing"] .counter .n0 {
          animation: n-show 400ms both;
          animation-delay: 5.0s;
        }
        .hiw-stage[data-state="playing"] .counter .n25 {
          animation: n-show 400ms both;
          animation-delay: 5.5s;
        }
        .hiw-stage[data-state="playing"] .counter .n50 {
          animation: n-show 400ms both;
          animation-delay: 5.95s;
        }
        .hiw-stage[data-state="playing"] .counter .n75 {
          animation: n-show 400ms both;
          animation-delay: 6.4s;
        }
        .hiw-stage[data-state="playing"] .counter .n100 {
          animation: n-show-final 400ms both;
          animation-delay: 6.85s;
        }
        .hiw-stage[data-state="playing"] .counter-sub {
          animation: fade-in 400ms ease-out 5.0s both;
        }

        /* ===========================================================
         *  Keyframes
         * =========================================================== */
        @keyframes act-run {
          0% { opacity: 0; }
          8% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-l {
          from { opacity: 0; transform: translateX(-30px) translateY(10px); }
          to { opacity: 1; transform: translateX(0) translateY(0); }
        }
        @keyframes slide-in-r {
          from { opacity: 0; transform: translateX(30px) translateY(10px); }
          to { opacity: 1; transform: translateX(0) translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes egg-nod {
          0% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
          100% { transform: translateY(0); }
        }
        @keyframes pop {
          0% { opacity: 0; transform: scale(0.6); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes draw-line {
          from { stroke-dashoffset: 520; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes ticker-rise {
          0% { opacity: 0; transform: translateY(0); }
          20% { opacity: 1; }
          100% { opacity: 1; transform: translateY(-120px); }
        }
        @keyframes ticker-blink {
          0%, 100% { fill: #0a0a0a; }
          50% { fill: #cdff4a; }
        }
        @keyframes particle-converge {
          0% {
            opacity: 0;
            transform: translate(var(--from-x), var(--from-y));
          }
          20% { opacity: 1; }
          100% {
            opacity: 0;
            transform: translate(0, 0);
          }
        }
        @keyframes n-show {
          0% { opacity: 0; }
          25% { opacity: 1; }
          85% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes n-show-final {
          0% { opacity: 0; color: #0a0a0a; }
          25% { opacity: 1; color: #0a0a0a; }
          50% { color: #0a0a0a; background: #cdff4a; }
          100% { opacity: 1; color: #0a0a0a; background: #cdff4a; }
        }

        /* ===========================================================
         *  Reduced motion → straight to end frame
         * =========================================================== */
        @media (prefers-reduced-motion: reduce) {
          .act { display: none; }
          .end-frame { opacity: 1 !important; }
        }

        /* ===========================================================
         *  Mobile adjustments — smaller eggs, stacked triptych, no horizontal overflow
         * =========================================================== */
        @media (max-width: 640px) {
          .hiw-stage {
            min-height: 460px;
          }
          .eggs-row {
            gap: 14px;
          }
          :global(.hiw-stage .act1-slot > *),
          :global(.hiw-stage .act2-egg),
          :global(.hiw-stage .act3-egg) {
            transform: scale(0.75);
            transform-origin: center;
          }
          :global(.hiw-stage .end-step .end-frag) {
            top: 4px !important;
            right: -4px !important;
            font-size: 12px;
            padding: 1px 6px;
          }
          .band-stage,
          .fragments-stage {
            width: 100%;
            max-width: 320px;
            height: 220px;
          }
          .band-label,
          .band-value {
            top: 94px;
            font-size: 10px;
          }
          .band-label {
            left: 8px;
          }
          .band-value {
            right: 8px;
          }
          .counter {
            font-size: 24px;
            bottom: 24px;
          }
          .end-frame {
            grid-template-columns: 1fr;
            gap: 32px;
            align-items: start;
            padding: 20px 0;
          }
          :global(.hiw-stage .end-step) {
            flex-direction: row;
            text-align: left;
            gap: 16px;
            align-items: center;
            justify-content: flex-start;
          }
          :global(.hiw-stage .end-step .end-ttl) {
            text-align: left;
          }
          :global(.hiw-stage .end-step.seam-right::after) {
            display: none;
          }
          :global(.hiw-stage .end-step .end-mid-rule) {
            display: none;
          }
          :global(.hiw-stage .caption-title) {
            font-size: 17px;
          }
        }

        /* ===========================================================
         *  Tablet — slightly smaller internals
         * =========================================================== */
        @media (min-width: 641px) and (max-width: 1024px) {
          .band-stage {
            width: 480px;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

function Caption({ n, title }: { n: string; title: string }) {
  return (
    <div className="caption-wrap">
      <div className="caption-title">{title}</div>
      <div className="caption-num">— {n}</div>
    </div>
  );
}

function EndStep({
  n,
  title,
  egg,
  seam,
  midRule,
  frag,
}: {
  n: string;
  title: string;
  egg: EggId;
  seam?: { right?: boolean };
  midRule?: boolean;
  frag?: boolean;
}) {
  return (
    <div className={`end-step ${seam?.right ? "seam-right" : ""}`}>
      <div style={{ position: "relative" }}>
        <Egg egg={egg} size={110} />
        {frag && (
          <span
            className="end-frag"
            style={{
              position: "absolute",
              top: 10,
              right: -10,
            }}
          >
            1.00
          </span>
        )}
      </div>
      {midRule && <div className="end-mid-rule" />}
      <div>
        <div className="end-num">{n}</div>
        <div className="end-ttl">{title}</div>
      </div>
    </div>
  );
}
