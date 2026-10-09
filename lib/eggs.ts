/**
 * Egg catalog.
 *
 * Each entry points at a sprite cell in one of six 3×2 sheets in /public/eggs/.
 * The `id` is the stable key — hatch seeded with `egg:<id>` always rolls the
 * same cosmetic shell, so what a visitor picks on /choose is what hatches.
 *
 * `description` is visual copy only (what the shell looks like). We never
 * promise trait biases, yields, or availability tiers here — those come
 * from the trait seed / supply contract.
 */

export type EggFamily =
  | "aqua"
  | "industrial"
  | "hex"
  | "fantasy"
  | "stone"
  | "wood";

export type EggId =
  // Aqua ------------------------------------------------------------
  | "aqua-current" | "aqua-nebula" | "aqua-shard"
  | "aqua-droplet" | "aqua-stripe" | "aqua-loop"
  // Industrial ------------------------------------------------------
  | "ind-neon" | "ind-copper" | "ind-cell"
  | "ind-coil" | "ind-orb" | "ind-strip"
  // Hex -------------------------------------------------------------
  | "hex-fan" | "hex-chip" | "hex-vial"
  | "hex-rib" | "hex-dome" | "hex-vent"
  // Fantasy ---------------------------------------------------------
  | "fan-leaf" | "fan-slime" | "fan-horn"
  | "fan-eye" | "fan-cloud" | "fan-crystal"
  // Stone -----------------------------------------------------------
  | "stn-ember" | "stn-marble" | "stn-geode"
  | "stn-slate" | "stn-obsidian" | "stn-sand"
  // Wood ------------------------------------------------------------
  | "wd-bark" | "wd-birch" | "wd-redwood"
  | "wd-fern" | "wd-root" | "wd-maple";

export type EggCatalogEntry = {
  id: EggId;
  name: string;
  family: EggFamily;
  theme: string;    // one-word mood used in the viewer
  sheet: string;
  col: 0 | 1 | 2;
  row: 0 | 1;
  description: string;
};

export const FAMILY_LABEL: Record<EggFamily, string> = {
  aqua: "Aqua",
  industrial: "Industrial",
  hex: "Hex",
  fantasy: "Fantasy",
  stone: "Stone",
  wood: "Wood",
};

export const EGG_CATALOG: EggCatalogEntry[] = [
  // --- Aqua ----------
  { id: "aqua-current", name: "Current", family: "aqua", theme: "Flow",
    sheet: "/eggs/aqua.webp", col: 0, row: 0,
    description: "A liquid seam coils under polished glass." },
  { id: "aqua-nebula", name: "Nebula", family: "aqua", theme: "Weather",
    sheet: "/eggs/aqua.webp", col: 1, row: 0,
    description: "A small storm, held still inside bronze." },
  { id: "aqua-shard", name: "Shard", family: "aqua", theme: "Crystal",
    sheet: "/eggs/aqua.webp", col: 2, row: 0,
    description: "Cut glass pane; blue crystal at the core." },
  { id: "aqua-droplet", name: "Droplet", family: "aqua", theme: "Stasis",
    sheet: "/eggs/aqua.webp", col: 0, row: 1,
    description: "One drop in suspension between electrodes." },
  { id: "aqua-stripe", name: "Stripe", family: "aqua", theme: "Signal",
    sheet: "/eggs/aqua.webp", col: 1, row: 1,
    description: "Striped ceramic with thin cyan veins." },
  { id: "aqua-loop", name: "Loop", family: "aqua", theme: "Pipework",
    sheet: "/eggs/aqua.webp", col: 2, row: 1,
    description: "A plumbing of thought folded back on itself." },

  // --- Industrial ----------
  { id: "ind-neon", name: "Neon", family: "industrial", theme: "Rods",
    sheet: "/eggs/industrial.webp", col: 0, row: 0,
    description: "Four lit rods, patient behind steel." },
  { id: "ind-copper", name: "Copper", family: "industrial", theme: "Winding",
    sheet: "/eggs/industrial.webp", col: 1, row: 0,
    description: "Wound in copper, warm under the shell." },
  { id: "ind-cell", name: "Cell", family: "industrial", theme: "Spindle",
    sheet: "/eggs/industrial.webp", col: 2, row: 0,
    description: "A single bright spindle in a dark chamber." },
  { id: "ind-coil", name: "Coil", family: "industrial", theme: "Transformer",
    sheet: "/eggs/industrial.webp", col: 0, row: 1,
    description: "A transformer in a shell. Hums at idle." },
  { id: "ind-orb", name: "Orb", family: "industrial", theme: "Battery",
    sheet: "/eggs/industrial.webp", col: 1, row: 1,
    description: "A living battery suspended in glass." },
  { id: "ind-strip", name: "Strip", family: "industrial", theme: "Line",
    sheet: "/eggs/industrial.webp", col: 2, row: 1,
    description: "A thin bright line down ceramic plating." },

  // --- Hex ----------
  { id: "hex-fan", name: "Fan", family: "hex", theme: "Cooling",
    sheet: "/eggs/hex.webp", col: 0, row: 0,
    description: "Something inside is being cooled, carefully." },
  { id: "hex-chip", name: "Chip", family: "hex", theme: "Logic",
    sheet: "/eggs/hex.webp", col: 1, row: 0,
    description: "A dark lattice around one logic gate." },
  { id: "hex-vial", name: "Vial", family: "hex", theme: "Fluid",
    sheet: "/eggs/hex.webp", col: 2, row: 0,
    description: "Fluid-cooled thought, piped at the sides." },
  { id: "hex-rib", name: "Rib", family: "hex", theme: "Armor",
    sheet: "/eggs/hex.webp", col: 0, row: 1,
    description: "Pipes beneath ribbed armor. Steady." },
  { id: "hex-dome", name: "Dome", family: "hex", theme: "Observation",
    sheet: "/eggs/hex.webp", col: 1, row: 1,
    description: "Observation glass; a green sphere beneath." },
  { id: "hex-vent", name: "Vent", family: "hex", theme: "Exhaust",
    sheet: "/eggs/hex.webp", col: 2, row: 1,
    description: "Steady exhaust along a lime seam." },

  // --- Fantasy ----------
  { id: "fan-leaf", name: "Leaf", family: "fantasy", theme: "Growth",
    sheet: "/eggs/fantasy.webp", col: 0, row: 0,
    description: "Sprouted. A shell that has already opened a little." },
  { id: "fan-slime", name: "Slime", family: "fantasy", theme: "Spill",
    sheet: "/eggs/fantasy.webp", col: 1, row: 0,
    description: "A spill with intent. Shaped like a wave." },
  { id: "fan-horn", name: "Horn", family: "fantasy", theme: "Fire",
    sheet: "/eggs/fantasy.webp", col: 2, row: 0,
    description: "Two horns, warm veins underneath." },
  { id: "fan-eye", name: "Eye", family: "fantasy", theme: "Watcher",
    sheet: "/eggs/fantasy.webp", col: 0, row: 1,
    description: "Already watching. Dark panels, green pupils." },
  { id: "fan-cloud", name: "Cloud", family: "fantasy", theme: "Sky",
    sheet: "/eggs/fantasy.webp", col: 1, row: 1,
    description: "A sleeping sky in soft folds." },
  { id: "fan-crystal", name: "Crystal", family: "fantasy", theme: "Grown",
    sheet: "/eggs/fantasy.webp", col: 2, row: 1,
    description: "Grown in silence. Green facets at the mouth." },

  // --- Stone ----------
  { id: "stn-ember", name: "Ember", family: "stone", theme: "Fault",
    sheet: "/eggs/stone.webp", col: 0, row: 0,
    description: "Dark basalt broken by an amber fault." },
  { id: "stn-marble", name: "Marble", family: "stone", theme: "Vein",
    sheet: "/eggs/stone.webp", col: 1, row: 0,
    description: "White marble veined with gold, one dark lens." },
  { id: "stn-geode", name: "Geode", family: "stone", theme: "Cavity",
    sheet: "/eggs/stone.webp", col: 2, row: 0,
    description: "A sandstone cavity around clear crystal." },
  { id: "stn-slate", name: "Slate", family: "stone", theme: "Layered",
    sheet: "/eggs/stone.webp", col: 0, row: 1,
    description: "Layered slate, polished by water." },
  { id: "stn-obsidian", name: "Obsidian", family: "stone", theme: "Cut",
    sheet: "/eggs/stone.webp", col: 1, row: 1,
    description: "Faceted black glass. Rare chatoyance inside." },
  { id: "stn-sand", name: "Sand", family: "stone", theme: "Drift",
    sheet: "/eggs/stone.webp", col: 2, row: 1,
    description: "Soft sandstone drift around amber." },

  // --- Wood ----------
  { id: "wd-bark", name: "Bark", family: "wood", theme: "Oak",
    sheet: "/eggs/wood.webp", col: 0, row: 0,
    description: "Mossed bark bound around warm heartwood." },
  { id: "wd-birch", name: "Birch", family: "wood", theme: "Peeling",
    sheet: "/eggs/wood.webp", col: 1, row: 0,
    description: "Birch paper with one green eye." },
  { id: "wd-redwood", name: "Redwood", family: "wood", theme: "Grain",
    sheet: "/eggs/wood.webp", col: 2, row: 0,
    description: "Spiraled bark, a red grain core." },
  { id: "wd-fern", name: "Fern", family: "wood", theme: "Leaf",
    sheet: "/eggs/wood.webp", col: 0, row: 1,
    description: "Fern leaves carved into pale heartwood." },
  { id: "wd-root", name: "Root", family: "wood", theme: "Woven",
    sheet: "/eggs/wood.webp", col: 1, row: 1,
    description: "A woven cradle of roots around smooth wood." },
  { id: "wd-maple", name: "Maple", family: "wood", theme: "Amber",
    sheet: "/eggs/wood.webp", col: 2, row: 1,
    description: "Figured maple with amber resin at the seam." },
];

export const FAMILIES: EggFamily[] = ["aqua", "industrial", "hex", "fantasy", "stone", "wood"];

export function eggById(id: EggId): EggCatalogEntry {
  const e = EGG_CATALOG.find((e) => e.id === id);
  if (!e) throw new Error(`Unknown egg id: ${id}`);
  return e;
}
