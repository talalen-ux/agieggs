"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Egg } from "@/components/Egg";
import { EGG_CATALOG } from "@/lib/eggs";
import { useGame } from "@/components/StateProvider";
import { fmtUsd } from "@/lib/format";
import { STAGE_USD_THRESHOLD } from "@/lib/types";

const PRESETS = [25, 50, 100];
const HERO_IDS = ["stn-geode", "wd-maple", "aqua-shard", "hex-dome"] as const;

export default function EggChamberPage() {
  const { state, call } = useGame();
  const [tab, setTab] = useState<"buy" | "withdraw">("buy");
  const [preset, setPreset] = useState<number | "custom">(50);
  const [custom, setCustom] = useState<number>(50);
  const [sellAgi, setSellAgi] = useState<number>(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const amount = preset === "custom" ? custom : preset;
  const hero = useMemo(() => {
    const id = HERO_IDS[Math.floor(Date.now() / 60_000) % HERO_IDS.length];
    return EGG_CATALOG.find((e) => e.id === id)!;
  }, []);

  if (!state) return <div className="pad-x py-20 body-mute">Loading…</div>;

  const usdHeld = state.wallet.agi * state.supply.agiPriceUsd;
  const inBand = usdHeld >= STAGE_USD_THRESHOLD.hatchling;
  const fragments = state.wallet.eggs;
  const progress = Math.min(1, fragments);

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

  return (
    <section className="pad-x max-shell section-sm">
      <header className="mb-16">
        <div className="eyebrow-mute mb-4">Chamber</div>
        <h1 className="h-section max-w-xl">Commit AGI. Accrue fragments.</h1>
        <p className="body-mute mt-5 max-w-md">
          Fragments accrue only while your holdings sit at or above the band.
          One fragment hatches one egg.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-16 items-start">
        {/* --- Hero egg -------------------------------------------- */}
        <div className="flex flex-col items-center lg:items-start">
          <Egg egg={hero} size={360} drift />
          <div className="mt-8 eyebrow-mute">
            Dormant · fragment {fragments.toFixed(2)} / 1.00
          </div>
          <div className="mt-3 w-full max-w-sm meter">
            <span style={{ width: `${progress * 100}%` }} />
          </div>
        </div>

        {/* --- Buy / Withdraw ------------------------------------- */}
        <div>
          <div className="flex gap-8 rule-b pb-3 mb-6">
            <TabBtn active={tab === "buy"} onClick={() => setTab("buy")} label="Buy AGI" />
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
                <div className="text-[48px] font-semibold leading-none">
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

              <dl className="text-[14px] mb-8">
                <Row k="AGI price" v={fmtUsd(state.supply.agiPriceUsd)} />
                <Row k="Compute treasury" v="2.5% of purchase" />
              </dl>

              <button
                className="btn btn-primary btn-xl w-full justify-between"
                disabled={busy !== null || amount <= 0}
                onClick={buy}
              >
                <span>{busy === "buy" ? "Signing…" : "Buy AGI"}</span>
                <Arrow />
              </button>
              <p className="eyebrow-mute mt-4">
                Hold at least {fmtUsd(STAGE_USD_THRESHOLD.hatchling)} to begin
                accruing.
              </p>
            </>
          ) : (
            <>
              <div className="eyebrow-mute mb-2">You withdraw</div>
              <div className="text-[48px] font-semibold leading-none mb-6">
                {sellAgi.toLocaleString()}
                <span className="text-[18px] text-ink-mute ml-2 mono">AGI</span>
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
              <dl className="text-[14px] mb-8">
                <Row k="Returns" v={fmtUsd(sellAgi * state.supply.agiPriceUsd)} />
                <Row k="Tax" v="2.5%" />
              </dl>
              <button
                className="btn btn-primary btn-xl w-full justify-between"
                disabled={
                  busy !== null || sellAgi <= 0 || sellAgi > state.wallet.agi
                }
                onClick={sell}
              >
                <span>{busy === "sell" ? "Signing…" : "Withdraw"}</span>
                <Arrow />
              </button>
              <p className="eyebrow-mute mt-4">
                Dropping below your band degrades your pet.
              </p>
            </>
          )}

          {msg && <div className="mt-4 body-mute text-[13px]">{msg}</div>}
        </div>
      </div>

      {/* --- CTA + progress bar ------------------------------------ */}
      <div className="rule mt-24 pt-10 flex items-center justify-between gap-6 flex-wrap">
        <div>
          <div className="eyebrow-mute">Status</div>
          <div className="text-[22px] font-semibold mt-1">
            {inBand ? "In band · accruing" : "Below band · dormant"}
          </div>
        </div>
        <Link
          href="/choose"
          className={fragments >= 1 ? "btn btn-primary" : "btn"}
        >
          {fragments >= 1 ? "Choose your egg" : "Browse eggs"}
          <Arrow />
        </Link>
      </div>
    </section>
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
