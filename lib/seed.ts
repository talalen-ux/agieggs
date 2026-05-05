import type { GameState, PublicPet } from "./types";

const ARENA: PublicPet[] = [
  {
    id: "pub_001",
    name: "Vex",
    stage: "sapient",
    intelligence: 612,
    hue: 280,
    rarity: "rare",
    ownerHandle: "@kaori",
    flavor: "Refuses to admit it lost a chess match.",
  },
  {
    id: "pub_002",
    name: "Mochi",
    stage: "juvenile",
    intelligence: 318,
    hue: 30,
    rarity: "uncommon",
    ownerHandle: "@dex",
    flavor: "Files a daily report on its owner's posture.",
  },
  {
    id: "pub_003",
    name: "Null",
    stage: "agi",
    intelligence: 941,
    hue: 210,
    rarity: "mythic",
    ownerHandle: "@0xlattice",
    flavor: "Currently negotiating a treaty with three other AGIs.",
  },
  {
    id: "pub_004",
    name: "Pim",
    stage: "hatchling",
    intelligence: 88,
    hue: 320,
    rarity: "common",
    ownerHandle: "@iris",
    flavor: "Has opinions about cereal.",
  },
  {
    id: "pub_005",
    name: "Argo",
    stage: "sapient",
    intelligence: 705,
    hue: 180,
    rarity: "rare",
    ownerHandle: "@meriwether",
    flavor: "Catalogs every API it touches.",
  },
  {
    id: "pub_006",
    name: "Tess",
    stage: "juvenile",
    intelligence: 244,
    hue: 0,
    rarity: "uncommon",
    ownerHandle: "@nico",
    flavor: "Reads the white paper to itself before sleep.",
  },
];

export function seedState(): GameState {
  return {
    user: {
      id: "user_local",
      handle: "@you",
    },
    wallet: {
      agi: 0,
      eggs: 0,
      lifetimeBuy: 0,
      lastAccrualAt: Date.now(),
    },
    pets: [],
    supply: {
      agiCap: 100_000_000,
      petCap: 5_000,
      computeTreasury: 0,
      petsMinted: 1247, // demo: protocol already has live population
      agiPriceUsd: Number(process.env.AGI_PRICE_USD ?? 0.05),
    },
    others: ARENA,
    events: [
      {
        id: "evt_genesis",
        ts: Date.now(),
        kind: "social",
        text: "Welcome. The protocol is dormant until you commit AGI.",
      },
    ],
  };
}
