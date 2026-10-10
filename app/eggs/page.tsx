"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Egg } from "@/components/Egg";
import {
  EGG_CATALOG,
  FAMILY_LABEL,
  type EggCatalogEntry,
} from "@/lib/eggs";
import { useGame } from "@/components/StateProvider";
import { fmtUsd } from "@/lib/format";
import { STAGE_USD_THRESHOLD } from "@/lib/types";

const PRESETS = [25, 50, 100];
const DEFAULT_EGG = "cr-emerald";

export default function ChamberPage() {
  return (
    <Suspense fallback={<div className="pad-x py-20 body-mute">Loading…</div>}>
      <ChamberInner />
    </Suspense>
  );
}

function ChamberInner() {
  const { state, call, refresh } = useGame();
  const router = useRouter();
  const search = useSearchParams();
  const [tab, setTab] = useState<"buy" | "withdraw">("buy");
  const [preset, setPreset] = useState<number | "custom">(50);
  const [custom, setCustom] = useState<number>(50);
  const [sellAgi, setSellAgi] = useState<number>(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const amount = preset === "custom" ? custom : preset;

  const egg: EggCatalogEntry = useMemo(() => {
    const id = search.get("egg") ?? DEFAULT_EGG;
    return EGG_CATALOG.find((e) => e.id === id) ?? EGG_CATALOG[0];
  }, [search]);

  if (!state) return <div className="pad-x py-20 body-mute">Loading…</div>;

  const usdHeld = state.wallet.agi * state.supply.agiPriceUsd;
  const inBand = usdHeld >= STAGE_USD_THRESHOLD.hatchling;
  const fragments = state.wallet.eggs;
  const progress = Math.min(1, fragments);
  const hasFragment = fragments >= 1;
  const capped = state.supply.petsMinted >= state.supply.petCap;
  const canHatch = hasFragment && inBand && !capped;

  async function buy() {
    setBusy("buy");
    setMsg(null);
    const r = await call("/api/buy", { usd: amount });
    if (!r.ok) setMsg(r.error ?? "Failed.");
    else setMsg(`Committed ${fmtUsd(amount)}.`);
    setBusy(null);
  }
  async function sell() {
    setBusy("sell");
    setMsg(null);
    const r = await call("/api/sell", { agi: sellAgi });
    if (!r.ok) setMsg(r.error ?? "Failed.");
    setBusy(null);
  }
  async function hatch() {
    if (!canHatch) return;
    setBusy("hatch");
    setErr(null);
    setOpening(true);
    try {
      // Short opening motion (shell coming to life) before commit
      await new Promise((r) => setTimeout(r, 450));
      const r = await call("/api/hatch", { seed: `egg:${egg.id}` });
      if (!r.ok) {
        setErr(r.error ?? "Hatching failed.");
        setBusy(null);
        setOpening(false);
        return;
      }
      await refresh();
      router.push("/chat");
    } catch (e) {
      setErr((e as Error).message);
      setBusy(null);
      setOpening(false);
    }
  }

  return (
    <section className="pad-x max-shell section-sm">
      <header className="mb-10 md:mb-14">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="eyebrow-mute">Chamber</div>
          <Link href="/choose" className="btn-link text-[13px]">
            ← Back to Discover
          </Link>
        </div>
        <h1 className="h-section max-w-xl">{egg.name}</h1>
        <p className="body-mute mt-5 max-w-md">{egg.description}</p>
      </header>

      {/* ---------- Main grid: egg | details | controls ---------- */}
      <div className="grid lg:grid-cols-[auto_1fr_minmax(320px,auto)] gap-10 lg:gap-14 items-start">
        {/* Egg */}
        <div className="flex flex-col items-center lg:items-start chamber-egg-wrap">
          <div className={opening ? "egg-open" : "egg-drift"}>
            <Egg egg={egg} size={320} />
          </div>
        </div>

        {/* Verified attributes */}
        <div>
          <dl className="grid grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-6 max-w-md">
            <Attr k="Family" v={FAMILY_LABEL[egg.family]} />
            <Attr k="Theme" v={egg.theme} />
            <Attr k="Identifier" v={egg.id} mono />
            <Attr k="Fragments to hatch" v="1" />
            <Attr
              k="Holding minimum"
              v={fmtUsd(STAGE_USD_THRESHOLD.hatchling)}
            />
            <Attr
              k="Status"
              v={inBand ? "In band" : "Below band"}
              dot={inBand ? "ok" : "warn"}
            />
          </dl>

          {/* Fragment progress — the step the Chamber primarily serves */}
          <div className="mt-10 max-w-md">
            <div className="flex items-end justify-between mb-2">
              <div>
                <div className="eyebrow-mute">Your fragments</div>
                <div className="mt-1">
                  <span className="text-[28px] font-semibold">
                    {fragments.toFixed(2)}
                  </span>
                  <span className="ml-2 text-ink-mute">/ 1.00</span>
                </div>
              </div>
              <span className="mono text-ink-mute text-[12px]">
                {Math.round(progress * 100)}%
              </span>
            </div>
            <div className="meter">
              <span style={{ width: `${progress * 100}%` }} />
            </div>
            <p className="eyebrow-mute mt-3">
              {hasFragment
                ? "Ready to hatch."
                : inBand
                  ? "Accruing in band."
                  : "Need in-band holdings to accrue."}
            </p>
          </div>

          {/* Hatch — the terminal action for this egg */}
          <div className="mt-10 flex items-start gap-5 flex-wrap">
            <button
              type="button"
              onClick={hatch}
              disabled={!canHatch || busy !== null}
              className="btn btn-primary btn-xl"
            >
              {busy === "hatch" ? "Hatching…" : "Hatch & bond"}
              <Arrow />
            </button>
            <div className="max-w-xs">
              {!canHatch && (
                <p className="body-mute text-[13px]">
                  {capped
                    ? "The protocol has reached its 5,000-pet cap."
                    : !hasFragment
                      ? "You need 1.00 fragments. Commit AGI below and let one fragment accrue."
                      : `Hold at least ${fmtUsd(STAGE_USD_THRESHOLD.hatchling)} of AGI to be eligible.`}
                </p>
              )}
              {canHatch && (
                <p className="body-mute text-[13px]">
                  Hatching uses one fragment and cannot be reversed. You'll
                  meet your pet on the next screen.
                </p>
              )}
              {err && (
                <p role="alert" className="text-[13px] text-ink mt-2">
                  {err}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Buy / Withdraw card */}
        <div className="card p-6 lg:p-7 w-full">
          <div className="flex gap-6 rule-b pb-3 mb-6">
            <TabBtn
              active={tab === "buy"}
              onClick={() => setTab("buy")}
              label="Buy AGI"
            />
            <TabBtn
              active={tab === "withdraw"}
              onClick={() => setTab("withdraw")}
              label="Withdraw"
            />
          </div>

          {tab === "buy" ? (
            <>
              <div className="eyebrow-mute mb-2">You pay</div>
              <div className="flex items-end gap-3 mb-6">
                <div className="text-[40px] font-semibold leading-none">
                  ${preset === "custom" ? custom : preset}
                </div>
                <div className="eyebrow-mute pb-2">USD</div>
              </div>

              <div className="flex gap-2 flex-wrap mb-6">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    className={`chip ${preset === p ? "on" : ""}`}
                    onClick={() => setPreset(p)}
                  >
                    ${p}
                  </button>
                ))}
                <button
                  className={`chip ${preset === "custom" ? "on" : ""}`}
                  onClick={() => setPreset("custom")}
                >
                  Custom
                </button>
              </div>

              {preset === "custom" && (
                <input
                  type="number"
                  min={1}
                  max={100_000}
                  value={custom}
                  onChange={(e) => setCustom(Number(e.target.value))}
                  className="mb-6"
                  placeholder="USD amount"
                />
              )}

              <dl className="text-[14px] mb-6">
                <Row k="AGI price" v={fmtUsd(state.supply.agiPriceUsd)} />
                <Row k="Compute treasury" v="2.5% of purchase" />
              </dl>

              <button
                className="btn btn-primary w-full justify-between"
                disabled={busy !== null || amount <= 0}
                onClick={buy}
              >
                <span>{busy === "buy" ? "Signing…" : "Buy AGI"}</span>
                <Arrow />
              </button>
              <p className="eyebrow-mute mt-3">
                Hold at least {fmtUsd(STAGE_USD_THRESHOLD.hatchling)} to begin
                accruing.
              </p>
            </>
          ) : (
            <>
              <div className="eyebrow-mute mb-2">You withdraw</div>
              <div className="text-[40px] font-semibold leading-none mb-6">
                {sellAgi.toLocaleString()}
                <span className="text-[16px] text-ink-mute ml-2 mono">AGI</span>
              </div>
              <input
                type="number"
                min={0}
                max={state.wallet.agi}
                value={sellAgi}
                onChange={(e) => setSellAgi(Number(e.target.value))}
                placeholder="AGI amount"
                className="mb-6"
              />
              <dl className="text-[14px] mb-6">
                <Row k="Returns" v={fmtUsd(sellAgi * state.supply.agiPriceUsd)} />
                <Row k="Tax" v="2.5%" />
              </dl>
              <button
                className="btn btn-primary w-full justify-between"
                disabled={
                  busy !== null || sellAgi <= 0 || sellAgi > state.wallet.agi
                }
                onClick={sell}
              >
                <span>{busy === "sell" ? "Signing…" : "Withdraw"}</span>
                <Arrow />
              </button>
              <p className="eyebrow-mute mt-3">
                Dropping below your band degrades your pet.
              </p>
            </>
          )}

          {msg && <div className="mt-4 body-mute text-[13px]">{msg}</div>}
        </div>
      </div>
    </section>
  );
}

function Attr({
  k,
  v,
  mono,
  dot,
}: {
  k: string;
  v: string;
  mono?: boolean;
  dot?: "ok" | "warn";
}) {
  return (
    <div>
      <dt className="eyebrow-mute">{k}</dt>
      <dd className={`mt-1 text-[16px] flex items-center gap-2 ${mono ? "mono" : ""}`}>
        {dot && (
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: dot === "ok" ? "#CDFF4A" : "#0A0A0A" }}
            aria-label={dot === "ok" ? "ok" : "warning"}
          />
        )}
        {v}
      </dd>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between py-2 rule-b last:border-0">
      <dt className="text-ink-mute">{k}</dt>
      <dd className="mono">{v}</dd>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`pb-2 text-[14px] font-semibold transition-colors ${
        active ? "text-ink border-b-2 border-ink" : "text-ink-mute"
      }`}
    >
      {label}
    </button>
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
