"use client";

import type { Pet, Trait } from "@/lib/types";

/**
 * Pet orb — the hatched pet's visual identity.
 *
 * Rendered with CSS so it works everywhere. The hue is seeded by the trait
 * seed; the mouth/eyes shift with warmth and discipline; mythic traits add
 * a soft shimmer. In degraded mode it desaturates and dims.
 */
export function Pet3D({
  pet,
  size = 240,
}: {
  pet: Pet;
  size?: number;
}) {
  const t = pet.traits;
  const bg = `radial-gradient(circle at 30% 25%, hsl(${t.hue} 72% 72%), hsl(${
    (t.hue + 60) % 360
  } 60% 42%) 70%, #111 100%)`;
  const overlay = patternFor(t);
  return (
    <div
      className={`pet-orb animate-breathe ${pet.degraded ? "degraded" : ""}`}
      style={{ width: size, height: size, background: bg }}
    >
      <div
        className="absolute inset-0 rounded-full mix-blend-overlay pointer-events-none"
        style={{ background: overlay, opacity: 0.65 }}
      />
      <div className="pet-face">
        <div className="pet-eyes">
          <div className="pet-eye" />
          <div className="pet-eye" />
        </div>
        <div
          className="pet-mouth"
          style={{
            transform: t.warmth > 60 ? "scaleY(1)" : "scaleY(0.55)",
          }}
        />
      </div>
      {t.rarity === "mythic" && (
        <div
          className="absolute inset-0 rounded-full shimmer pointer-events-none"
          style={{ borderRadius: "inherit" }}
        />
      )}
    </div>
  );
}

function patternFor(t: Trait): string {
  switch (t.pattern) {
    case "speckled":
      return `radial-gradient(circle at 22% 30%, rgba(255,255,255,0.3) 0 1.5px, transparent 2px),
              radial-gradient(circle at 70% 60%, rgba(255,255,255,0.3) 0 1.5px, transparent 2px),
              radial-gradient(circle at 40% 80%, rgba(255,255,255,0.2) 0 1px, transparent 2px)`;
    case "striped":
      return `repeating-linear-gradient(${t.hue}deg, rgba(255,255,255,0.12) 0 8px, transparent 8px 18px)`;
    case "iridescent":
      return `conic-gradient(from ${t.hue}deg, rgba(255,255,255,0.2), rgba(205,255,74,0.25), rgba(255,255,255,0.1), rgba(205,255,74,0.2))`;
    case "void":
      return `radial-gradient(circle at 50% 50%, rgba(0,0,0,0.7) 0%, transparent 60%)`;
    default:
      return "transparent";
  }
}
