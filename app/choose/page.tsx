"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Egg } from "@/components/Egg";
import {
  EGG_CATALOG,
  FAMILIES,
  FAMILY_LABEL,
  type EggFamily,
} from "@/lib/eggs";
import { useGame } from "@/components/StateProvider";
import { HATCH_HOLDINGS_USD } from "@/lib/economics";
import { fmtUsd } from "@/lib/format";

const STORAGE_KEY = "agi.pets.discover.v2";
type Stored = { family: "all" | EggFamily; scrollY: number };

export default function DiscoverPage() {
  const router = useRouter();
  const { state } = useGame();
  const [family, setFamily] = useState<"all" | EggFamily>("all");
  const [hovered, setHovered] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const usdHeld = state
    ? state.wallet.agi * state.supply.agiPriceUsd
    : 0;
  const eligible = usdHeld >= HATCH_HOLDINGS_USD;

  // Rehydrate filter + scroll
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Stored;
        if (s.family) setFamily(s.family);
        if (typeof s.scrollY === "number") {
          requestAnimationFrame(() => window.scrollTo(0, s.scrollY));
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const save = () => {
      try {
        const s: Stored = { family, scrollY: window.scrollY };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      } catch {}
    };
    save();
    window.addEventListener("beforeunload", save);
    return () => window.removeEventListener("beforeunload", save);
  }, [hydrated, family]);

  const filtered = useMemo(
    () =>
      family === "all"
        ? EGG_CATALOG
        : EGG_CATALOG.filter((e) => e.family === family),
    [family],
  );

  function openEgg(id: string) {
    // persist scroll before navigating so coming back lands in the same place
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ family, scrollY: window.scrollY }),
      );
    } catch {}
    router.push(`/eggs?egg=${encodeURIComponent(id)}`);
  }

  return (
    <section className="pad-x max-shell section-sm">
      <header className="mb-16 max-w-xl">
        <div className="eyebrow-mute mb-4">Discover</div>
        <h1 className="h-section">
          Pick a shell. Contribute {fmtUsd(HATCH_HOLDINGS_USD)}. Hatch.
        </h1>
        <p className="body-mute mt-5 max-w-md">
          Browse the full collection. Contribute at least{" "}
          {fmtUsd(HATCH_HOLDINGS_USD)} of AGI to be eligible to hatch — open any
          shell to review its details in the chamber.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 eyebrow-mute">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: eligible ? "#CDFF4A" : "#737373" }}
            aria-hidden
          />
          {eligible
            ? "You are eligible to hatch."
            : `Hold ${fmtUsd(Math.max(0, HATCH_HOLDINGS_USD - usdHeld))} more to qualify.`}
        </div>
      </header>

      {/* Filters */}
      <div
        role="tablist"
        aria-label="Filter eggs by family"
        className="flex items-center gap-2 flex-wrap mb-12"
      >
        <FilterChip
          label="All"
          active={family === "all"}
          count={EGG_CATALOG.length}
          onClick={() => setFamily("all")}
        />
        {FAMILIES.map((f) => (
          <FilterChip
            key={f}
            label={FAMILY_LABEL[f]}
            active={family === f}
            count={EGG_CATALOG.filter((e) => e.family === f).length}
            onClick={() => setFamily(f)}
          />
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-14">
        {filtered.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => openEgg(e.id)}
            onMouseEnter={() => setHovered(e.id)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(e.id)}
            onBlur={() => setHovered(null)}
            aria-label={`Open ${e.name}`}
            className={`group relative flex flex-col items-center text-center pt-8 pb-6 rounded-2xl transition-[border-color,background-color,transform] duration-150 ${
              hovered === e.id
                ? "border border-ink bg-white -translate-y-0.5"
                : "border border-transparent"
            }`}
          >
            {hovered === e.id && <span className="sel-marker" aria-hidden />}
            <Egg egg={e} size={220} />
            <div className="mt-6 font-semibold text-[17px]">{e.name}</div>
            <div className="eyebrow-mute mt-1">{FAMILY_LABEL[e.family]}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

function FilterChip({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`chip ${active ? "on" : ""}`}
    >
      <span>{label}</span>
      <span className="ml-2 mono text-[11px] opacity-60">
        {String(count).padStart(2, "0")}
      </span>
    </button>
  );
}
