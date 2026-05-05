"use client";

import { useState } from "react";
import { useGame } from "@/components/StateProvider";
import { fmtAgi, fmtUsd } from "@/lib/format";
import { STAGE_USD_THRESHOLD } from "@/lib/types";

export default function EggsPage() {
  const { state, call, refresh } = useGame();
  const [usd, setUsd] = useState(50);
  const [agiSell, setAgiSell] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  if (!state) return null;
  const usdHeld = state.wallet.agi * state.supply.agiPriceUsd;
  const inBand = usdHeld >= STAGE_USD_THRESHOLD.hatchling;
  const eggs = state.wallet.eggs;
  const canHatch = eggs >= 1 && inBand && state.supply.petsMinted < state.supply.petCap;

  async function buy() {
    setBusy("buy");
    setMsg(null);
    const r = await call("/api/buy", { usd });
    if (!r.ok) setMsg(r.error ?? "failed");
    setBusy(null);
  }
  async function sell() {
    setBusy("sell");
    setMsg(null);
    const r = await call("/api/sell", { agi: agiSell });
    if (!r.ok) setMsg(r.error ?? "failed");
    setBusy(null);
  }
  async function hatch() {
    setBusy("hatch");
    setMsg(null);
    const r = await call("/api/hatch");
    if (!r.ok) setMsg(r.error ?? "failed");
    else setMsg("a pet has hatched.");
    setBusy(null);
    refresh();
  }

  return (
    <div className="space-y-10 pt-6">
      <header className="space-y-2">
        <div className="kbd">egg chamber</div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Commitment becomes life.
        </h1>
        <p className="text-white/60 max-w-2xl">
          Egg fragments accrue while you stay within the band. They are
          non-transferable — no markets, no bots, no buying your way to AGI.
          Reach 1.0 and your owner profile may hatch a pet.
        </p>
      </header>

      <section className="grid lg:grid-cols-3 gap-6">
        <FloatingEgg
          progress={Math.min(1, eggs)}
          locked={!inBand}
          rare={eggs >= 1}
        />
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          <div className="glass p-5 space-y-3">
            <div className="kbd">commit AGI</div>
            <input
              type="number"
              min={1}
              max={100000}
              value={usd}
              onChange={(e) => setUsd(Number(e.target.value))}
            />
            <button
              className="btn btn-primary w-full"
              disabled={busy !== null || usd <= 0}
              onClick={buy}
            >
              {busy === "buy" ? "buying…" : `Buy ${fmtUsd(usd)} of AGI`}
            </button>
            <div className="kbd">price {fmtUsd(state.supply.agiPriceUsd)} · 2.5% routes to compute treasury</div>
          </div>

          <div className="glass p-5 space-y-3">
            <div className="kbd">withdraw</div>
            <input
              type="number"
              min={0}
              max={state.wallet.agi}
              value={agiSell}
              onChange={(e) => setAgiSell(Number(e.target.value))}
            />
            <button
              className="btn w-full"
              disabled={busy !== null || agiSell <= 0 || agiSell > state.wallet.agi}
              onClick={sell}
            >
              {busy === "sell" ? "selling…" : `Sell ${fmtAgi(agiSell)}`}
            </button>
            <div className="kbd text-glow-rose/70">
              warning: dropping below band degrades your pet.
            </div>
          </div>

          <div className="sm:col-span-2 glass p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="kbd">your eggs</div>
                <div className="text-3xl font-semibold mt-1 text-glow-cyan">
                  {eggs.toFixed(2)}
                </div>
                <div className="text-xs text-white/50 mt-1">
                  {inBand
                    ? "accruing in-band"
                    : `dormant — need ${fmtUsd(STAGE_USD_THRESHOLD.hatchling)} held to accrue`}
                </div>
              </div>
              <button
                className="btn btn-primary"
                disabled={!canHatch || busy !== null}
                onClick={hatch}
              >
                {busy === "hatch" ? "hatching…" : "Hatch one egg"}
              </button>
            </div>
            {msg && <div className="text-xs text-white/70">{msg}</div>}
          </div>
        </div>
      </section>

      <section className="glass p-5 text-sm text-white/70 leading-relaxed">
        <div className="kbd mb-2">why this works</div>
        Egg supply is governed by three rules: (1) fixed AGI cap of{" "}
        <span className="text-white">100,000,000</span>, (2) hard ceiling of{" "}
        <span className="text-white">5,000</span> pets ever, and (3) accrual
        only while wallet value sits inside its USD band. This kills whale
        dominance without locking your funds — you can always sell, but the
        moment you dip out of band, your pet's intelligence degrades.
      </section>
    </div>
  );
}

function FloatingEgg({
  progress,
  locked,
  rare,
}: {
  progress: number;
  locked: boolean;
  rare: boolean;
}) {
  return (
    <div className="glass-strong p-8 flex flex-col items-center justify-center gap-6 min-h-[360px]">
      <div className="relative animate-float">
        <div
          className="w-32 h-44 rounded-[50%/45%]"
          style={{
            background:
              "linear-gradient(160deg, #b6a8ff 0%, #6f63d6 40%, #2a2666 100%)",
            boxShadow: locked
              ? "0 20px 60px rgba(0,0,0,0.5), inset 0 -10px 24px rgba(0,0,0,0.4)"
              : "0 20px 80px rgba(155,140,255,0.45), inset 0 -10px 24px rgba(0,0,0,0.3)",
            filter: locked ? "grayscale(0.7) brightness(0.6)" : "none",
            opacity: locked ? 0.5 : 1,
          }}
        />
        {rare && !locked && (
          <div
            className="absolute inset-0 rounded-[50%/45%] sparkle mix-blend-overlay opacity-40"
            style={{ borderRadius: "50% / 45%" }}
          />
        )}
      </div>
      <div className="w-full space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-white/60">{locked ? "locked" : "ready"}</span>
          <span className="text-white">{Math.round(progress * 100)}%</span>
        </div>
        <div className="progress">
          <span style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
