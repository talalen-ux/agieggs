"use client";

import Link from "next/link";
import { useGame } from "@/components/StateProvider";
import { Bar, Stat } from "@/components/Stat";
import { fmtAgi, timeAgo } from "@/lib/format";
import { STAGE_SKILLS } from "@/lib/types";

export default function BrainPage() {
  const { state } = useGame();
  if (!state) return <div className="pad-x py-20 body-mute">Loading…</div>;
  const pet = state.pets[0];
  if (!pet) {
    return (
      <section className="pad-x max-shell section-sm">
        <div className="eyebrow mb-5">04 / Intelligence panel</div>
        <h1 className="h-section">No brain to inspect.</h1>
        <Link href="/eggs" className="btn btn-primary btn-xl mt-8">
          Hatch a pet
        </Link>
      </section>
    );
  }

  const t = pet.traits;
  const skills = STAGE_SKILLS[pet.stage];
  const allSkills = STAGE_SKILLS.agi;
  const computeUsage = pet.degraded ? 0.15 : 0.3 + pet.intelligence / 1500;

  return (
    <section className="pad-x max-shell section-sm">
      <div className="eyebrow-mute mb-4">Intelligence</div>

      <header className="mb-14">
        <h1 className="h-section max-w-xl">{pet.name}'s inner weather</h1>
        <p className="body-mute mt-5 max-w-md">
          Personality is seeded at the egg and drifts with use. Memory
          decays. Skills unlock with stage and throttle under degradation.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Stat label="intelligence" value={pet.intelligence} sub="0 → 1000" />
        <Stat label="experience" value={pet.experience} />
        <Stat
          label="memories"
          value={pet.memory.length}
          sub="decaying · IPFS-anchored"
        />
        <Stat label="rarity" value={t.rarity.toUpperCase()} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        <div className="card p-6">
          <div className="eyebrow-mute mb-4">personality vector</div>
          <div className="space-y-4">
            {[
              ["curiosity", t.curiosity],
              ["warmth", t.warmth],
              ["mischief", t.mischief],
              ["discipline", t.discipline],
              ["weirdness", t.weirdness],
            ].map(([k, v]) => (
              <Bar
                key={k as string}
                value={(v as number) / 100}
                label={k as string}
              />
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="eyebrow-mute mb-4">skill modules</div>
          <div className="space-y-2">
            {allSkills.map((s) => {
              const have = skills.includes(s);
              const blocked = pet.degraded && have;
              return (
                <div
                  key={s}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border ${
                    have && !blocked
                      ? "border-ink/90 bg-lime/40"
                      : "border-hair"
                  }`}
                >
                  <span className="text-sm">{s}</span>
                  <span className="eyebrow-mute">
                    {blocked ? "throttled" : have ? "online" : "locked"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="eyebrow-mute mt-5 rule pt-4">
            compute priority {Math.round(computeUsage * 100)}% · treasury{" "}
            {fmtAgi(state.supply.computeTreasury)}
          </div>
        </div>
      </div>

      <div>
        <div className="eyebrow mb-3">memory — most-salient first</div>
        <div className="card divide-y divide-hair">
          {pet.memory.length === 0 && (
            <div className="px-5 py-6 text-sm text-ink-mute">
              No memories yet. Talk to {pet.name} on the Chat tab.
            </div>
          )}
          {[...pet.memory]
            .sort((a, b) => b.salience - a.salience)
            .map((m) => (
              <div
                key={m.id}
                className="px-5 py-4 flex items-start gap-3 text-[14px]"
              >
                <span
                  className="mt-1 w-2 h-2 rounded-full shrink-0 bg-ink"
                  style={{ opacity: 0.3 + m.salience * 0.7 }}
                />
                <div className="flex-1">{m.summary}</div>
                <div className="eyebrow-mute shrink-0">
                  {Math.round(m.salience * 100)}% · {timeAgo(m.ts)}
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
