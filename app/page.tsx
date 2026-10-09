"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Egg } from "@/components/Egg";
import { EGG_CATALOG, pickEggs } from "@/lib/eggs";
import { useGame } from "@/components/StateProvider";

/**
 * Intro landing. One quiet egg. It fades to white, teleports to a new spot,
 * fades back in — as a different design each cycle. The copy only commits
 * once the egg has settled, which keeps the whole page breathing.
 */

type Spot = { top: string; left: string; size: number };

const SPOTS: Spot[] = [
  { top: "48%", left: "50%", size: 360 },
  { top: "36%", left: "72%", size: 240 },
  { top: "60%", left: "28%", size: 300 },
  { top: "40%", left: "40%", size: 420 },
  { top: "52%", left: "66%", size: 280 },
  { top: "46%", left: "32%", size: 340 },
];

const CYCLE_MS = 3400; // visible beat
const FADE_MS = 900; // crossfade

export default function HomePage() {
  const { state } = useGame();
  const [tick, setTick] = useState(0);
  const [visible, setVisible] = useState(true);

  // precompute a stable rotation order of eggs so the teleport also swaps design
  const rotation = useMemo(
    () => pickEggs("intro-" + Math.floor(Math.random() * 999), 8),
    [],
  );

  useEffect(() => {
    const i = setInterval(() => {
      // fade out, then on fade-end swap spot+egg + fade in
      setVisible(false);
      const t = setTimeout(() => {
        setTick((n) => n + 1);
        setVisible(true);
      }, FADE_MS);
      return () => clearTimeout(t);
    }, CYCLE_MS);
    return () => clearInterval(i);
  }, []);

  const spot = SPOTS[tick % SPOTS.length];
  const egg = rotation[tick % rotation.length];
  const minted = state?.supply.petsMinted ?? 1247;
  const remaining = Math.max(0, (state?.supply.petCap ?? 5000) - minted);

  return (
    <>
      {/* --- INTRO STAGE ---------------------------------------------------- */}
      <section className="relative w-full overflow-hidden">
        <div
          className="relative mx-auto"
          style={{ height: "min(82vh, 820px)" }}
        >
          {/* teleporting egg */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              top: spot.top,
              left: spot.left,
              transform: "translate(-50%, -50%)",
              transition: `opacity ${FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              opacity: visible ? 1 : 0,
            }}
          >
            <Egg egg={egg} size={spot.size} />
          </div>

          {/* soft centered copy that doesn't move */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
            <div className="eyebrow-mute mb-6">00 / dormant</div>
            <h1 className="display display-xl max-w-5xl pointer-events-auto">
              Something in there <br />
              is already{" "}
              <span className="relative inline-block">
                listening
                <svg
                  aria-hidden
                  viewBox="0 0 240 18"
                  className="absolute left-0 -bottom-1 w-full"
                >
                  <path
                    d="M2 14 C 60 2, 180 2, 238 14"
                    stroke="#CDFF4A"
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span>.</span>
            </h1>
          </div>
        </div>

        {/* ribbon under the stage */}
        <div className="full-bleed max-w-[1400px] mx-auto pb-10 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 pointer-events-auto">
          <p className="text-ink-mute text-[16px] max-w-md leading-relaxed">
            A living AI companion protocol. Fixed 100,000,000 AGI. Only 5,000
            pets will ever exist. What you commit decides what wakes up.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/choose" className="btn btn-primary btn-xl">
              Choose your egg <Arrow />
            </Link>
            <Link href="/eggs" className="btn btn-xl">
              Open chamber
            </Link>
          </div>
        </div>
      </section>

      {/* --- Scarcity line ------------------------------------------------- */}
      <section className="hairline">
        <div className="full-bleed max-w-[1400px] mx-auto py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
          <Metric k="Fixed supply" v="100M" sub="AGI" />
          <Metric k="Pets ever" v="5,000" sub="hard cap" />
          <Metric k="Remaining" v={remaining.toLocaleString()} sub="unminted" />
          <Metric k="Band to begin" v="$25" sub="held" />
        </div>
      </section>

      {/* --- Preview wall of eggs ----------------------------------------- */}
      <section className="full-bleed max-w-[1400px] w-full mx-auto py-24">
        <div className="flex items-end justify-between gap-6 mb-10 flex-wrap">
          <div>
            <div className="eyebrow mb-3">01 / The archive</div>
            <h2 className="display display-md max-w-xl">
              Every shell leads <br /> somewhere{" "}
              <span className="bg-lime px-2">different.</span>
            </h2>
          </div>
          <Link href="/choose" className="btn">
            See all designs <Arrow />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {EGG_CATALOG.slice(0, 12).map((e) => (
            <Link
              key={e.id}
              href="/choose"
              className="group flex flex-col items-center text-center gap-2 py-6 rounded-2xl hover:bg-white transition-colors"
            >
              <Egg egg={e} size={140} />
              <div className="eyebrow-mute mt-3">{e.name}</div>
              <div className="mono text-[11px] text-ink-faint">
                {e.rarity}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* --- Four moves --------------------------------------------------- */}
      <section className="hairline">
        <div className="full-bleed max-w-[1400px] mx-auto py-24 grid lg:grid-cols-[1fr_2fr] gap-12">
          <div>
            <div className="eyebrow mb-4">02 / How it wakes up</div>
            <h2 className="display display-md max-w-sm">
              Four moves. <br />
              One <span className="bg-lime px-2">life.</span>
            </h2>
          </div>
          <ol className="space-y-10 lg:space-y-14">
            {STEPS.map((s, i) => (
              <li
                key={i}
                className="grid grid-cols-[auto_1fr] gap-6 hairline pt-8 first:border-0 first:pt-0"
              >
                <div className="mono text-ink-faint text-[13px] pt-1 w-10">
                  0{i + 1}
                </div>
                <div>
                  <h3 className="display text-[clamp(26px,3vw,38px)] font-semibold tracking-tightest mb-3">
                    {s.title}
                  </h3>
                  <p className="text-ink-mute leading-relaxed max-w-xl">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --- Closer -------------------------------------------------------- */}
      <section className="full-bleed max-w-[1400px] w-full mx-auto py-24">
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-end">
          <h2 className="display display-lg">
            Pick a shell. <br />
            See what <span className="bg-lime px-3">answers.</span>
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/choose" className="btn btn-primary btn-xl">
              Choose your egg <Arrow />
            </Link>
            <Link href="/eggs" className="btn btn-xl">
              Open chamber
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Metric({ k, v, sub }: { k: string; v: string; sub: string }) {
  return (
    <div>
      <div className="eyebrow-mute">{k}</div>
      <div className="display text-[clamp(28px,3vw,42px)] font-semibold tracking-tightest mt-2">
        {v}
      </div>
      <div className="eyebrow-mute mt-1">{sub}</div>
    </div>
  );
}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 13 L13 3 M6 3 H13 V10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const STEPS = [
  {
    title: "Commit AGI",
    body: "Buy from the fixed 100M supply. 2.5% routes to the compute treasury that feeds your pet's brain.",
  },
  {
    title: "Earn fragments",
    body: "Fragments accrue while you hold within band. They are soulbound. No markets, no bots, no shortcut.",
  },
  {
    title: "Choose a shell",
    body: "Pick the egg you'll live with. Each design seeds a different personality distribution.",
  },
  {
    title: "Evolve or dim",
    body: "Four stages up to AGI. Each unlocks new skills: memory, tools, autonomy, multi-agent. Drop out of band and watch them dim.",
  },
];
