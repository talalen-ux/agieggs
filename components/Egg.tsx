"use client";

import type { EggCatalogEntry, EggId } from "@/lib/eggs";
import { eggById } from "@/lib/eggs";

/**
 * Renders one egg from the sprite sheet. Backed by background-image on a
 * fixed-aspect box so no layout shifts — we reserve dimensions up front.
 *
 * The sheets are 3×2 grids. background-size: 300% 200% + the standard
 * percentage trick shows exactly one cell.
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
  const w = width ?? size;
  const h = height ?? Math.round((size * 4) / 3);
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
        // Transparent edges — the sheet art has clean transparency.
        ...style,
      }}
      role="img"
      aria-label={`${e.name} egg`}
      // encourage the browser to pull the hero sheet eagerly
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
