export type Stage = "egg" | "hatchling" | "juvenile" | "sapient" | "agi";

export const STAGE_ORDER: Stage[] = [
  "egg",
  "hatchling",
  "juvenile",
  "sapient",
  "agi",
];

// USD threshold required to evolve INTO each stage. Falling below the *current*
// stage's threshold demotes the pet into "degraded mode" — see economics.ts.
export const STAGE_USD_THRESHOLD: Record<Stage, number> = {
  egg: 0,
  hatchling: 25,
  juvenile: 100,
  sapient: 500,
  agi: 2500,
};

export const STAGE_SKILLS: Record<Stage, string[]> = {
  egg: [],
  hatchling: ["chat"],
  juvenile: ["chat", "memory", "tasks"],
  sapient: ["chat", "memory", "tasks", "tools", "apis"],
  agi: ["chat", "memory", "tasks", "tools", "apis", "autonomy", "multi-agent"],
};

export type Trait = {
  // Five-axis personality vector seeded at egg mint. Drives the system prompt.
  curiosity: number; // 0..100
  warmth: number;
  mischief: number;
  discipline: number;
  weirdness: number;
  // Cosmetic
  hue: number; // 0..360
  pattern: "solid" | "speckled" | "striped" | "iridescent" | "void";
  rarity: "common" | "uncommon" | "rare" | "mythic";
};

export type Pet = {
  id: string;
  ownerId: string;
  name: string;
  stage: Stage;
  traits: Trait;
  experience: number; // increments via training
  intelligence: number; // 0..1000, soft-capped by stage
  memory: MemoryFragment[];
  bornAt: number;
  lastSeenAt: number;
  degraded: boolean;
  conversation: ChatMessage[];
};

export type MemoryFragment = {
  id: string;
  ts: number;
  // Compressed summary of an interaction, written by the pet's brain.
  summary: string;
  // 0..1 — fades over time; once below MEMORY_DECAY_FLOOR it gets garbage collected.
  salience: number;
};

export type ChatMessage = {
  role: "user" | "pet";
  content: string;
  ts: number;
};

export type Wallet = {
  // Held AGI tokens (the user's stake).
  agi: number;
  // Earned but unhatched eggs. Soulbound — non-transferable.
  eggs: number;
  // Cumulative AGI ever bought, used for egg accrual independent of current balance.
  lifetimeBuy: number;
  // ms timestamp of last egg accrual tick.
  lastAccrualAt: number;
};

export type GlobalSupply = {
  // ERC-20 fixed cap.
  agiCap: 100_000_000;
  // ERC-721 hard cap on hatched pets.
  petCap: 5_000;
  // Treasury balance funded by the buy/sell tax.
  computeTreasury: number;
  // Number of pets ever hatched.
  petsMinted: number;
  // Simulated oracle price.
  agiPriceUsd: number;
};

export type GameState = {
  user: {
    id: string;
    handle: string;
  };
  wallet: Wallet;
  pets: Pet[];
  supply: GlobalSupply;
  others: PublicPet[]; // Social arena population
  events: GameEvent[];
};

export type PublicPet = {
  id: string;
  name: string;
  stage: Stage;
  intelligence: number;
  hue: number;
  rarity: Trait["rarity"];
  ownerHandle: string;
  flavor: string;
};

export type GameEvent = {
  id: string;
  ts: number;
  kind:
    | "buy"
    | "sell"
    | "egg"
    | "hatch"
    | "evolve"
    | "degrade"
    | "restore"
    | "train"
    | "social";
  text: string;
};
