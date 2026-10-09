"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Egg, type EggVariant } from "@/components/Egg";
import { useGame } from "@/components/StateProvider";
import { fmtUsd } from "@/lib/format";
import { STAGE_USD_THRESHOLD } from "@/lib/types";
import { hashSeed, rng, rollTraits } from "@/lib/pet";

const EGG_SHELFS: {
  variant: EggVariant;
  label: string;
  flavor: string;
}[] = [
  {
    variant: "shell",
    label: "Pale Draft",
    flavor: "Standard draw. Common temperaments, broad trait spread.",
  },
  {
    variant: "ink",
    label: "Ink Void",
    flavor: "Dark shell. Biases toward mischief + weirdness. Rarer patterns.",
  },
  {
    variant: "lime",
    label: "Chlor-9",
    flavor: "Lime seam amplified. Biases toward curiosity + discipline.",
  },
  {
    variant: "blush",
    label: "Warm Null",
    flavor: "Rose-shelled. Biases toward warmth. Softer first words.",
  },
  {
    variant: "smoke",
    label: "Smoke Index",
    flavor: "Ash-grey. Flat trait distribution — the lottery egg.",
  },
];

export default function ChooseEggPage() {
  const router = useRouter();
  const { state, call, refresh } = useGame();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Precompute three preview seeds (regenerate on page nav / full reload).
  const previews = useMemo(() => {
    const base = `${Date.now()}:${Math.random()}`;
    return EGG_SHELFS.slice(0, 5).map((e, i) => {
      const seed = `${base}:${e.variant}:${i}`;
      const t = rollTraits(seed);
      const n = pickName(seed);
      return { ...e, seed, traits: t, name: n };
    });
  }, []);

  if (!state) return <div className="container-pad">loading…</div>;

  const usd = state.wallet.agi * state.supply.agiPriceUsd;
  const inBand = usd >= STAGE_USD_THRESHOLD.hatchling;
  const hasEgg = state.wallet.eggs >= 1;
  const capped = state.supply.petsMinted >= state.supply.petCap;

  const canHatch = inBand && hasEgg && !capped && selectedIdx !== null;

  async function hatch() {
    if (selectedIdx === null) return;
    setBusy(true);
    setMsg(null);
    const chosen = previews[selectedIdx];
    const r = await call("/api/hatch", { seed: chosen.seed });
    if (!r.ok) {
      setMsg(r.error ?? "failed");
      setBusy(false);
      return;
    }
    await refresh();
    router.push("/chat");
  }

  return (
    <section className="full-bleed max-w-[1400px] w-full mx-auto pt-6 pb-20">
      <div className="eyebrow mb-6">02 / Choose your egg</div>

      <header className="grid lg:grid-cols-[1.4fr_1fr] gap-10 items-end mb-14">
        <h1 className="display display-xl">
          Pick the shell <br />
          you'll <span className="bg-lime px-3">live with.</span>
        </h1>
        <p className="text-ink-mute text-[17px] leading-relaxed max-w-md">
          Each shell seeds a different personality distribution. Traits are
          locked at hatch, but how your pet grows after that is yours.
          Choose one. Pay with one fragment.
        </p>
      </header>

      {/* --- Precondition banner ----------------------------------------- */}
      {(!hasEgg || !inBand || capped) && (
        <div className="hairline hairline-b py-4 mb-10 flex flex-wrap items-center gap-4 justify-between">
          <div className="text-[14px] text-ink-mute">
            {capped
              ? "The protocol is sealed. 5,000 pets have hatched."
              : !inBand
                ? `Hold at least ${fmtUsd(STAGE_USD_THRESHOLD.hatchling)} of AGI to be eligible to hatch.`
                : "You need 1.00 egg fragments. Fragments accrue while in-band."}
          </div>
          <Link href="/eggs" className="btn">
            Go to Egg Chamber <Arrow />
          </Link>
        </div>
      )}

      {/* --- The shelf --------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {previews.map((p, i) => {
          const selected = selectedIdx === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIdx(i)}
              className={`card p-5 text-left transition-all duration-200 ${
                selected
                  ? "border-ink -translate-y-1 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.15)]"
                  : "hover:border-ink/60"
              }`}
            >
              <div className="eyebrow-mute flex items-center justify-between">
                <span>egg · 00{i + 1}</span>
                <span className="mono">{p.traits.rarity}</span>
              </div>
              <div className="flex items-center justify-center py-6">
                <Egg
                  variant={p.variant}
                  width={160}
                  height={220}
                  shimmer={p.traits.rarity === "mythic"}
                />
              </div>
              <div className="hairline pt-4">
                <div className="display text-[20px] font-semibold tracking-tightest">
                  {p.label}
                </div>
                <div className="eyebrow-mute mt-1">codename · {p.name}</div>
                <p className="text-[13px] text-ink-mute mt-3 min-h-[52px] leading-relaxed">
                  {p.flavor}
                </p>
                <div className="grid grid-cols-5 gap-1 mt-4">
                  {TRAIT_KEYS.map((k) => (
                    <TraitTick
                      key={k}
                      label={k[0]}
                      value={p.traits[k] as number}
                    />
                  ))}
                </div>
              </div>
              <div
                className={`mt-5 text-[12px] uppercase tracking-widest text-center font-semibold py-2 rounded-full ${
                  selected
                    ? "bg-ink text-white"
                    : "bg-hair-soft text-ink-mute"
                }`}
              >
                {selected ? "selected" : "select"}
              </div>
            </button>
          );
        })}
      </div>

      {/* --- Confirm bar ------------------------------------------------- */}
      <div className="sticky bottom-4 mt-16">
        <div className="card flex flex-wrap items-center justify-between gap-5 p-5">
          <div>
            <div className="eyebrow-mute">confirm hatch</div>
            <div className="display text-[22px] font-semibold tracking-tightest mt-1">
              {selectedIdx !== null
                ? `${previews[selectedIdx].label} · ${previews[selectedIdx].name}`
                : "No shell selected"}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="eyebrow-mute">cost</div>
              <div className="mono text-ink">1 fragment</div>
            </div>
            <button
              onClick={hatch}
              className="btn btn-primary btn-xl"
              disabled={!canHatch || busy}
            >
              {busy ? "Hatching…" : "Hatch & bond"}
              <Arrow />
            </button>
          </div>
        </div>
        {msg && (
          <div className="text-[13px] text-ink-mute mt-3 pl-2">{msg}</div>
        )}
      </div>
    </section>
  );
}

const TRAIT_KEYS = [
  "curiosity",
  "warmth",
  "mischief",
  "discipline",
  "weirdness",
] as const;

function TraitTick({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-full h-10 bg-hair-soft rounded relative overflow-hidden">
        <div
          className="absolute bottom-0 left-0 right-0 bg-ink"
          style={{ height: `${value}%` }}
        />
      </div>
      <span className="eyebrow-mute text-[9px]">{label}</span>
    </div>
  );
}

/** cheap deterministic namer for previews only. */
function pickName(seed: string): string {
  const r = rng(hashSeed(seed + ":preview"));
  const a = ["Ash", "Vex", "Mochi", "Null", "Pim", "Argo", "Ciel", "Zen"];
  const b = ["-9", "ko", "ra", "us", "iel", "io"];
  return a[Math.floor(r() * a.length)] + b[Math.floor(r() * b.length)];
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
