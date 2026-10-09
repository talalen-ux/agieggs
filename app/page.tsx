"use client";

import Link from "next/link";
import { Egg } from "@/components/Egg";
import { useGame } from "@/components/StateProvider";

export default function HomePage() {
  const { state } = useGame();
  const minted = state?.supply.petsMinted ?? 0;
  const cap = state?.supply.petCap ?? 5000;
  const remaining = Math.max(0, cap - minted);

  return (
    <>
      {/* --- HERO ----------------------------------------------------------- */}
      <section className="full-bleed max-w-[1400px] w-full mx-auto pt-10 lg:pt-16 pb-20">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center min-h-[72vh]">
          {/* Left — headline */}
          <div className="animate-enter_up">
            <div className="eyebrow mb-6">00 / Protocol live</div>
            <h1 className="display display-xl">
              Intelligence,<br />
              <span className="relative inline-block">
                scarce
                <svg
                  aria-hidden
                  viewBox="0 0 240 18"
                  className="absolute left-0 -bottom-2 w-full"
                >
                  <path
                    d="M2 14 C 60 2, 180 2, 238 14"
                    stroke="#CDFF4A"
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              by<br />
              commitment.
            </h1>
            <p className="mt-8 text-[17px] text-ink-mute max-w-md leading-relaxed">
              A living AI companion protocol. Buy AGI, hold within your band,
              and an egg becomes yours. Only 5,000 pets will ever exist.
              What you commit decides what wakes up.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/eggs" className="btn btn-primary btn-xl">
                Enter the chamber
                <Arrow />
              </Link>
              <Link href="/choose" className="btn btn-xl">
                Choose your egg
              </Link>
            </div>

            {/* Stat ribbon */}
            <dl className="mt-14 grid grid-cols-3 max-w-md gap-6 hairline pt-6">
              <StatRow k="Fixed supply" v="100M" sub="AGI" />
              <StatRow k="Pets, ever" v={cap.toLocaleString()} sub="hard cap" />
              <StatRow k="Remaining" v={remaining.toLocaleString()} sub="unminted" />
            </dl>
          </div>

          {/* Right — the egg */}
          <div className="relative flex items-center justify-center">
            <Egg
              variant="shell"
              width={360}
              height={480}
              rulers
              className="animate-float"
            />
            <FloatingLabel top="12%" left="-4%" text="100,000,000 agi" />
            <FloatingLabel top="46%" right="-6%" text="dormant" />
            <FloatingLabel bottom="10%" left="-2%" text="incubation / 000" />
          </div>
        </div>
      </section>

      {/* --- Marquee rail -------------------------------------------------- */}
      <section className="hairline hairline-b">
        <div className="full-bleed max-w-[1400px] mx-auto flex items-center justify-between gap-6 py-5 marquee">
          {[
            "chat",
            "memory",
            "tasks",
            "tools",
            "apis",
            "autonomy",
            "multi-agent",
            "chat",
            "memory",
            "tasks",
          ].map((w, i) => (
            <span
              key={i}
              className="eyebrow-mute whitespace-nowrap"
              style={{ letterSpacing: "0.2em" }}
            >
              — {w} —
            </span>
          ))}
        </div>
      </section>

      {/* --- 3-step editorial section -------------------------------------- */}
      <section className="full-bleed max-w-[1400px] w-full mx-auto py-24">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-12">
          <div>
            <div className="eyebrow mb-5">01 / How it wakes up</div>
            <h2 className="display display-md max-w-sm">
              Four moves. One <span className="bg-lime px-2">life.</span>
            </h2>
          </div>
          <ol className="space-y-10 lg:space-y-14">
            {STEPS.map((s, i) => (
              <li
                key={i}
                className="grid grid-cols-[auto_1fr] gap-6 hairline pt-8 first:border-0 first:pt-0"
              >
                <div className="mono text-ink-faint text-[13px] pt-1 w-14">
                  0{i + 1}
                </div>
                <div>
                  <h3 className="display display-md text-[clamp(28px,3.4vw,44px)] mb-3">
                    {s.title}
                  </h3>
                  <p className="text-ink-mute text-[16px] leading-relaxed max-w-xl">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --- The band, explained ------------------------------------------- */}
      <section className="hairline">
        <div className="full-bleed max-w-[1400px] w-full mx-auto py-24 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="eyebrow mb-5">02 / The band</div>
            <h2 className="display display-md mb-6">
              Stay inside your band, <br /> or your pet forgets you.
            </h2>
            <p className="text-ink-mute text-[16px] leading-relaxed max-w-md">
              Each stage sits on a USD-denominated threshold. Drop below it,
              and your pet enters degraded mode — compute throttles, skills
              throttle, autonomy throttles. You keep your tokens. The
              intelligence just dims.
            </p>
            <div className="mt-10 grid grid-cols-5 gap-0 hairline hairline-b py-5">
              {BANDS.map((b, i) => (
                <div key={i} className="px-3 border-l border-hair first:border-l-0">
                  <div className="eyebrow-mute">{b.stage}</div>
                  <div className="display text-[clamp(18px,2vw,28px)] mt-2">
                    ${b.band}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative aspect-square max-w-md mx-auto w-full">
            <div className="absolute inset-0 rounded-full border border-hair" />
            <div className="absolute inset-10 rounded-full border border-hair" />
            <div className="absolute inset-20 rounded-full border border-hair" />
            <div className="absolute inset-32 rounded-full border border-hair" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-lime shadow-[0_0_60px_rgba(205,255,74,0.6)]" />
            </div>
            <span className="absolute top-4 left-1/2 -translate-x-1/2 eyebrow-mute">
              agi
            </span>
            <span className="absolute left-4 top-1/2 -translate-y-1/2 eyebrow-mute">
              sapient
            </span>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 eyebrow-mute">
              juvenile
            </span>
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 eyebrow-mute">
              hatchling
            </span>
          </div>
        </div>
      </section>

      {/* --- Big call-out --------------------------------------------------- */}
      <section className="full-bleed max-w-[1400px] w-full mx-auto py-24">
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-end">
          <h2 className="display display-lg">
            Something in there is <br />
            already <span className="bg-lime px-3">listening.</span>
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/eggs" className="btn btn-primary btn-xl">
              Enter the chamber <Arrow />
            </Link>
            <Link href="/choose" className="btn btn-xl">
              Pick an egg
            </Link>
          </div>
        </div>
      </section>
    </>
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

function StatRow({ k, v, sub }: { k: string; v: string; sub: string }) {
  return (
    <div>
      <div className="eyebrow-mute">{k}</div>
      <div className="display display-md text-[clamp(22px,2.4vw,36px)] mt-2">
        {v}
      </div>
      <div className="eyebrow-mute mt-1">{sub}</div>
    </div>
  );
}

function FloatingLabel({
  text,
  top,
  bottom,
  left,
  right,
}: {
  text: string;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}) {
  return (
    <span
      className="pin absolute hidden lg:inline-flex"
      style={{ top, bottom, left, right }}
    >
      <span>{text}</span>
    </span>
  );
}

const STEPS = [
  {
    title: "Commit AGI",
    body: "Buy from the fixed 100M supply. 2.5% routes to the compute treasury that pays the GPUs feeding your pet's brain.",
  },
  {
    title: "Earn fragments",
    body: "Egg fragments accrue while your wallet holds its band. They are soulbound. No markets. No bots. No buying your way in.",
  },
  {
    title: "Hatch & bond",
    body: "Burn one fragment, open an egg. Traits are rolled from a seed you choose. The creature inside remembers how you treat it.",
  },
  {
    title: "Evolve or dim",
    body: "Four stages up to AGI. Each one unlocks new skills: memory, tools, autonomy, multi-agent. Drop out of band and watch them dim.",
  },
];

const BANDS = [
  { stage: "egg", band: "0" },
  { stage: "hatchling", band: "25" },
  { stage: "juvenile", band: "100" },
  { stage: "sapient", band: "500" },
  { stage: "agi", band: "2,500" },
];
