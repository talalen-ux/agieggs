"use client";

import { useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/StateProvider";
import { Pet3D } from "@/components/Pet3D";
import { Bar } from "@/components/Stat";
import { fmtUsd } from "@/lib/format";
import { STAGE_ORDER, STAGE_SKILLS, STAGE_USD_THRESHOLD } from "@/lib/types";
import {
  evolutionProgress,
  holdingsUsd,
  nextStage,
  nextStageThresholdUsd,
} from "@/lib/economics";
import { canEvolve, experienceRequired } from "@/lib/pet";

export default function EvolvePage() {
  const { state, call } = useGame();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!state) return <div className="pad-x py-20 body-mute">Loading…</div>;
  const pet = state.pets[0];

  if (!pet) {
    return (
      <section className="pad-x max-shell section-sm">
        <div className="eyebrow-mute mb-4">Evolution</div>
        <h1 className="h-section">No pet to evolve yet.</h1>
        <p className="body-mute mt-5 max-w-md">
          Open the chamber, commit AGI, and hatch a pet first.
        </p>
        <Link href="/eggs" className="btn btn-primary btn-xl mt-8">
          Go to Egg Chamber
        </Link>
      </section>
    );
  }

  const ns = nextStage(pet);
  const target = nextStageThresholdUsd(pet);
  const usd = holdingsUsd(state);
  const progress = evolutionProgress(state, pet);
  const xpReq = experienceRequired(pet);
  const xpProgress = Math.min(1, pet.experience / Math.max(1, xpReq));
  const check = canEvolve(state, pet);

  async function evolve() {
    if (!pet) return;
    setBusy(true);
    setMsg(null);
    const r = await call("/api/evolve", { petId: pet.id });
    if (!r.ok) setMsg(r.error ?? "failed");
    else setMsg(`${pet.name} evolved.`);
    setBusy(false);
  }
  async function train() {
    if (!pet) return;
    setBusy(true);
    setMsg(null);
    const r = await call("/api/train", { petId: pet.id });
    if (!r.ok) setMsg(r.error ?? "failed");
    setBusy(false);
  }

  return (
    <section className="pad-x max-shell section-sm">
      <div className="eyebrow-mute mb-4">Evolution</div>

      <header className="mb-14 max-w-2xl">
        <h1 className="h-section">
          {ns
            ? `${pet.name} is becoming ${ns}.`
            : `${pet.name} has reached AGI.`}
        </h1>
        <p className="body-mute mt-5 max-w-md">
          Four stages up to AGI. Each one unlocks new skills; falling out of
          band dims them. Training burns AGI into the compute treasury.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-10 items-center">
        {/* Pet + status */}
        <div className="card p-10 flex flex-col items-center gap-6">
          <Pet3D pet={pet} size={260} />
          <div className="text-center">
            <div className="text-[28px] font-semibold tracking-tight">
              {pet.name}
            </div>
            <div className="eyebrow-mute mt-1">
              {pet.stage} · intelligence {pet.intelligence}
            </div>
            {pet.degraded && (
              <div className="mt-3 inline-block px-3 py-1 text-[12px] font-semibold uppercase tracking-widest bg-ink text-white rounded-full">
                degraded
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-8">
          <div className="card p-6">
            <div className="eyebrow-mute">commitment band</div>
            <div className="text-[32px] font-semibold tracking-tight mt-2 mb-4">
              {fmtUsd(usd)}
              {ns && (
                <span className="text-ink-mute text-[16px] font-normal ml-2">
                  / {fmtUsd(target ?? 0)}
                </span>
              )}
            </div>
            <Bar value={progress} />
            <div className="eyebrow-mute mt-3">
              {ns
                ? `Reach ${fmtUsd(target ?? 0)} held to unlock ${ns}.`
                : "Final form reached."}
            </div>
          </div>

          <div className="card p-6">
            <div className="eyebrow-mute">experience</div>
            <div className="text-[32px] font-semibold tracking-tight mt-2 mb-4">
              {pet.experience}
              <span className="text-ink-mute text-[16px] font-normal ml-2">
                / {xpReq} XP
              </span>
            </div>
            <Bar value={xpProgress} />
            <div className="flex items-center justify-between mt-4 gap-3">
              <div className="eyebrow-mute">
                each cycle burns 10 AGI → treasury
              </div>
              <button
                className="btn"
                disabled={busy || pet.degraded || state.wallet.agi < 10}
                onClick={train}
              >
                {busy ? "training…" : "Run training cycle"}
              </button>
            </div>
          </div>

          <button
            className="btn btn-primary btn-xl w-full justify-between"
            disabled={!check.ok || busy}
            onClick={evolve}
          >
            <span>
              {check.ok
                ? `Evolve to ${ns?.toUpperCase()}`
                : check.reason ?? "locked"}
            </span>
            <Arrow />
          </button>
          {msg && <div className="text-[13px] text-ink-mute">{msg}</div>}
        </div>
      </div>

      {/* Stage tree */}
      <div className="rule mt-16 pt-10">
        <div className="eyebrow mb-5">Stage tree</div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {STAGE_ORDER.map((s) => {
            const active = s === pet.stage;
            const reached =
              STAGE_ORDER.indexOf(s) <= STAGE_ORDER.indexOf(pet.stage);
            return (
              <div
                key={s}
                className={`card p-5 ${
                  active ? "border-ink" : ""
                } ${reached ? "" : "opacity-50"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="eyebrow-mute">{s.toUpperCase()}</div>
                  {active && (
                    <span className="w-2 h-2 rounded-full bg-lime" />
                  )}
                </div>
                <div className="text-[24px] font-semibold tracking-tight mt-2">
                  ${STAGE_USD_THRESHOLD[s].toLocaleString()}
                </div>
                <div className="flex flex-wrap gap-1 mt-3 min-h-[44px]">
                  {STAGE_SKILLS[s].map((k) => (
                    <span
                      key={k}
                      className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-hair-soft text-ink"
                    >
                      {k}
                    </span>
                  ))}
                  {STAGE_SKILLS[s].length === 0 && (
                    <span className="text-[10px] text-ink-faint">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
