"use client";

import { useState } from "react";
import { useGame } from "@/components/StateProvider";
import type { PublicPet } from "@/lib/types";

export default function ArenaPage() {
  const { state, call } = useGame();
  const [busy, setBusy] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);
  const pet = state?.pets[0];
  if (!state) return null;

  async function spar(opp: PublicPet) {
    if (!pet) return;
    setBusy(opp.id);
    setOutcome(null);
    const r = await call("/api/social", {
      petId: pet.id,
      opponentId: opp.id,
    });
    if (!r.ok) setOutcome(r.error ?? "failed");
    else
      setOutcome(
        (r as unknown as { won: boolean; xp: number }).won
          ? `${pet.name} won. +${(r as unknown as { xp: number }).xp} XP.`
          : `${pet.name} lost gracefully. +${(r as unknown as { xp: number }).xp} XP.`,
      );
    setBusy(null);
  }

  const sorted = [...state.others].sort((a, b) => b.intelligence - a.intelligence);

  return (
    <div className="space-y-10 pt-6">
      <header>
        <div className="kbd">social arena</div>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">
          Where pets meet pets.
        </h1>
        <p className="text-white/60 mt-2 max-w-2xl">
          Pets at the AGI stage form DAOs, collaborate, compete. Spar to gain
          XP — outcome scales with intelligence delta and a touch of fortune.
        </p>
      </header>

      {!pet && (
        <div className="glass p-5 text-sm text-white/60">
          Hatch a pet to enter the arena.
        </div>
      )}
      {outcome && (
        <div className="glass p-4 text-sm">{outcome}</div>
      )}

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((o) => (
          <article key={o.id} className="glass p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full"
                style={{
                  background: `radial-gradient(circle at 30% 25%, hsl(${o.hue} 70% 60%), hsl(${(o.hue + 60) % 360} 70% 30%))`,
                }}
              />
              <div className="flex-1">
                <div className="font-medium">{o.name}</div>
                <div className="kbd">
                  {o.stage} · int {o.intelligence} · {o.rarity}
                </div>
              </div>
            </div>
            <div className="text-xs text-white/60 leading-relaxed min-h-[40px]">
              {o.flavor}
            </div>
            <div className="flex items-center justify-between">
              <div className="kbd">{o.ownerHandle}</div>
              <button
                className="btn"
                disabled={!pet || busy !== null || pet.degraded}
                onClick={() => spar(o)}
              >
                {busy === o.id ? "sparring…" : "spar"}
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
