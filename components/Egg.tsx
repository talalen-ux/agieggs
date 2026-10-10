"use client";

import type { EggCatalogEntry, EggId } from "@/lib/eggs";
import { eggById } from "@/lib/eggs";

/**
 * Renders one egg from the sprite sheet.
 *
 * Every sheet is 1536×1024 = a 3×2 grid of 512×512 **square** cells.
 * The container must therefore be square too, or neighboring cells
 * bleed into the frame. `background-size: 300% 200%` + the standard
 * percentage positioning trick isolates exactly one cell.
 *
 * The art itself is a tall egg centered inside its square cell. We
 * render the full square (so the egg is never cut off) and let the
 * transparent padding sit around it; callers that need a tighter
 * visual box can pass a smaller `size`.
 */
export function Egg({
  egg,
  size = 300,
  width,
  height,
  drift = false,
  className = "",
  style,
  eager = false,
}: {
  egg: EggId | EggCatalogEntry;
  size?: number;
  width?: number;
  height?: number;
  /** Subtle idle motion. Off by default — brief says use sparingly. */
  drift?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** Hint for the loader — the hero egg sets this true. */
  eager?: boolean;
}) {
  const e = typeof egg === "string" ? eggById(egg) : egg;
  // Match the sprite's square cell aspect. If a caller passes custom
  // width/height they override; otherwise size === both dimensions.
  const w = width ?? size;
  const h = height ?? size;
  const posX = e.col * 50;
  const posY = e.row * 100;

  return (
    <div
      className={`inline-block ${drift ? "egg-drift pause-when-offscreen" : ""} ${className}`}
      style={{
        width: w,
        height: h,
        backgroundImage: `url(${e.sheet})`,
        backgroundSize: "300% 200%",
        backgroundPosition: `${posX}% ${posY}%`,
        backgroundRepeat: "no-repeat",
        ...style,
      }}
      role="img"
      aria-label={`${e.name} egg`}
      {...(eager ? { "data-eager": "true" } : {})}
    />
  );
}

/**
 * Preloads the sheet image. Call once near the viewer that will swap eggs,
 * so the next egg's sheet is already in cache before the crossfade.
 */
export function preloadEgg(e: EggCatalogEntry) {
  if (typeof window === "undefined") return;
  const img = new window.Image();
  img.src = e.sheet;
}
