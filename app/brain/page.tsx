"use client";

import { useGame } from "@/components/StateProvider";
import { Bar, Stat } from "@/components/Stat";
import { fmtAgi, timeAgo } from "@/lib/format";
import { STAGE_SKILLS } from "@/lib/types";

export default function BrainPage() {
  const { state } = useGame();
  const pet = state?.pets[0];
  if (!state) return null;
  if (!pet) {
    return (
      <div className="pt-20 text-center">
        <div className="kbd">intelligence panel</div>
        <h1 className="text-2xl mt-3">No brain to inspect.</h1>
      </div>
    );
  }

  const t = pet.traits;
  const skills = STAGE_SKILLS[pet.stage];
  const allSkills = STAGE_SKILLS.agi;
  const computeUsage = pet.degraded ? 0.15 : 0.3 + pet.intelligence / 1500;

  return (
    <div className="space-y-10 pt-6">
      <header>
        <div className="kbd">intelligence panel</div>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">
          {pet.name}'s brain
        </h1>
        <p className="text-white/60 mt-2">
          Personality is seeded at the egg and drifts with use. Memory has
          decay. Skills unlock with stage.
        </p>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="intelligence"
          value={pet.intelligence}
          sub="0 → 1000"
        />
        <Stat label="experience" value={pet.experience} accent="cyan" />
        <Stat
          label="memory fragments"
          value={pet.memory.length}
          sub="auto-decaying · IPFS-anchored"
          accent="amber"
        />
        <Stat
          label="rarity"
          value={t.rarity.toUpperCase()}
          accent={t.rarity === "mythic" ? "rose" : "violet"}
        />
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="glass p-5 space-y-3">
          <div className="kbd">personality vector</div>
          {[
            ["curiosity", t.curiosity],
            ["warmth", t.warmth],
            ["mischief", t.mischief],
            ["discipline", t.discipline],
            ["weirdness", t.weirdness],
          ].map(([k, v]) => (
            <Bar key={k as string} value={(v as number) / 100} label={k as string} />
          ))}
        </div>

        <div className="glass p-5 space-y-3">
          <div className="kbd">skill modules</div>
          <div className="space-y-2">
            {allSkills.map((s) => {
              const have = skills.includes(s);
              const blocked = pet.degraded && have;
              return (
                <div
                  key={s}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border ${
                    have && !blocked
                      ? "border-glow-violet/40 bg-glow-violet/10"
                      : "border-white/8"
                  }`}
                >
                  <span className="text-sm">{s}</span>
                  <span className="text-[10px] uppercase tracking-wider text-white/50">
                    {blocked ? "throttled" : have ? "online" : "locked"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="kbd pt-2">
            compute priority {Math.round(computeUsage * 100)}% · funded by treasury ({fmtAgi(state.supply.computeTreasury)})
          </div>
        </div>
      </section>

      <section>
        <div className="kbd mb-3">memory — most-salient first</div>
        <div className="glass divide-y divide-white/5">
          {pet.memory.length === 0 && (
            <div className="px-4 py-6 text-sm text-white/40">
              No memories yet. Talk to {pet.name} on the Chat tab.
            </div>
          )}
          {[...pet.memory]
            .sort((a, b) => b.salience - a.salience)
            .map((m) => (
              <div key={m.id} className="px-4 py-3 flex items-start gap-3 text-sm">
                <span
                  className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background: `rgba(155,140,255,${0.3 + m.salience * 0.7})`,
                  }}
                />
                <div className="flex-1">{m.summary}</div>
                <div className="kbd shrink-0">
                  {Math.round(m.salience * 100)}% · {timeAgo(m.ts)}
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
