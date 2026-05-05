"use client";

import Link from "next/link";
import { useGame } from "@/components/StateProvider";
import { Pet3D } from "@/components/Pet3D";
import { Stat, Bar } from "@/components/Stat";
import { fmtAgi, fmtUsd, timeAgo } from "@/lib/format";
import {
  STAGE_USD_THRESHOLD,
  STAGE_SKILLS,
} from "@/lib/types";
import {
  evolutionProgress,
  holdingsUsd,
  nextStageThresholdUsd,
} from "@/lib/economics";

export default function HomePage() {
  const { state, loading } = useGame();
  if (loading || !state) return <Loading />;

  const pet = state.pets[0] ?? null;
  const usd = holdingsUsd(state);
  const cappedReached = state.supply.petsMinted >= state.supply.petCap;

  return (
    <div className="space-y-10 pt-6">
      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div className="flex justify-center md:justify-start">
          {pet ? (
            <Pet3D pet={pet} size={320} />
          ) : (
            <DormantOrb />
          )}
        </div>
        <div className="space-y-5">
          <div>
            <div className="kbd">your pet lives here</div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mt-2">
              {pet ? pet.name : "Dormant."}
            </h1>
            <p className="text-white/60 mt-3 max-w-md">
              {pet
                ? pet.degraded
                  ? `${pet.name} is in degraded mode. Restore your $${STAGE_USD_THRESHOLD[pet.stage]} band to bring autonomy back.`
                  : `Stage ${pet.stage}. Intelligence ${pet.intelligence}. Last seen ${timeAgo(pet.lastSeenAt)}.`
                : "Commit AGI to begin earning egg fragments. The protocol caps at 5,000 pets — supply is finite, intelligence is scarce."}
            </p>
          </div>
          {pet && (
            <ProgressBlock
              label={`Evolution to ${nextStageThresholdUsd(pet) ? "next stage" : "AGI"}`}
              value={evolutionProgress(state, pet)}
              caption={
                nextStageThresholdUsd(pet)
                  ? `${fmtUsd(usd)} held / ${fmtUsd(nextStageThresholdUsd(pet) ?? 0)} required`
                  : "Final form. The protocol watches you now."
              }
            />
          )}
          <div className="flex flex-wrap gap-3">
            {!pet ? (
              <Link href="/eggs" className="btn btn-primary">
                Open the Egg Chamber →
              </Link>
            ) : (
              <>
                <Link href="/chat" className="btn btn-primary">Talk to {pet.name}</Link>
                <Link href="/evolve" className="btn">Evolution</Link>
                <Link href="/brain" className="btn btn-ghost">Intelligence panel</Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="AGI held"
          value={fmtAgi(state.wallet.agi)}
          sub={fmtUsd(usd)}
        />
        <Stat
          label="egg fragments"
          value={state.wallet.eggs.toFixed(2)}
          sub="non-transferable · accrues in band"
          accent="cyan"
        />
        <Stat
          label="pets minted"
          value={`${state.supply.petsMinted.toLocaleString()} / ${state.supply.petCap.toLocaleString()}`}
          sub={cappedReached ? "sealed" : "supply opening"}
          accent="rose"
        />
        <Stat
          label="compute treasury"
          value={fmtAgi(state.supply.computeTreasury)}
          sub="funds GPU / inference"
          accent="amber"
        />
      </section>

      {pet && <SkillsRibbon pet={pet} />}

      <section>
        <div className="kbd mb-3">protocol activity</div>
        <div className="glass divide-y divide-white/5">
          {state.events.slice(0, 10).map((e) => (
            <div
              key={e.id}
              className="px-4 py-3 flex items-start gap-3 text-sm"
            >
              <span
                className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: eventColor(e.kind) }}
              />
              <div className="flex-1">{e.text}</div>
              <div className="kbd shrink-0">{timeAgo(e.ts)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function DormantOrb() {
  return (
    <div className="pet-orb opacity-40" style={{ width: 320, height: 320, background: "radial-gradient(circle at 30% 25%, #1a1d2a, #05060a 70%)" }}>
      <div className="pet-face">
        <div className="pet-eyes">
          <div className="pet-eye" />
          <div className="pet-eye" />
        </div>
      </div>
    </div>
  );
}

function ProgressBlock({
  label,
  value,
  caption,
}: {
  label: string;
  value: number;
  caption: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <span className="text-white">{Math.round(value * 100)}%</span>
      </div>
      <Bar value={value} />
      <div className="kbd">{caption}</div>
    </div>
  );
}

function SkillsRibbon({ pet }: { pet: NonNullable<ReturnType<typeof useGame>["state"]>["pets"][number] }) {
  const have = new Set(STAGE_SKILLS[pet.stage]);
  const all = STAGE_SKILLS.agi;
  return (
    <section>
      <div className="kbd mb-3">skill modules</div>
      <div className="glass p-4 flex flex-wrap gap-2">
        {all.map((s) => (
          <span
            key={s}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              have.has(s)
                ? "border-glow-violet/50 bg-glow-violet/10 text-white"
                : "border-white/10 text-white/30"
            }`}
          >
            {s}
          </span>
        ))}
      </div>
    </section>
  );
}

function eventColor(kind: string): string {
  return (
    {
      buy: "#7ee8ff",
      sell: "#ff8ec5",
      egg: "#ffd07a",
      hatch: "#9b8cff",
      evolve: "#9b8cff",
      degrade: "#ff5b6a",
      restore: "#7ee8ff",
      train: "#9b8cff",
      social: "#ffd07a",
    }[kind] ?? "#9b8cff"
  );
}

function Loading() {
  return (
    <div className="pt-20 text-center text-white/40 text-sm">
      <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-glow-violet to-glow-cyan animate-pulse_glow mb-4" />
      booting protocol…
    </div>
  );
}
