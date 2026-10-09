"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Egg } from "@/components/Egg";
import { useGame } from "@/components/StateProvider";
import { fmtUsd } from "@/lib/format";
import { STAGE_USD_THRESHOLD } from "@/lib/types";

const PRESETS = [25, 50, 100];

export default function EggChamberPage() {
  const { state, call } = useGame();
  const [tab, setTab] = useState<"buy" | "withdraw">("buy");
  const [preset, setPreset] = useState<number | "custom">(50);
  const [custom, setCustom] = useState<number>(50);
  const [sellAgi, setSellAgi] = useState<number>(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const amount = preset === "custom" ? custom : preset;

  if (!state) return <div className="container-pad">loading…</div>;

  const usdHeld = state.wallet.agi * state.supply.agiPriceUsd;
  const inBand = usdHeld >= STAGE_USD_THRESHOLD.hatchling;
  const eggs = state.wallet.eggs;
  const progress = Math.min(1, eggs);

  async function buy() {
    setBusy("buy");
    setMsg(null);
    const r = await call("/api/buy", { usd: amount });
    if (!r.ok) setMsg(r.error ?? "failed");
    else setMsg(`Committed ${fmtUsd(amount)} to the chamber.`);
    setBusy(null);
  }
  async function sell() {
    setBusy("sell");
    setMsg(null);
    const r = await call("/api/sell", { agi: sellAgi });
    if (!r.ok) setMsg(r.error ?? "failed");
    setBusy(null);
  }

  return (
    <section className="full-bleed max-w-[1400px] w-full mx-auto pt-6 pb-16">
      <div className="eyebrow mb-6">01 / Egg Chamber</div>

      {/* ----------------------------------------------------------------
       * Primary grid — headline + egg + buy card
       * ---------------------------------------------------------------- */}
      <div className="grid lg:grid-cols-[1.1fr_0.9fr_0.9fr] gap-10 items-start min-h-[70vh]">
        {/* Column 1 — headline */}
        <div className="pt-4 lg:pt-8">
          <h1 className="display display-xl">
            Life <br />
            starts with <br />
            <span className="relative inline-block">
              commitment
              <svg
                aria-hidden
                viewBox="0 0 320 18"
                className="absolute left-0 -bottom-2 w-full"
              >
                <path
                  d="M2 14 C 80 2, 240 2, 318 14"
                  stroke="#CDFF4A"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="text-ink">.</span>
          </h1>
          <p className="mt-8 text-ink-mute max-w-sm leading-relaxed">
            Hold AGI within your band. Collect fragments. Reach 1.0 to become
            eligible to hatch.
          </p>
        </div>

        {/* Column 2 — the egg itself */}
        <div className="relative flex justify-center">
          <Egg
            variant="shell"
            width={360}
            height={480}
            rulers
            className="animate-float"
          />
          <PinLabel top="18%" right="-16%" text="dormant" />
          <PinLabel bottom="8%" left="-10%" text="incubation / 000" />
        </div>

        {/* Column 3 — buy/withdraw card */}
        <div className="card p-6 lg:p-7">
          <div className="flex items-center justify-between hairline-b pb-4 mb-5">
            <h3 className="display text-[22px] font-semibold tracking-tightest">
              Start your chamber
            </h3>
          </div>

          <div className="flex gap-6 mb-6 hairline-b pb-4">
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
              <div className="flex items-end gap-3 mb-5">
                <div className="display text-[56px] font-semibold leading-none">
                  ${preset === "custom" ? custom : preset}
                </div>
                <div className="eyebrow-mute pb-2">USD</div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-5">
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
                  className="mb-5"
                  placeholder="USD"
                />
              )}

              <div className="hairline py-3 flex items-center justify-between text-[14px]">
                <span className="text-ink-mute">AGI price</span>
                <span className="mono">
                  {fmtUsd(state.supply.agiPriceUsd)}
                </span>
              </div>
              <div className="hairline py-3 flex items-center justify-between text-[14px]">
                <span className="text-ink-mute">Compute treasury</span>
                <span className="mono">2.5% of purchase</span>
              </div>

              <button
                className="btn btn-primary btn-xl w-full justify-between mt-4"
                disabled={busy !== null || amount <= 0}
                onClick={buy}
              >
                <span>{busy === "buy" ? "Signing…" : "Buy AGI"}</span>
                <Arrow />
              </button>
              <div className="eyebrow-mute mt-3">
                Hold at least {fmtUsd(STAGE_USD_THRESHOLD.hatchling)} to begin
                accruing.
              </div>
            </>
          ) : (
            <>
              <div className="eyebrow-mute mb-2">You withdraw</div>
              <div className="display text-[56px] font-semibold leading-none mb-5">
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
                className="mb-5"
              />
              <div className="hairline py-3 flex items-center justify-between text-[14px]">
                <span className="text-ink-mute">Returns</span>
                <span className="mono">
                  {fmtUsd(sellAgi * state.supply.agiPriceUsd)}
                </span>
              </div>
              <div className="hairline py-3 flex items-center justify-between text-[14px]">
                <span className="text-ink-mute">Tax</span>
                <span className="mono">2.5%</span>
              </div>
              <button
                className="btn btn-primary btn-xl w-full justify-between mt-4"
                disabled={
                  busy !== null || sellAgi <= 0 || sellAgi > state.wallet.agi
                }
                onClick={sell}
              >
                <span>{busy === "sell" ? "Signing…" : "Withdraw"}</span>
                <Arrow />
              </button>
              <div className="eyebrow-mute mt-3 text-ink">
                Dropping below your band degrades your pet.
              </div>
            </>
          )}

          {msg && (
            <div className="mt-4 text-[13px] text-ink-mute">{msg}</div>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------------
       * Fragment progress bar + hatch CTA
       * ---------------------------------------------------------------- */}
      <div className="hairline mt-14 pt-8 grid lg:grid-cols-[auto_1fr_auto] items-center gap-8">
        <div>
          <div className="display text-[56px] font-semibold leading-none">
            {eggs.toFixed(2)}
            <span className="text-ink-mute text-[16px] font-normal ml-3">
              / 1.00 fragments
            </span>
          </div>
          <div className="eyebrow-mute mt-2">
            {inBand ? "accruing in-band" : "dormant — need $25 held to accrue"}
          </div>
        </div>
        <div className="flex items-center gap-5">
          <TicksBar value={progress} />
          <span className="mono text-ink">{Math.round(progress * 100)}%</span>
        </div>
        <Link
          href="/choose"
          className={`btn btn-xl ${eggs >= 1 ? "btn-lime" : ""}`}
        >
          {eggs >= 1 ? "Choose your egg" : "Hatch egg"}
          <Arrow />
        </Link>
      </div>

      {/* ----------------------------------------------------------------
       * Status footer
       * ---------------------------------------------------------------- */}
      <div className="hairline mt-10 pt-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
        <FooterStat k="Fixed supply" v="100M" sub="AGI" />
        <FooterStat
          k="Maximum pets"
          v={state.supply.petCap.toLocaleString()}
          sub="ever"
        />
        <FooterStat k="Minimum held" v={`$${STAGE_USD_THRESHOLD.hatchling}`} sub="to accrue" />
        <div>
          <div className="eyebrow-mute">Warning</div>
          <div className="mt-2 text-[13px] leading-relaxed text-ink-mute">
            Dropping below your band degrades your pet.
          </div>
        </div>
      </div>
    </section>
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
      className={`pb-1 text-[15px] font-semibold tracking-tightest transition-colors ${
        active ? "text-ink border-b-2 border-ink" : "text-ink-mute"
      }`}
    >
      {label}
    </button>
  );
}

function PinLabel({
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

function TicksBar({ value }: { value: number }) {
  const total = 80;
  const on = Math.round(value * total);
  const items = useMemo(
    () =>
      Array.from({ length: total }).map((_, i) => (
        <span key={i} className={i < on ? "on" : ""} />
      )),
    [on],
  );
  return <div className="ticks flex-1">{items}</div>;
}

function FooterStat({ k, v, sub }: { k: string; v: string; sub: string }) {
  return (
    <div>
      <div className="display text-[clamp(28px,3vw,42px)] font-semibold tracking-tightest">
        {v}
      </div>
      <div className="eyebrow-mute mt-1">
        {k} · {sub}
      </div>
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
