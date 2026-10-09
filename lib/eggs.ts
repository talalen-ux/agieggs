/**
 * Egg catalog. Each entry points at a sprite cell in one of four sheets in
 * /public/eggs/. The row/col fields index a 3×2 grid.
 *
 * The order here is also the deterministic "egg id" — a hatch seeded with
 * `egg:<id>` always rolls the same cosmetic shell, so the preview the user
 * picks on /choose is the one that gets committed.
 */

export type EggId =
  // --- Aqua (futuristic silver + aqua) ----------------------------------
  | "aqua-current"
  | "aqua-nebula"
  | "aqua-shard"
  | "aqua-droplet"
  | "aqua-stripe"
  | "aqua-loop"
  // --- Industrial (greens, copper, dark metal) --------------------------
  | "ind-neon"
  | "ind-copper"
  | "ind-cell"
  | "ind-coil"
  | "ind-orb"
  | "ind-strip"
  // --- Hex (tech panels, bio ports) -------------------------------------
  | "hex-fan"
  | "hex-chip"
  | "hex-vial"
  | "hex-rib"
  | "hex-dome"
  | "hex-vent"
  // --- Fantasy (stylized, cute) -----------------------------------------
  | "fan-leaf"
  | "fan-slime"
  | "fan-horn"
  | "fan-eye"
  | "fan-cloud"
  | "fan-crystal";

export type EggCatalogEntry = {
  id: EggId;
  name: string;
  family: "aqua" | "industrial" | "hex" | "fantasy";
  sheet: string;
  col: 0 | 1 | 2;
  row: 0 | 1;
  rarity: "common" | "uncommon" | "rare" | "mythic";
  flavor: string;
};

export const EGG_CATALOG: EggCatalogEntry[] = [
  // --- Aqua ----------
  {
    id: "aqua-current",
    name: "Current",
    family: "aqua",
    sheet: "/eggs/aqua.webp",
    col: 0,
    row: 0,
    rarity: "uncommon",
    flavor: "A liquid seam coils under glass. Biases toward curiosity.",
  },
  {
    id: "aqua-nebula",
    name: "Nebula",
    family: "aqua",
    sheet: "/eggs/aqua.webp",
    col: 1,
    row: 0,
    rarity: "rare",
    flavor: "A tiny storm inside. Weirdness runs high.",
  },
  {
    id: "aqua-shard",
    name: "Shard",
    family: "aqua",
    sheet: "/eggs/aqua.webp",
    col: 2,
    row: 0,
    rarity: "mythic",
    flavor: "A crystal centerpiece. Discipline, mostly.",
  },
  {
    id: "aqua-droplet",
    name: "Droplet",
    family: "aqua",
    sheet: "/eggs/aqua.webp",
    col: 0,
    row: 1,
    rarity: "uncommon",
    flavor: "One drop, held in stasis. Warmth favored.",
  },
  {
    id: "aqua-stripe",
    name: "Stripe",
    family: "aqua",
    sheet: "/eggs/aqua.webp",
    col: 1,
    row: 1,
    rarity: "common",
    flavor: "A standard cell. Balanced temperament.",
  },
  {
    id: "aqua-loop",
    name: "Loop",
    family: "aqua",
    sheet: "/eggs/aqua.webp",
    col: 2,
    row: 1,
    rarity: "rare",
    flavor: "A plumbing of thought. Mischief threaded in.",
  },

  // --- Industrial ----------
  {
    id: "ind-neon",
    name: "Neon",
    family: "industrial",
    sheet: "/eggs/industrial.webp",
    col: 0,
    row: 0,
    rarity: "uncommon",
    flavor: "Four green rods, patient. Discipline-leaning.",
  },
  {
    id: "ind-copper",
    name: "Copper",
    family: "industrial",
    sheet: "/eggs/industrial.webp",
    col: 1,
    row: 0,
    rarity: "rare",
    flavor: "Wound in warm metal. Warmth + curiosity.",
  },
  {
    id: "ind-cell",
    name: "Cell",
    family: "industrial",
    sheet: "/eggs/industrial.webp",
    col: 2,
    row: 0,
    rarity: "uncommon",
    flavor: "A single bright spindle. Focused mischief.",
  },
  {
    id: "ind-coil",
    name: "Coil",
    family: "industrial",
    sheet: "/eggs/industrial.webp",
    col: 0,
    row: 1,
    rarity: "rare",
    flavor: "Transformer in a shell. High weirdness, high discipline.",
  },
  {
    id: "ind-orb",
    name: "Orb",
    family: "industrial",
    sheet: "/eggs/industrial.webp",
    col: 1,
    row: 1,
    rarity: "mythic",
    flavor: "A living battery. Rare temperaments bloom here.",
  },
  {
    id: "ind-strip",
    name: "Strip",
    family: "industrial",
    sheet: "/eggs/industrial.webp",
    col: 2,
    row: 1,
    rarity: "common",
    flavor: "A thin bright line. Standard roll.",
  },

  // --- Hex ----------
  {
    id: "hex-fan",
    name: "Fan",
    family: "hex",
    sheet: "/eggs/hex.webp",
    col: 0,
    row: 0,
    rarity: "uncommon",
    flavor: "Something inside is being cooled. Curiosity high.",
  },
  {
    id: "hex-chip",
    name: "Chip",
    family: "hex",
    sheet: "/eggs/hex.webp",
    col: 1,
    row: 0,
    rarity: "rare",
    flavor: "A dark lattice around a single logic gate.",
  },
  {
    id: "hex-vial",
    name: "Vial",
    family: "hex",
    sheet: "/eggs/hex.webp",
    col: 2,
    row: 0,
    rarity: "uncommon",
    flavor: "Fluid-cooled thought. Warmth + weirdness.",
  },
  {
    id: "hex-rib",
    name: "Rib",
    family: "hex",
    sheet: "/eggs/hex.webp",
    col: 0,
    row: 1,
    rarity: "rare",
    flavor: "Pipes under armor. Discipline runs high.",
  },
  {
    id: "hex-dome",
    name: "Dome",
    family: "hex",
    sheet: "/eggs/hex.webp",
    col: 1,
    row: 1,
    rarity: "mythic",
    flavor: "Observation glass up top. Rare traits.",
  },
  {
    id: "hex-vent",
    name: "Vent",
    family: "hex",
    sheet: "/eggs/hex.webp",
    col: 2,
    row: 1,
    rarity: "common",
    flavor: "Steady exhaust. Standard trait spread.",
  },

  // --- Fantasy ----------
  {
    id: "fan-leaf",
    name: "Leaf",
    family: "fantasy",
    sheet: "/eggs/fantasy.webp",
    col: 0,
    row: 0,
    rarity: "uncommon",
    flavor: "Sprouted. Warmth-biased. Likes mornings.",
  },
  {
    id: "fan-slime",
    name: "Slime",
    family: "fantasy",
    sheet: "/eggs/fantasy.webp",
    col: 1,
    row: 0,
    rarity: "rare",
    flavor: "A spill with intent. High mischief.",
  },
  {
    id: "fan-horn",
    name: "Horn",
    family: "fantasy",
    sheet: "/eggs/fantasy.webp",
    col: 2,
    row: 0,
    rarity: "rare",
    flavor: "Horned, hot-tempered. Weirdness up.",
  },
  {
    id: "fan-eye",
    name: "Eye",
    family: "fantasy",
    sheet: "/eggs/fantasy.webp",
    col: 0,
    row: 1,
    rarity: "mythic",
    flavor: "Watching. Already watching. Rare roll.",
  },
  {
    id: "fan-cloud",
    name: "Cloud",
    family: "fantasy",
    sheet: "/eggs/fantasy.webp",
    col: 1,
    row: 1,
    rarity: "uncommon",
    flavor: "A sleeping sky. Warmth-leaning.",
  },
  {
    id: "fan-crystal",
    name: "Crystal",
    family: "fantasy",
    sheet: "/eggs/fantasy.webp",
    col: 2,
    row: 1,
    rarity: "mythic",
    flavor: "Grown in silence. Discipline + weirdness.",
  },
];

export function eggById(id: EggId): EggCatalogEntry {
  const e = EGG_CATALOG.find((e) => e.id === id);
  if (!e) throw new Error(`Unknown egg id: ${id}`);
  return e;
}

export function someEggs(n: number, offset = 0): EggCatalogEntry[] {
  const out: EggCatalogEntry[] = [];
  const len = EGG_CATALOG.length;
  for (let i = 0; i < n; i++) out.push(EGG_CATALOG[(i + offset) % len]);
  return out;
}

/**
 * Pick N random distinct eggs. Seed is any string — same seed, same picks.
 * Used for the Choose screen so refreshing offers the same shelf unless
 * the user explicitly rerolls.
 */
export function pickEggs(seed: string, n: number): EggCatalogEntry[] {
  const hash = (s: string) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  const pool = [...EGG_CATALOG];
  const out: EggCatalogEntry[] = [];
  let state = hash(seed) || 1;
  for (let i = 0; i < n && pool.length; i++) {
    state = Math.imul(state ^ (state >>> 15), 2654435761) >>> 0;
    const idx = state % pool.length;
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}
