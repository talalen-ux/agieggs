"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Egg } from "@/components/Egg";
import {
  EGG_CATALOG,
  FAMILIES,
  FAMILY_LABEL,
  type EggCatalogEntry,
  type EggFamily,
} from "@/lib/eggs";
import { useGame } from "@/components/StateProvider";
import { fmtUsd } from "@/lib/format";
import { STAGE_USD_THRESHOLD } from "@/lib/types";

const STORAGE_KEY = "agi.pets.choose.v1";
type Stored = { family: "all" | EggFamily; selected: string | null; scrollY: number };

export default function ChoosePage() {
  const router = useRouter();
  const { state, call, refresh } = useGame();

  // --- Persisted state so returning from /chat restores shelf + selection
  const [hydrated, setHydrated] = useState(false);
  const [family, setFamily] = useState<"all" | EggFamily>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Stored;
        if (s.family) setFamily(s.family);
        if (s.selected) setSelected(s.selected);
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
        const s: Stored = { family, selected, scrollY: window.scrollY };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      } catch {}
    };
    save();
    window.addEventListener("beforeunload", save);
    return () => window.removeEventListener("beforeunload", save);
  }, [hydrated, family, selected]);

  const filtered = useMemo(
    () =>
      family === "all"
        ? EGG_CATALOG
        : EGG_CATALOG.filter((e) => e.family === family),
    [family],
  );

  const picked: EggCatalogEntry | null = selected
    ? (EGG_CATALOG.find((e) => e.id === selected) ?? null)
    : null;

  if (!state) return <div className="pad-x py-20 body-mute">Loading…</div>;

  const usd = state.wallet.agi * state.supply.agiPriceUsd;
  const inBand = usd >= STAGE_USD_THRESHOLD.hatchling;
  const hasFragment = state.wallet.eggs >= 1;
  const capped = state.supply.petsMinted >= state.supply.petCap;

  // conditions that must be true for the hatch button to be usable
  const canConfirm = Boolean(picked) && inBand && hasFragment && !capped && !busy;

  const unavailableReason = capped
    ? "The protocol has reached its 5,000-pet cap."
    : !hasFragment
      ? "You need 1.00 egg fragments. Fragments accrue while in band."
      : !inBand
        ? `You must hold at least ${fmtUsd(STAGE_USD_THRESHOLD.hatchling)} of AGI to be eligible to hatch.`
        : null;

  function selectEgg(id: string) {
    setSelected(id);
    // nudge the detail panel into view, respecting reduced motion
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "nearest",
      });
    });
  }

  async function confirmHatch() {
    if (!picked) return;
    setBusy(true);
    setErr(null);
    // play the restrained opening motion, then commit
    setOpening(picked.id);
    try {
      await new Promise((r) => setTimeout(r, 450));
      const r = await call("/api/hatch", { seed: `egg:${picked.id}` });
      if (!r.ok) {
        setErr(r.error ?? "Hatching failed.");
        setBusy(false);
        setOpening(null);
        return;
      }
      await refresh();
      router.push("/chat");
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
      setOpening(null);
    }
  }

  return (
    <section className="pad-x max-shell section-sm">
      <header className="mb-16">
        <h1 className="h-section max-w-xl">Choose your egg.</h1>
        <p className="body-mute mt-5 max-w-md">
          Thirty-six shells. Each will hatch into a different pet. Selection
          doesn't spend anything on its own — you can change your mind before
          you confirm.
        </p>
      </header>

      {/* --- Filters -------------------------------------------------- */}
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

      {/* --- Grid ----------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-14">
        {filtered.map((e) => {
          const isSel = selected === e.id;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => selectEgg(e.id)}
              aria-pressed={isSel}
              className={`group relative flex flex-col items-center text-center pt-8 pb-6 rounded-2xl transition-[border-color,background-color] duration-150 ${
                isSel
                  ? "border border-ink bg-white"
                  : "border border-transparent hover:border-hair"
              }`}
            >
              {isSel && <span className="sel-marker" aria-hidden />}
              <Egg egg={e} size={200} />
              <div className="mt-6 flex items-center gap-2">
                {isSel && (
                  <span
                    aria-hidden
                    className="w-1 h-4 rounded-sm"
                    style={{ background: "#CDFF4A" }}
                  />
                )}
                <span className="font-semibold text-[17px]">{e.name}</span>
              </div>
              <span className="eyebrow-mute mt-1">{FAMILY_LABEL[e.family]}</span>
            </button>
          );
        })}
      </div>

      {/* --- Inline detail panel ------------------------------------- */}
      <div ref={detailRef} className="mt-20 scroll-mt-32">
        {picked ? (
          <div
            key={picked.id}
            className="enter grid lg:grid-cols-[auto_1fr_auto] items-start gap-10 rule pt-10"
          >
            <div className="flex justify-center">
              <div
                className={opening === picked.id ? "egg-open" : "egg-drift"}
                style={{ display: "inline-block" }}
              >
                <Egg egg={picked} size={260} />
              </div>
            </div>

            <div>
              <div className="eyebrow-mute">
                {FAMILY_LABEL[picked.family]} · {picked.theme}
              </div>
              <h2 className="h-sub mt-3">{picked.name}</h2>
              <p className="body mt-4 max-w-md">{picked.description}</p>

              <dl className="mt-8 grid grid-cols-2 gap-x-10 gap-y-4 max-w-md">
                <AttrRow k="Id" v={picked.id} mono />
                <AttrRow k="Family" v={FAMILY_LABEL[picked.family]} />
                <AttrRow k="Fragments" v="1" sub="to hatch" />
                <AttrRow
                  k="Holding"
                  v={fmtUsd(STAGE_USD_THRESHOLD.hatchling)}
                  sub="minimum"
                />
              </dl>
            </div>

            <div className="flex flex-col items-start gap-4 lg:items-end lg:text-right">
              <button
                type="button"
                onClick={confirmHatch}
                disabled={!canConfirm}
                className="btn btn-primary btn-xl"
                aria-describedby={unavailableReason ? "unavailable-reason" : undefined}
              >
                {busy ? "Hatching…" : "Hatch & bond"}
                <Arrow />
              </button>
              {unavailableReason && (
                <p
                  id="unavailable-reason"
                  className="body-mute text-[13px] max-w-xs"
                >
                  {unavailableReason}{" "}
                  <Link href="/eggs" className="underline underline-offset-2">
                    Open chamber
                  </Link>
                </p>
              )}
              {!unavailableReason && (
                <p className="body-mute text-[13px] max-w-xs">
                  You can change your pick until you confirm. Hatching uses one
                  fragment and cannot be reversed.
                </p>
              )}
              {err && (
                <p role="alert" className="text-[13px] text-ink">
                  {err}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="rule pt-10 body-mute text-center">
            Select a shell above to see its details.
          </div>
        )}
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

function AttrRow({
  k,
  v,
  sub,
  mono,
}: {
  k: string;
  v: string;
  sub?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="eyebrow-mute">{k}</dt>
      <dd className={`mt-1 text-[15px] ${mono ? "mono" : ""}`}>
        {v}
        {sub && <span className="text-ink-mute text-[13px] ml-2">{sub}</span>}
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
