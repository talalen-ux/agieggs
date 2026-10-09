"use client";

import { useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/StateProvider";
import type { PublicPet } from "@/lib/types";

export default function ArenaPage() {
  const { state, call } = useGame();
  const [busy, setBusy] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);
  if (!state) return <div className="pad-x py-20 body-mute">Loading…</div>;
  const pet = state.pets[0];

  async function spar(opp: PublicPet) {
    if (!pet) return;
    setBusy(opp.id);
    setOutcome(null);
    const r = await call("/api/social", {
      petId: pet.id,
      opponentId: opp.id,
    });
    if (!r.ok) setOutcome(r.error ?? "failed");
    else {
      const data = r as unknown as { won: boolean; xp: number };
      setOutcome(
        data.won
          ? `${pet.name} won. +${data.xp} XP.`
          : `${pet.name} lost gracefully. +${data.xp} XP.`,
      );
    }
    setBusy(null);
  }

  const sorted = [...state.others].sort((a, b) => b.intelligence - a.intelligence);

  return (
    <section className="pad-x max-shell section-sm">
      <div className="eyebrow-mute mb-4">Arena</div>

      <header className="mb-14 max-w-2xl">
        <h1 className="h-section">Where pets meet pets.</h1>
        <p className="body-mute mt-5 max-w-md">
          AGI-stage pets collaborate and compete. Spar for XP — the outcome
          scales with intelligence delta and a touch of fortune.
        </p>
      </header>

      {!pet && (
        <div className="card p-5 mb-10 flex items-center justify-between gap-4 flex-wrap">
          <div className="text-ink-mute text-[14px]">
            Hatch a pet to enter the arena.
          </div>
          <Link href="/eggs" className="btn">
            Go to Egg Chamber
          </Link>
        </div>
      )}

      {outcome && (
        <div className="card p-5 mb-10">
          <div className="text-[14px]">{outcome}</div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sorted.map((o) => (
          <article key={o.id} className="card p-6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full shrink-0"
                style={{
                  background: `radial-gradient(circle at 30% 25%, hsl(${o.hue} 70% 65%), hsl(${
                    (o.hue + 60) % 360
                  } 60% 35%))`,
                }}
              />
              <div className="flex-1">
                <div className="text-[20px] font-semibold tracking-tight">
                  {o.name}
                </div>
                <div className="eyebrow-mute mt-0.5">
                  {o.stage} · int {o.intelligence} · {o.rarity}
                </div>
              </div>
            </div>
            <p className="text-[13px] text-ink-mute leading-relaxed min-h-[42px]">
              {o.flavor}
            </p>
            <div className="rule pt-4 flex items-center justify-between">
              <div className="eyebrow-mute">{o.ownerHandle}</div>
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
      </div>
    </section>
  );
}
