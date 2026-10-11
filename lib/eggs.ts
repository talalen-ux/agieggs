/**
 * Egg catalog.
 *
 * Artwork lives at /public/eggs/single/<id>.webp, cut from the source sheets
 * by scripts/slice_eggs.py. The `id` is the stable key, and an entry's
 * position in EGG_CATALOG is its on-chain design number in the AGIEgg NFT
 * contract, so new eggs must only ever be appended to the end.
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
  | "wood"
  | "crystal"
  | "gold"
  | "earth"
  | "electric"
  | "terra"
  | "feather"
  | "frost"
  | "verdant"
  | "ocean"
  | "flame"
  | "solar"
  | "summit";

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
  | "wd-fern" | "wd-root" | "wd-maple"
  // Crystal ---------------------------------------------------------
  | "cr-prism" | "cr-petal" | "cr-spiral"
  | "cr-rhombus" | "cr-onyx" | "cr-emerald"
  // Gold ------------------------------------------------------------
  | "au-dune" | "au-fissure" | "au-guilloche"
  | "au-fold" | "au-facet" | "au-craquelure"
  // Earth -----------------------------------------------------------
  | "er-moss" | "er-coral" | "er-sandbar"
  | "er-mycel" | "er-frond" | "er-brook"
  // Electric --------------------------------------------------------
  | "el-arc" | "el-spark" | "el-tesla"
  | "el-plasma" | "el-surge" | "el-gyre"
  // Terra -----------------------------------------------------------
  | "tr-clay" | "tr-loam" | "tr-strata"
  | "tr-rift" | "tr-ochre" | "tr-granite"
  // Feather ---------------------------------------------------------
  | "fe-ashwing" | "fe-peacock" | "fe-dove"
  | "fe-kingfisher" | "fe-owl" | "fe-raven"
  // Frost -----------------------------------------------------------
  | "fr-glacier" | "fr-rime" | "fr-berg"
  | "fr-nightfrost" | "fr-drift" | "fr-hoar"
  // Verdant ---------------------------------------------------------
  | "vd-scarab" | "vd-bud" | "vd-cicada"
  | "vd-firefly" | "vd-laurel" | "vd-canopy"
  // Ocean -----------------------------------------------------------
  | "oc-wave" | "oc-reef" | "oc-abyss"
  | "oc-seaglass" | "oc-maelstrom" | "oc-aquamarine"
  // Flame -----------------------------------------------------------
  | "fl-blaze" | "fl-pyre" | "fl-magma"
  | "fl-ruby" | "fl-molten" | "fl-phoenix"
  // Solar -----------------------------------------------------------
  | "so-bolt" | "so-halo" | "so-citrine"
  | "so-circuit" | "so-radiance" | "so-comb"
  // Summit ----------------------------------------------------------
  | "sm-quarry" | "sm-snowcap" | "sm-basalt"
  | "sm-canyon" | "sm-glacite" | "sm-serpentine";

export type EggCatalogEntry = {
  id: EggId;
  name: string;
  family: EggFamily;
  theme: string;    // one-word mood used in the viewer
  description: string;
};

export const FAMILY_LABEL: Record<EggFamily, string> = {
  aqua: "Aqua",
  industrial: "Industrial",
  hex: "Hex",
  fantasy: "Fantasy",
  stone: "Stone",
  wood: "Wood",
  crystal: "Crystal",
  gold: "Gold",
  earth: "Earth",
  electric: "Electric",
  terra: "Terra",
  feather: "Feather",
  frost: "Frost",
  verdant: "Verdant",
  ocean: "Ocean",
  flame: "Flame",
  solar: "Solar",
  summit: "Summit",
};

export const EGG_CATALOG: EggCatalogEntry[] = [
  // --- Aqua ----------
  { id: "aqua-current", name: "Current", family: "aqua", theme: "Flow",
    description: "A liquid seam coils under polished glass." },
  { id: "aqua-nebula", name: "Nebula", family: "aqua", theme: "Weather",
    description: "A small storm, held still inside bronze." },
  { id: "aqua-shard", name: "Shard", family: "aqua", theme: "Crystal",
    description: "Cut glass pane; blue crystal at the core." },
  { id: "aqua-droplet", name: "Droplet", family: "aqua", theme: "Stasis",
    description: "One drop in suspension between electrodes." },
  { id: "aqua-stripe", name: "Stripe", family: "aqua", theme: "Signal",
    description: "Striped ceramic with thin cyan veins." },
  { id: "aqua-loop", name: "Loop", family: "aqua", theme: "Pipework",
    description: "A plumbing of thought folded back on itself." },

  // --- Industrial ----------
  { id: "ind-neon", name: "Neon", family: "industrial", theme: "Rods",
    description: "Four lit rods, patient behind steel." },
  { id: "ind-copper", name: "Copper", family: "industrial", theme: "Winding",
    description: "Wound in copper, warm under the shell." },
  { id: "ind-cell", name: "Cell", family: "industrial", theme: "Spindle",
    description: "A single bright spindle in a dark chamber." },
  { id: "ind-coil", name: "Coil", family: "industrial", theme: "Transformer",
    description: "A transformer in a shell. Hums at idle." },
  { id: "ind-orb", name: "Orb", family: "industrial", theme: "Battery",
    description: "A living battery suspended in glass." },
  { id: "ind-strip", name: "Strip", family: "industrial", theme: "Line",
    description: "A thin bright line down ceramic plating." },

  // --- Hex ----------
  { id: "hex-fan", name: "Fan", family: "hex", theme: "Cooling",
    description: "Something inside is being cooled, carefully." },
  { id: "hex-chip", name: "Chip", family: "hex", theme: "Logic",
    description: "A dark lattice around one logic gate." },
  { id: "hex-vial", name: "Vial", family: "hex", theme: "Fluid",
    description: "Fluid-cooled thought, piped at the sides." },
  { id: "hex-rib", name: "Rib", family: "hex", theme: "Armor",
    description: "Pipes beneath ribbed armor. Steady." },
  { id: "hex-dome", name: "Dome", family: "hex", theme: "Observation",
    description: "Observation glass; a green sphere beneath." },
  { id: "hex-vent", name: "Vent", family: "hex", theme: "Exhaust",
    description: "Steady exhaust along a lime seam." },

  // --- Fantasy ----------
  { id: "fan-leaf", name: "Leaf", family: "fantasy", theme: "Growth",
    description: "Sprouted. A shell that has already opened a little." },
  { id: "fan-slime", name: "Slime", family: "fantasy", theme: "Spill",
    description: "A spill with intent. Shaped like a wave." },
  { id: "fan-horn", name: "Horn", family: "fantasy", theme: "Fire",
    description: "Two horns, warm veins underneath." },
  { id: "fan-eye", name: "Eye", family: "fantasy", theme: "Watcher",
    description: "Already watching. Dark panels, green pupils." },
  { id: "fan-cloud", name: "Cloud", family: "fantasy", theme: "Sky",
    description: "A sleeping sky in soft folds." },
  { id: "fan-crystal", name: "Crystal", family: "fantasy", theme: "Grown",
    description: "Grown in silence. Green facets at the mouth." },

  // --- Stone ----------
  { id: "stn-ember", name: "Ember", family: "stone", theme: "Fault",
    description: "Dark basalt broken by an amber fault." },
  { id: "stn-marble", name: "Marble", family: "stone", theme: "Vein",
    description: "White marble veined with gold, one dark lens." },
  { id: "stn-geode", name: "Geode", family: "stone", theme: "Cavity",
    description: "A sandstone cavity around clear crystal." },
  { id: "stn-slate", name: "Slate", family: "stone", theme: "Layered",
    description: "Layered slate, polished by water." },
  { id: "stn-obsidian", name: "Obsidian", family: "stone", theme: "Cut",
    description: "Faceted black glass. Rare chatoyance inside." },
  { id: "stn-sand", name: "Sand", family: "stone", theme: "Drift",
    description: "Soft sandstone drift around amber." },

  // --- Wood ----------
  { id: "wd-bark", name: "Bark", family: "wood", theme: "Oak",
    description: "Mossed bark bound around warm heartwood." },
  { id: "wd-birch", name: "Birch", family: "wood", theme: "Peeling",
    description: "Birch paper with one green eye." },
  { id: "wd-redwood", name: "Redwood", family: "wood", theme: "Grain",
    description: "Spiraled bark, a red grain core." },
  { id: "wd-fern", name: "Fern", family: "wood", theme: "Leaf",
    description: "Fern leaves carved into pale heartwood." },
  { id: "wd-root", name: "Root", family: "wood", theme: "Woven",
    description: "A woven cradle of roots around smooth wood." },
  { id: "wd-maple", name: "Maple", family: "wood", theme: "Amber",
    description: "Figured maple with amber resin at the seam." },

  // --- Crystal ----------
  { id: "cr-prism", name: "Prism", family: "crystal", theme: "Facet",
    description: "Rose-cut crystal bound in a silver cage." },
  { id: "cr-petal", name: "Petal", family: "crystal", theme: "Bloom",
    description: "Dark stone cracked open on a quartz bloom." },
  { id: "cr-spiral", name: "Spiral", family: "crystal", theme: "Twist",
    description: "Faceted crystal wound in a silver spiral." },
  { id: "cr-rhombus", name: "Rhombus", family: "crystal", theme: "Centerpiece",
    description: "A single rhomboid gem in a frosted cage." },
  { id: "cr-onyx", name: "Onyx", family: "crystal", theme: "Night",
    description: "Black faceted stone cut by a silver band." },
  { id: "cr-emerald", name: "Emerald", family: "crystal", theme: "Cut",
    description: "Emerald-cut diamond in a vaulted silver frame." },

  // --- Gold ----------
  { id: "au-dune", name: "Dune", family: "gold", theme: "Satin",
    description: "Satin gold with a soft S-curve seam." },
  { id: "au-fissure", name: "Fissure", family: "gold", theme: "Vein",
    description: "Dark basalt split by a gold vein and crystal." },
  { id: "au-guilloche", name: "Guilloché", family: "gold", theme: "Pattern",
    description: "Guilloché engraving banded by polished gold." },
  { id: "au-fold", name: "Fold", family: "gold", theme: "Organic",
    description: "Molten gold folded into itself, mirror polish." },
  { id: "au-facet", name: "Facet", family: "gold", theme: "Blade",
    description: "Angular panels of brushed and polished gold." },
  { id: "au-craquelure", name: "Craquelure", family: "gold", theme: "Shell",
    description: "Cream shell crackled with liquid gold." },

  // --- Earth ----------
  { id: "er-moss", name: "Moss", family: "earth", theme: "Overgrown",
    description: "Pale river stones bound together by living moss." },
  { id: "er-coral", name: "Coral", family: "earth", theme: "Reef",
    description: "Porous coral lattice over pink and teal opal." },
  { id: "er-sandbar", name: "Sandbar", family: "earth", theme: "Tide",
    description: "Wind-carved sand layers with amber pooled between." },
  { id: "er-mycel", name: "Mycel", family: "earth", theme: "Network",
    description: "Dark bark plates threaded with pale mycelium and amber." },
  { id: "er-frond", name: "Frond", family: "earth", theme: "Fossil",
    description: "Fern-pressed leaves folded around a green stone." },
  { id: "er-brook", name: "Brook", family: "earth", theme: "Stream",
    description: "Grey river stone split by a channel of clear water." },

  // --- Electric ----------
  { id: "el-arc", name: "Arc", family: "electric", theme: "Discharge",
    description: "White shell parted on a blue arc between two electrodes." },
  { id: "el-spark", name: "Spark", family: "electric", theme: "Crackle",
    description: "Dark plating with lime-lit seams and charged glass pods." },
  { id: "el-tesla", name: "Tesla", family: "electric", theme: "Coil",
    description: "Copper coils stacked inside a brushed-steel capsule." },
  { id: "el-plasma", name: "Plasma", family: "electric", theme: "Core",
    description: "A pearl core held in a cage of blue lightning." },
  { id: "el-surge", name: "Surge", family: "electric", theme: "Fault",
    description: "Blackened blades split by a molten gold strike." },
  { id: "el-gyre", name: "Gyre", family: "electric", theme: "Orbit",
    description: "A charged orb suspended in a glass gyroscope." },

  // --- Terra ----------
  { id: "tr-clay", name: "Clay", family: "terra", theme: "Kiln",
    description: "Red clay plates around a polished amber core." },
  { id: "tr-loam", name: "Loam", family: "terra", theme: "Soil",
    description: "Dark soil shell with roots reaching an amber eye." },
  { id: "tr-strata", name: "Strata", family: "terra", theme: "Sediment",
    description: "Banded sandstone with a grey vein running through." },
  { id: "tr-rift", name: "Rift", family: "terra", theme: "Fracture",
    description: "Weathered rock split open on a rust-red seam." },
  { id: "tr-ochre", name: "Ochre", family: "terra", theme: "Desert",
    description: "Ochre sandstone swirls around a single amber eye." },
  { id: "tr-granite", name: "Granite", family: "terra", theme: "Mosaic",
    description: "Speckled granite mosaic around a smooth grey heart." },

  // --- Feather ----------
  { id: "fe-ashwing", name: "Ashwing", family: "feather", theme: "Smoke",
    description: "Graphite feathers parting on an amber seam." },
  { id: "fe-peacock", name: "Peacock", family: "feather", theme: "Plume",
    description: "Iridescent teal plumage set with opal eyes." },
  { id: "fe-dove", name: "Dove", family: "feather", theme: "Down",
    description: "Pale white feathers curling around a pearl seam." },
  { id: "fe-kingfisher", name: "Kingfisher", family: "feather", theme: "Dive",
    description: "Cobalt and copper feathers framing an amber core." },
  { id: "fe-owl", name: "Owl", family: "feather", theme: "Hush",
    description: "Layered brown and cream feathers over smoky quartz." },
  { id: "fe-raven", name: "Raven", family: "feather", theme: "Night",
    description: "Black feathers with a green sheen and a dark glass seam." },

  // --- Frost ----------
  { id: "fr-glacier", name: "Glacier", family: "frost", theme: "Shard",
    description: "Pale ice shards closing around a deep blue core." },
  { id: "fr-rime", name: "Rime", family: "frost", theme: "Fern",
    description: "White porcelain etched with frost ferns and a crystal heart." },
  { id: "fr-berg", name: "Berg", family: "frost", theme: "Floe",
    description: "Stacked ice blocks over glowing blue water." },
  { id: "fr-nightfrost", name: "Nightfrost", family: "frost", theme: "Polar",
    description: "Black glass with blue frost veins under silver lines." },
  { id: "fr-drift", name: "Drift", family: "frost", theme: "Snow",
    description: "Soft snow drifts folding over opal ice." },
  { id: "fr-hoar", name: "Hoar", family: "frost", theme: "Rime",
    description: "Frosted grey ribs traced in silver." },

  // --- Verdant ----------
  { id: "vd-scarab", name: "Scarab", family: "verdant", theme: "Shell",
    description: "Iridescent green wing cases around an emerald." },
  { id: "vd-bud", name: "Bud", family: "verdant", theme: "Unfurl",
    description: "Sage leaves opening on glowing green scales." },
  { id: "vd-cicada", name: "Cicada", family: "verdant", theme: "Wing",
    description: "Veined glass wings folded over a moss-green body." },
  { id: "vd-firefly", name: "Firefly", family: "verdant", theme: "Glow",
    description: "A dark beetle shell over a lit green orb." },
  { id: "vd-laurel", name: "Laurel", family: "verdant", theme: "Crown",
    description: "Gilded green leaves around pale scaled jade." },
  { id: "vd-canopy", name: "Canopy", family: "verdant", theme: "Leaf",
    description: "Bright leaves wrapped around an emerald eye." },

  // --- Ocean ----------
  { id: "oc-wave", name: "Wave", family: "ocean", theme: "Swell",
    description: "Cobalt waves curling around lit blue water." },
  { id: "oc-reef", name: "Reef", family: "ocean", theme: "Branch",
    description: "Pale coral branches climbing over turquoise glass." },
  { id: "oc-abyss", name: "Abyss", family: "ocean", theme: "Deep",
    description: "Midnight blue glass scattered with points of light." },
  { id: "oc-seaglass", name: "Seaglass", family: "ocean", theme: "Shore",
    description: "Frosted sea-glass pebbles set in silver." },
  { id: "oc-maelstrom", name: "Maelstrom", family: "ocean", theme: "Spiral",
    description: "A whirlpool of blue water bound in silver bands." },
  { id: "oc-aquamarine", name: "Aquamarine", family: "ocean", theme: "Facet",
    description: "A faceted aquamarine framed by silver leaves." },

  // --- Flame ----------
  { id: "fl-blaze", name: "Blaze", family: "flame", theme: "Petal",
    description: "Red lacquer petals opening on molten veins." },
  { id: "fl-pyre", name: "Pyre", family: "flame", theme: "Tongue",
    description: "Glassy red flames licking up the shell." },
  { id: "fl-magma", name: "Magma", family: "flame", theme: "Crust",
    description: "Black lava crust cracked over a red glow." },
  { id: "fl-ruby", name: "Ruby", family: "flame", theme: "Facet",
    description: "Faceted ruby held in a silver gothic cage." },
  { id: "fl-molten", name: "Molten", family: "flame", theme: "Flow",
    description: "Glossy red shell with fire running between iron bands." },
  { id: "fl-phoenix", name: "Phoenix", family: "flame", theme: "Plume",
    description: "Crimson feathers parting on a burning seam." },

  // --- Solar ----------
  { id: "so-bolt", name: "Bolt", family: "solar", theme: "Strike",
    description: "Yellow plates split by a crackling lightning seam." },
  { id: "so-halo", name: "Halo", family: "solar", theme: "Ring",
    description: "Glossy yellow rings around a glowing drop." },
  { id: "so-citrine", name: "Citrine", family: "solar", theme: "Facet",
    description: "Faceted citrine laced with light under a metal cage." },
  { id: "so-circuit", name: "Circuit", family: "solar", theme: "Trace",
    description: "Black circuitry plates around a lit yellow core." },
  { id: "so-radiance", name: "Radiance", family: "solar", theme: "Swirl",
    description: "Pearl bands spiralling over yellow light." },
  { id: "so-comb", name: "Comb", family: "solar", theme: "Cell",
    description: "Yellow stone tiles opening on a crystal hollow." },

  // --- Summit ----------
  { id: "sm-quarry", name: "Quarry", family: "summit", theme: "Granite",
    description: "Speckled granite plates split on a smoky quartz seam." },
  { id: "sm-snowcap", name: "Snowcap", family: "summit", theme: "Peak",
    description: "Snow-capped ridges over blue glacial ice." },
  { id: "sm-basalt", name: "Basalt", family: "summit", theme: "Vent",
    description: "Black basalt blocks over a glowing lava seam." },
  { id: "sm-canyon", name: "Canyon", family: "summit", theme: "Stratum",
    description: "Banded canyon rock with a citrine vein." },
  { id: "sm-glacite", name: "Glacite", family: "summit", theme: "Melt",
    description: "Streaked slate around a channel of pale ice." },
  { id: "sm-serpentine", name: "Serpentine", family: "summit", theme: "Moss",
    description: "Green serpentine stone with moss and a white quartz core." },
];

export const FAMILIES: EggFamily[] = [
  "aqua", "industrial", "hex", "fantasy", "stone", "wood", "crystal", "gold",
  "earth", "electric", "terra", "feather", "frost", "verdant",
  "ocean", "flame", "solar", "summit",
];

export function eggById(id: EggId): EggCatalogEntry {
  const e = EGG_CATALOG.find((e) => e.id === id);
  if (!e) throw new Error(`Unknown egg id: ${id}`);
  return e;
}

/** Path to the standalone, pre-trimmed egg artwork. */
export function eggSrc(idOrEntry: EggId | EggCatalogEntry): string {
  const id = typeof idOrEntry === "string" ? idOrEntry : idOrEntry.id;
  return `/eggs/single/${id}.webp`;
}
