"use client";

import { useState } from "react";
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
  const pet = state?.pets[0];
  if (!state) return null;

  if (!pet) {
    return (
      <div className="pt-20 text-center">
        <div className="kbd">no pet yet</div>
        <h1 className="text-2xl mt-3">The evolution chamber sleeps.</h1>
        <p className="text-white/50 mt-3">Hatch an egg first.</p>
      </div>
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
    <div className="space-y-10 pt-6">
      <header>
        <div className="kbd">evolution chamber</div>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">
          {ns ? `${pet.name} → ${ns.toUpperCase()}` : `${pet.name} has reached AGI.`}
        </h1>
      </header>

      <section className="grid lg:grid-cols-2 gap-8 items-center">
        <div className="flex justify-center">
          <Pet3D pet={pet} size={300} />
        </div>
        <div className="space-y-5">
          <div className="glass p-5 space-y-3">
            <div className="kbd">commitment band</div>
            <Bar
              value={progress}
              label={ns ? `${fmtUsd(usd)} / ${fmtUsd(target ?? 0)}` : "max"}
            />
            <div className="text-xs text-white/50">
              {ns
                ? `Reach ${fmtUsd(target ?? 0)} held to unlock ${ns}.`
                : "Final form."}
            </div>
          </div>
          <div className="glass p-5 space-y-3">
            <div className="kbd">experience</div>
            <Bar
              value={xpProgress}
              label={`${pet.experience} / ${xpReq} XP`}
            />
            <div className="text-xs text-white/50">
              Train your pet to grow XP. Each session burns 10 AGI to the GPU pool.
            </div>
            <button
              className="btn"
              disabled={busy || pet.degraded || state.wallet.agi < 10}
              onClick={train}
            >
              {busy ? "training…" : "Run training cycle (10 AGI)"}
            </button>
          </div>

          <button
            className="btn btn-primary w-full"
            disabled={!check.ok || busy}
            onClick={evolve}
          >
            {check.ok ? `Evolve to ${ns?.toUpperCase()}` : check.reason ?? "locked"}
          </button>
          {msg && <div className="text-xs text-white/70">{msg}</div>}
        </div>
      </section>

      <section className="space-y-3">
        <div className="kbd">stage tree — what you unlock, what you can lose</div>
        <div className="grid sm:grid-cols-5 gap-3">
          {STAGE_ORDER.map((s) => {
            const active = s === pet.stage;
            const reached = STAGE_ORDER.indexOf(s) <= STAGE_ORDER.indexOf(pet.stage);
            return (
              <div
                key={s}
                className={`glass p-4 ${active ? "ring-1 ring-glow-violet" : ""} ${
                  reached ? "" : "opacity-50"
                }`}
              >
                <div className="text-xs text-white/50">{s.toUpperCase()}</div>
                <div className="text-sm mt-1">
                  band {fmtUsd(STAGE_USD_THRESHOLD[s])}
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {STAGE_SKILLS[s].map((k) => (
                    <span
                      key={k}
                      className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/10 text-white/70"
                    >
                      {k}
                    </span>
                  ))}
                  {STAGE_SKILLS[s].length === 0 && (
                    <span className="text-[10px] text-white/30">no skills</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="kbd text-glow-rose/80">
          drop below your stage's band → degraded mode → loses compute priority,
          skill access, autonomy.
        </div>
      </section>
    </div>
  );
}
