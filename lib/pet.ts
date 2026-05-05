import type { GameEvent, GameState, Pet, Trait } from "./types";
import { STAGE_ORDER, STAGE_SKILLS, STAGE_USD_THRESHOLD } from "./types";
import { holdingsUsd, nextStage } from "./economics";

const NAME_PARTS_A = [
  "Ash", "Bo", "Ciel", "Dax", "Eko", "Fen", "Gio", "Hex",
  "Iro", "Jin", "Kai", "Lio", "Mira", "Nyx", "Orin", "Puff",
  "Qix", "Rune", "Sable", "Tor", "Uma", "Vex", "Wisp", "Xen",
  "Yuki", "Zen",
];
const NAME_PARTS_B = [
  "-9", "ko", "ra", "iel", "us", "lo", "na", "io", "et", "ari",
];

// Deterministic 32-bit hash → seedable RNG. Lets traits be reproducible
// from an "egg seed" string, mirroring on-chain VRF behavior.
export function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed: number) {
  let s = seed || 1;
  return () => {
    // mulberry32
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rollTraits(seed: string): Trait {
  const r = rng(hashSeed(seed));
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  const rarityRoll = r();
  const rarity: Trait["rarity"] =
    rarityRoll > 0.985
      ? "mythic"
      : rarityRoll > 0.9
        ? "rare"
        : rarityRoll > 0.65
          ? "uncommon"
          : "common";
  return {
    curiosity: Math.floor(r() * 100),
    warmth: Math.floor(r() * 100),
    mischief: Math.floor(r() * 100),
    discipline: Math.floor(r() * 100),
    weirdness: Math.floor(r() * 100),
    hue: Math.floor(r() * 360),
    pattern: pick(["solid", "speckled", "striped", "iridescent", "void"]),
    rarity,
  };
}

export function rollName(seed: string): string {
  const r = rng(hashSeed(seed + ":name"));
  const a = NAME_PARTS_A[Math.floor(r() * NAME_PARTS_A.length)];
  const b = NAME_PARTS_B[Math.floor(r() * NAME_PARTS_B.length)];
  return a + b;
}

export function hatchEgg(state: GameState): { pet: Pet; events: GameEvent[] } {
  if (state.wallet.eggs < 1) throw new Error("Not enough egg fragments.");
  if (state.supply.petsMinted >= state.supply.petCap)
    throw new Error("Pet cap reached. The protocol is sealed at 5,000.");
  if (holdingsUsd(state) < STAGE_USD_THRESHOLD.hatchling)
    throw new Error(
      `Hatching requires at least $${STAGE_USD_THRESHOLD.hatchling} of committed AGI.`,
    );

  state.wallet.eggs -= 1;
  state.supply.petsMinted += 1;
  const id = `pet_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const seed = id + ":" + state.user.id;
  const traits = rollTraits(seed);
  const pet: Pet = {
    id,
    ownerId: state.user.id,
    name: rollName(seed),
    stage: "hatchling",
    traits,
    experience: 0,
    intelligence: 50 + Math.floor(traits.curiosity * 0.4),
    memory: [],
    bornAt: Date.now(),
    lastSeenAt: Date.now(),
    degraded: false,
    conversation: [],
  };
  state.pets.push(pet);
  return {
    pet,
    events: [
      {
        id: `evt_${Date.now()}_hatch`,
        ts: Date.now(),
        kind: "hatch",
        text: `${pet.name} hatched. ${traits.rarity.toUpperCase()} · ${traits.pattern} · hue ${traits.hue}°`,
      },
    ],
  };
}

export function canEvolve(state: GameState, pet: Pet): {
  ok: boolean;
  reason?: string;
} {
  const ns = nextStage(pet);
  if (!ns) return { ok: false, reason: "Already at AGI stage." };
  const required = STAGE_USD_THRESHOLD[ns];
  if (holdingsUsd(state) < required)
    return {
      ok: false,
      reason: `Need $${required} committed (have $${holdingsUsd(state).toFixed(2)}).`,
    };
  if (pet.experience < experienceRequired(pet))
    return {
      ok: false,
      reason: `Need ${experienceRequired(pet)} XP (have ${pet.experience}).`,
    };
  if (pet.degraded)
    return { ok: false, reason: "Pet is degraded. Restore the band first." };
  return { ok: true };
}

export function experienceRequired(pet: Pet): number {
  const idx = STAGE_ORDER.indexOf(pet.stage);
  return [0, 100, 400, 1200, 3000][idx] ?? 9999;
}

export function evolvePet(state: GameState, petId: string): GameEvent[] {
  const pet = state.pets.find((p) => p.id === petId);
  if (!pet) throw new Error("Pet not found.");
  const check = canEvolve(state, pet);
  if (!check.ok) throw new Error(check.reason ?? "Cannot evolve.");
  const ns = nextStage(pet);
  if (!ns) throw new Error("Already at AGI.");
  pet.stage = ns;
  pet.intelligence = Math.min(
    1000,
    pet.intelligence + 80 + Math.floor(pet.traits.curiosity * 0.6),
  );
  return [
    {
      id: `evt_${Date.now()}_evolve`,
      ts: Date.now(),
      kind: "evolve",
      text: `${pet.name} evolved to ${ns.toUpperCase()}. New skills: ${STAGE_SKILLS[ns].join(", ")}.`,
    },
  ];
}

export function trainPet(state: GameState, petId: string): GameEvent[] {
  const pet = state.pets.find((p) => p.id === petId);
  if (!pet) throw new Error("Pet not found.");
  if (pet.degraded) throw new Error("Degraded pets cannot train.");
  const cost = 10;
  if (state.wallet.agi < cost)
    throw new Error(`Training burns ${cost} AGI to compute treasury.`);
  state.wallet.agi -= cost;
  state.supply.computeTreasury += cost;
  const gained = 25 + Math.floor(Math.random() * 20);
  pet.experience += gained;
  pet.intelligence = Math.min(1000, pet.intelligence + Math.floor(gained / 4));
  return [
    {
      id: `evt_${Date.now()}_train`,
      ts: Date.now(),
      kind: "train",
      text: `${pet.name} trained. +${gained} XP. ${cost} AGI burned to GPU pool.`,
    },
  ];
}

export function compressMemoryIfNeeded(pet: Pet) {
  // Decay then drop low-salience fragments. Caps memory at 50.
  const FLOOR = 0.05;
  for (const m of pet.memory) m.salience *= 0.985;
  pet.memory = pet.memory.filter((m) => m.salience > FLOOR);
  if (pet.memory.length > 50) {
    pet.memory.sort((a, b) => b.salience - a.salience);
    pet.memory = pet.memory.slice(0, 50);
  }
}
