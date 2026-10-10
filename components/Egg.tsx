"use client";

import type { EggCatalogEntry, EggId } from "@/lib/eggs";
import { eggById, eggSrc } from "@/lib/eggs";

/**
 * Renders one egg.
 *
 * We ship each egg as its own pre-trimmed webp in /public/eggs/single/
 * (see /public/eggs/slice.sh). That means zero cell-bleed from neighbors,
 * no need for sprite positioning, and the browser can lazy-load each file
 * individually. object-fit: contain keeps every egg centered inside its
 * square container regardless of its actual trimmed aspect.
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
  /** Hint for the loader — the hero egg should set this true. */
  eager?: boolean;
}) {
  const e = typeof egg === "string" ? eggById(egg) : egg;
  const w = width ?? size;
  const h = height ?? size;

  return (
    <img
      src={eggSrc(e)}
      alt={`${e.name} egg`}
      width={w}
      height={h}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={`inline-block select-none ${drift ? "egg-drift pause-when-offscreen" : ""} ${className}`}
      style={{
        width: w,
        maxWidth: "100%",
        // height follows width so a narrow container shrinks the egg
        // proportionally instead of leaving empty bands above and below
        height: "auto",
        aspectRatio: `${w} / ${h}`,
        objectFit: "contain",
        objectPosition: "center",
        ...style,
      }}
    />
  );
}

/**
 * Preloads one egg's artwork. Call near a viewer that will swap to this
 * egg so there is no blank frame on crossfade.
 */
export function preloadEgg(e: EggCatalogEntry | EggId) {
  if (typeof window === "undefined") return;
  const img = new window.Image();
  img.src = eggSrc(e);
}
