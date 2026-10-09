"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Egg } from "@/components/Egg";
import { EGG_CATALOG, type EggCatalogEntry } from "@/lib/eggs";
import { useGame } from "@/components/StateProvider";
import { fmtUsd } from "@/lib/format";
import { STAGE_USD_THRESHOLD } from "@/lib/types";

const FAMILIES: { key: "all" | EggCatalogEntry["family"]; label: string }[] = [
  { key: "all", label: "All" },
  { key: "aqua", label: "Aqua" },
  { key: "industrial", label: "Industrial" },
  { key: "hex", label: "Hex" },
  { key: "fantasy", label: "Fantasy" },
];

const RARITY_ORDER: Record<EggCatalogEntry["rarity"], number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  mythic: 3,
};

export default function ChooseEggPage() {
  const router = useRouter();
  const { state, call, refresh } = useGame();
  const [family, setFamily] = useState<"all" | EggCatalogEntry["family"]>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = family === "all"
      ? EGG_CATALOG
      : EGG_CATALOG.filter((e) => e.family === family);
    return [...list].sort(
      (a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity],
    );
  }, [family]);

  if (!state) return <div className="container-pad">loading…</div>;

  const usd = state.wallet.agi * state.supply.agiPriceUsd;
  const inBand = usd >= STAGE_USD_THRESHOLD.hatchling;
  const hasEgg = state.wallet.eggs >= 1;
  const capped = state.supply.petsMinted >= state.supply.petCap;
  const canHatch = inBand && hasEgg && !capped && selected !== null;

  const picked = selected
    ? EGG_CATALOG.find((e) => e.id === selected) ?? null
    : null;

  async function hatch() {
    if (!selected) return;
    setBusy(true);
    setMsg(null);
    const r = await call("/api/hatch", { seed: `egg:${selected}` });
    if (!r.ok) {
      setMsg(r.error ?? "failed");
      setBusy(false);
      return;
    }
    await refresh();
    router.push("/chat");
  }

  return (
    <section className="full-bleed max-w-[1400px] w-full mx-auto pt-6 pb-24">
      <div className="eyebrow mb-6">02 / Choose your egg</div>

      <header className="grid lg:grid-cols-[1.4fr_1fr] gap-10 items-end mb-10">
        <h1 className="display display-xl">
          Pick the shell <br />
          you'll <span className="bg-lime px-3">live with.</span>
        </h1>
        <p className="text-ink-mute text-[17px] leading-relaxed max-w-md">
          Each shell seeds a different personality. Traits lock at hatch,
          but how your pet grows after that is yours. Choose one. Pay with
          one fragment.
        </p>
      </header>

      {/* Precondition banner */}
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

      {/* Family filter */}
      <div className="flex items-center gap-2 flex-wrap mb-10">
        {FAMILIES.map((f) => (
          <button
            key={f.key}
            onClick={() => setFamily(f.key)}
            className={`chip ${family === f.key ? "on" : ""}`}
          >
            {f.label}
          </button>
        ))}
        <span className="eyebrow-mute ml-auto">
          {filtered.length} designs
        </span>
      </div>

      {/* Shelf */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
        {filtered.map((e) => {
          const isSel = selected === e.id;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => setSelected(e.id)}
              className={`relative text-left rounded-2xl p-4 transition-all duration-200 ${
                isSel
                  ? "bg-white ring-2 ring-ink -translate-y-1 shadow-[0_14px_40px_-10px_rgba(0,0,0,0.18)]"
                  : "hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between eyebrow-mute">
                <span>{e.family}</span>
                <span className="mono">{e.rarity}</span>
              </div>
              <div className="flex items-center justify-center py-4">
                <Egg egg={e} size={150} />
              </div>
              <div className="hairline pt-3">
                <div className="display text-[18px] font-semibold tracking-tightest">
                  {e.name}
                </div>
                <p className="text-[12px] text-ink-mute mt-1 leading-relaxed min-h-[48px]">
                  {e.flavor}
                </p>
              </div>
              <div
                className={`mt-3 text-[11px] uppercase tracking-widest text-center font-semibold py-1.5 rounded-full ${
                  isSel ? "bg-ink text-white" : "bg-hair-soft text-ink-mute"
                }`}
              >
                {isSel ? "selected" : "select"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Sticky confirm bar */}
      <div className="sticky bottom-4 mt-14 z-10">
        <div className="card flex flex-wrap items-center justify-between gap-5 p-5 bg-white/90 backdrop-blur">
          <div className="flex items-center gap-5">
            {picked ? (
              <Egg egg={picked} size={72} />
            ) : (
              <div className="w-16 h-20 rounded-xl border border-dashed border-hair" />
            )}
            <div>
              <div className="eyebrow-mute">confirm hatch</div>
              <div className="display text-[22px] font-semibold tracking-tightest mt-1">
                {picked ? `${picked.name} · ${picked.family}` : "No shell selected"}
              </div>
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
        {msg && <div className="text-[13px] text-ink-mute mt-3 pl-2">{msg}</div>}
      </div>
    </section>
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
