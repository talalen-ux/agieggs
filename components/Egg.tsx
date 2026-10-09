"use client";

import type { EggCatalogEntry, EggId } from "@/lib/eggs";
import { eggById } from "@/lib/eggs";

/**
 * Renders one egg from the sprite sheet.
 *
 * The sheets are 3×2 grids. We set `background-size: 300% 200%` so the
 * sheet is 3× as wide as the container, then use the standard
 * background-position percentage trick to show exactly one cell.
 */
export function Egg({
  egg,
  size = 300,
  width,
  height,
  float = false,
  className = "",
  style,
}: {
  egg: EggId | EggCatalogEntry;
  size?: number;
  width?: number;
  height?: number;
  float?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const e = typeof egg === "string" ? eggById(egg) : egg;
  const w = width ?? size;
  const h = height ?? Math.round((size * 4) / 3); // eggs are slightly taller than wide
  const posX = e.col * 50; // 0, 50, 100
  const posY = e.row * 100; // 0, 100
  return (
    <div
      className={`inline-block ${float ? "animate-float" : ""} ${className}`}
      style={{
        width: w,
        height: h,
        backgroundImage: `url(${e.sheet})`,
        backgroundSize: "300% 200%",
        backgroundPosition: `${posX}% ${posY}%`,
        backgroundRepeat: "no-repeat",
        // soft drop shadow so the egg sits on the canvas without a hard outline
        filter: "drop-shadow(0 24px 24px rgba(0,0,0,0.08))",
        ...style,
      }}
      role="img"
      aria-label={`${e.name} egg`}
    />
  );
}
