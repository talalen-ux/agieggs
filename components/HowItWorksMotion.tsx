"use client";

import { useEffect, useRef, useState } from "react";

/**
 * How-it-works motion graphic.
 *
 * A single SVG scene choreographed with CSS keyframes. Three acts:
 *   01 Choose an egg       →  three shells slide in, one is marked
 *   02 Meet the band       →  a $25 band rises past the holding line
 *   03 Collect fragments   →  particles converge, a counter ticks to 1.00,
 *                             the chosen shell's seam opens
 *
 * After the last act the frame settles into a static triptych — the diagram
 * the section would carry on its own, now the memory of what just played.
 *
 * Triggers on scroll via IntersectionObserver (plays once). Respects
 * prefers-reduced-motion by jumping straight to the end state.
 */
export function HowItWorksMotion() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "playing" | "done">("idle");
  const [reducedMotion, setReducedMotion] = useState(false);

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
      // start when ~40% of the component is in view
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [state, reducedMotion]);

  // schedule transition to "done" after the choreography finishes
  useEffect(() => {
    if (state !== "playing") return;
    const t = setTimeout(() => setState("done"), 7600);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <div
      ref={ref}
      className="hiw-stage"
      data-state={state}
      aria-label="How it works, animated: choose an egg, meet the holding requirement, collect fragments"
    >
      <svg
        viewBox="0 0 1200 460"
        className="w-full h-auto block"
        role="img"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="hiw-shell" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#F0F0F0" />
          </linearGradient>
          <linearGradient id="hiw-shell-dark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1F1F1F" />
            <stop offset="1" stopColor="#0A0A0A" />
          </linearGradient>
          <symbol id="egg" viewBox="0 0 120 160">
            {/* egg body */}
            <path
              d="M60 4 C90 4 112 44 112 90 C112 128 90 156 60 156 C30 156 8 128 8 90 C8 44 30 4 60 4 Z"
              fill="url(#hiw-shell)"
              stroke="#0A0A0A"
              strokeWidth="1.2"
            />
            {/* lime seam */}
            <line
              x1="60"
              y1="8"
              x2="60"
              y2="152"
              stroke="#CDFF4A"
              strokeWidth="1.5"
            />
          </symbol>
          <symbol id="egg-ink" viewBox="0 0 120 160">
            <path
              d="M60 4 C90 4 112 44 112 90 C112 128 90 156 60 156 C30 156 8 128 8 90 C8 44 30 4 60 4 Z"
              fill="url(#hiw-shell-dark)"
              stroke="#0A0A0A"
              strokeWidth="1"
            />
            <line
              x1="60"
              y1="8"
              x2="60"
              y2="152"
              stroke="#CDFF4A"
              strokeWidth="1.6"
            />
          </symbol>
        </defs>

        {/* --- common ground line ---------------------------------- */}
        <line
          className="hiw-ground"
          x1="60"
          y1="398"
          x2="1140"
          y2="398"
          stroke="#E5E5E5"
          strokeWidth="1"
        />

        {/* ================================================
         *  Act 01 — Choose an egg
         * ================================================ */}
        <g className="act act-1">
          <use href="#egg" className="act1-egg a" x="250" y="150" width="110" height="146" />
          <use href="#egg" className="act1-egg b" x="400" y="150" width="110" height="146" />
          <use href="#egg" className="act1-egg c" x="550" y="150" width="110" height="146" />
          {/* lime selection mark on the middle shell */}
          <g className="act1-mark">
            <rect x="440" y="150" width="3" height="18" rx="1.5" fill="#CDFF4A" />
            <circle cx="441.5" cy="159" r="7" fill="none" stroke="#CDFF4A" strokeOpacity="0.3" strokeWidth="3" />
          </g>
          <text className="act-label" x="455" y="340" textAnchor="middle">
            Choose an egg
          </text>
          <text className="act-count" x="455" y="364" textAnchor="middle">
            01
          </text>
        </g>

        {/* ================================================
         *  Act 02 — Meet the band
         * ================================================ */}
        <g className="act act-2">
          <use href="#egg" className="act2-egg" x="540" y="130" width="120" height="160" />
          {/* holding line */}
          <line
            className="act2-band"
            x1="320"
            y1="250"
            x2="880"
            y2="250"
            stroke="#0A0A0A"
            strokeWidth="1"
            strokeDasharray="560"
          />
          <text className="act2-band-label" x="320" y="238">
            band · $25
          </text>
          {/* AGI tokens ticking upward past the band */}
          <g className="act2-ticker">
            <circle cx="760" cy="340" r="7" fill="#0A0A0A" />
            <circle cx="760" cy="340" r="7" fill="#0A0A0A" opacity="0.6" />
            <circle cx="760" cy="340" r="7" fill="#0A0A0A" opacity="0.3" />
          </g>
          <text className="act2-value" x="800" y="258" textAnchor="start">
            $25.00
          </text>
          <text className="act-label" x="600" y="340" textAnchor="middle">
            Meet the holding requirement
          </text>
          <text className="act-count" x="600" y="364" textAnchor="middle">
            02
          </text>
        </g>

        {/* ================================================
         *  Act 03 — Collect fragments
         * ================================================ */}
        <g className="act act-3">
          <use href="#egg" className="act3-egg" x="540" y="130" width="120" height="160" />
          {/* particles converge from the sides */}
          <g className="act3-particles">
            <circle className="p p1" cx="600" cy="210" r="3" fill="#CDFF4A" />
            <circle className="p p2" cx="600" cy="210" r="3" fill="#CDFF4A" />
            <circle className="p p3" cx="600" cy="210" r="3" fill="#CDFF4A" />
            <circle className="p p4" cx="600" cy="210" r="3" fill="#CDFF4A" />
            <circle className="p p5" cx="600" cy="210" r="3" fill="#CDFF4A" />
            <circle className="p p6" cx="600" cy="210" r="3" fill="#CDFF4A" />
          </g>
          {/* fragment counter */}
          <text className="act3-counter" x="600" y="258" textAnchor="middle">
            <tspan className="n0">0.00</tspan>
            <tspan className="n25">0.25</tspan>
            <tspan className="n50">0.50</tspan>
            <tspan className="n75">0.75</tspan>
            <tspan className="n100">1.00</tspan>
          </text>
          <text className="act3-sub" x="600" y="278" textAnchor="middle">
            fragments
          </text>
          <text className="act-label" x="600" y="340" textAnchor="middle">
            Collect fragments
          </text>
          <text className="act-count" x="600" y="364" textAnchor="middle">
            03
          </text>
        </g>

        {/* ================================================
         *  End state — static triptych
         * ================================================ */}
        <g className="end-frame">
          {/* three columns separated by thin seams */}
          <line className="end-seam a" x1="400" y1="140" x2="400" y2="340" stroke="#CDFF4A" strokeWidth="1" />
          <line className="end-seam b" x1="800" y1="140" x2="800" y2="340" stroke="#CDFF4A" strokeWidth="1" />

          <g className="end-step one">
            <use href="#egg" x="150" y="150" width="100" height="134" />
            <text className="end-num" x="200" y="310" textAnchor="middle">01</text>
            <text className="end-ttl" x="200" y="334" textAnchor="middle">Choose an egg</text>
          </g>

          <g className="end-step two">
            <use href="#egg" x="550" y="150" width="100" height="134" />
            <line x1="470" y1="260" x2="730" y2="260" stroke="#0A0A0A" strokeWidth="1" strokeDasharray="3 3" />
            <text className="end-num" x="600" y="310" textAnchor="middle">02</text>
            <text className="end-ttl" x="600" y="334" textAnchor="middle">
              Hold at least $25
            </text>
          </g>

          <g className="end-step three">
            <use href="#egg-ink" x="950" y="150" width="100" height="134" />
            <text x="1000" y="214" textAnchor="middle" className="end-frag">1.00</text>
            <text className="end-num" x="1000" y="310" textAnchor="middle">03</text>
            <text className="end-ttl" x="1000" y="334" textAnchor="middle">
              Collect fragments
            </text>
          </g>
        </g>
      </svg>

      <style jsx>{`
        .hiw-stage {
          width: 100%;
          position: relative;
        }

        /* Base — every act hidden until its turn */
        .act,
        .end-frame {
          opacity: 0;
          transition: none;
        }

        /* Text styling (inherits svg presentation) */
        :global(.hiw-stage text) {
          font-family: "Inter", -apple-system, system-ui, sans-serif;
          fill: #0a0a0a;
        }
        :global(.hiw-stage .act-label) {
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -0.02em;
        }
        :global(.hiw-stage .act-count) {
          font-family: "SF Mono", ui-monospace, monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          fill: #737373;
        }
        :global(.hiw-stage .act2-band-label),
        :global(.hiw-stage .act2-value) {
          font-family: "SF Mono", ui-monospace, monospace;
          font-size: 12px;
          letter-spacing: 0.08em;
          fill: #0a0a0a;
          text-transform: uppercase;
        }
        :global(.hiw-stage .act3-counter) {
          font-family: "SF Mono", ui-monospace, monospace;
          font-size: 28px;
          font-weight: 600;
          fill: #0a0a0a;
        }
        :global(.hiw-stage .act3-sub) {
          font-family: "SF Mono", ui-monospace, monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          fill: #737373;
        }
        :global(.hiw-stage .end-num) {
          font-family: "SF Mono", ui-monospace, monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          fill: #737373;
        }
        :global(.hiw-stage .end-ttl) {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.01em;
          fill: #0a0a0a;
        }
        :global(.hiw-stage .end-frag) {
          font-family: "SF Mono", ui-monospace, monospace;
          font-size: 14px;
          font-weight: 600;
          fill: #ffffff;
        }

        /* Counter: show one tspan at a time */
        :global(.hiw-stage .act3-counter tspan) {
          opacity: 0;
        }

        /* ===========================================================
         *  Idle — nothing visible except the ground line
         * =========================================================== */
        .hiw-stage[data-state="idle"] :global(.act),
        .hiw-stage[data-state="idle"] :global(.end-frame) {
          opacity: 0;
        }

        /* ===========================================================
         *  Playing — orchestrate the three acts, then land on the end
         * =========================================================== */
        .hiw-stage[data-state="playing"] :global(.act-1) {
          animation: act-run 2.3s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s both;
        }
        .hiw-stage[data-state="playing"] :global(.act-2) {
          animation: act-run 2.4s cubic-bezier(0.2, 0.8, 0.2, 1) 2.4s both;
        }
        .hiw-stage[data-state="playing"] :global(.act-3) {
          animation: act-run 2.4s cubic-bezier(0.2, 0.8, 0.2, 1) 4.8s both;
        }
        .hiw-stage[data-state="playing"] :global(.end-frame) {
          animation: fade-in 500ms cubic-bezier(0.2, 0.8, 0.2, 1) 7.2s both;
        }

        /* Act 1 inner choreography — the three eggs slide + mark pops */
        .hiw-stage[data-state="playing"] :global(.act1-egg) {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
        }
        .hiw-stage[data-state="playing"] :global(.act1-egg.a) {
          animation: slide-in-l 500ms cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s both;
        }
        .hiw-stage[data-state="playing"] :global(.act1-egg.b) {
          animation: slide-up 500ms cubic-bezier(0.2, 0.8, 0.2, 1) 0.35s both,
            egg-nod 800ms cubic-bezier(0.4, 0, 0.2, 1) 1.1s both;
        }
        .hiw-stage[data-state="playing"] :global(.act1-egg.c) {
          animation: slide-in-r 500ms cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s both;
        }
        .hiw-stage[data-state="playing"] :global(.act1-mark) {
          opacity: 0;
          animation: pop 300ms cubic-bezier(0.2, 0.8, 0.2, 1) 1.1s both;
          transform-origin: 441px 159px;
        }

        /* Act 2 inner choreography — band appears, ticker rises past it */
        .hiw-stage[data-state="playing"] :global(.act2-egg) {
          opacity: 0;
          animation: fade-in 400ms ease-out 2.5s both;
        }
        .hiw-stage[data-state="playing"] :global(.act2-band) {
          stroke-dashoffset: 560;
          animation: draw-line 700ms cubic-bezier(0.2, 0.8, 0.2, 1) 2.7s both;
        }
        .hiw-stage[data-state="playing"] :global(.act2-band-label) {
          opacity: 0;
          animation: fade-in 400ms ease-out 3.2s both;
        }
        .hiw-stage[data-state="playing"] :global(.act2-ticker) {
          opacity: 0;
          animation: ticker-rise 1500ms cubic-bezier(0.2, 0.8, 0.2, 1) 3.1s both;
        }
        .hiw-stage[data-state="playing"] :global(.act2-ticker circle:nth-child(1)) {
          animation: ticker-blink 600ms ease-out 4.4s both;
        }
        .hiw-stage[data-state="playing"] :global(.act2-value) {
          opacity: 0;
          animation: fade-in 400ms ease-out 4.3s both;
        }

        /* Act 3 inner choreography — particles converge, counter ticks */
        .hiw-stage[data-state="playing"] :global(.act3-egg) {
          opacity: 0;
          animation: fade-in 400ms ease-out 4.9s both;
        }
        .hiw-stage[data-state="playing"] :global(.p) {
          opacity: 0;
          animation: particle-converge 1200ms cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .hiw-stage[data-state="playing"] :global(.p.p1) {
          animation-delay: 5.1s;
          --from-x: -280px;
          --from-y: -40px;
        }
        .hiw-stage[data-state="playing"] :global(.p.p2) {
          animation-delay: 5.25s;
          --from-x: -260px;
          --from-y: 80px;
        }
        .hiw-stage[data-state="playing"] :global(.p.p3) {
          animation-delay: 5.4s;
          --from-x: 280px;
          --from-y: -60px;
        }
        .hiw-stage[data-state="playing"] :global(.p.p4) {
          animation-delay: 5.55s;
          --from-x: 260px;
          --from-y: 80px;
        }
        .hiw-stage[data-state="playing"] :global(.p.p5) {
          animation-delay: 5.7s;
          --from-x: -200px;
          --from-y: 180px;
        }
        .hiw-stage[data-state="playing"] :global(.p.p6) {
          animation-delay: 5.85s;
          --from-x: 200px;
          --from-y: 160px;
        }
        /* counter tspans — simple sequential reveal */
        .hiw-stage[data-state="playing"] :global(.act3-counter .n0) {
          animation: tspan-show 400ms both;
          animation-delay: 5.0s;
        }
        .hiw-stage[data-state="playing"] :global(.act3-counter .n25) {
          animation: tspan-show 400ms both;
          animation-delay: 5.5s;
        }
        .hiw-stage[data-state="playing"] :global(.act3-counter .n50) {
          animation: tspan-show 400ms both;
          animation-delay: 5.95s;
        }
        .hiw-stage[data-state="playing"] :global(.act3-counter .n75) {
          animation: tspan-show 400ms both;
          animation-delay: 6.4s;
        }
        .hiw-stage[data-state="playing"] :global(.act3-counter .n100) {
          animation: tspan-show-lime 400ms both;
          animation-delay: 6.85s;
        }
        .hiw-stage[data-state="playing"] :global(.act3-sub) {
          opacity: 0;
          animation: fade-in 400ms ease-out 5.0s both;
        }

        /* ===========================================================
         *  Done — only the end-frame is visible
         * =========================================================== */
        .hiw-stage[data-state="done"] :global(.act) {
          display: none;
        }
        .hiw-stage[data-state="done"] :global(.end-frame) {
          opacity: 1;
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
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-r {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(16px); }
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
          from { stroke-dashoffset: 560; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes ticker-rise {
          0% { opacity: 0; transform: translateY(0); }
          20% { opacity: 1; }
          100% { opacity: 1; transform: translateY(-100px); }
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
        @keyframes tspan-show {
          0% { opacity: 0; }
          25% { opacity: 1; }
          85% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes tspan-show-lime {
          0% { opacity: 0; fill: #0a0a0a; }
          25% { opacity: 1; fill: #0a0a0a; }
          50% { fill: #cdff4a; }
          100% { opacity: 1; fill: #0a0a0a; }
        }

        /* Particles sit at the egg center (cx/cy as attributes); the
         * --from-x/y CSS variables slide them in from the edges to (0,0).
         */
        :global(.hiw-stage .p) {
          transform-box: fill-box;
          transform-origin: center;
        }

        /* ===========================================================
         *  Reduced motion — straight to the static end frame
         * =========================================================== */
        @media (prefers-reduced-motion: reduce) {
          .hiw-stage :global(.act) { display: none; }
          .hiw-stage :global(.end-frame) { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
