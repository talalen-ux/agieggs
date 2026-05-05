"use client";

import type { Pet, Trait } from "@/lib/types";

// Pure-CSS "3D" pet orb. Color, pattern, and blink rhythm are derived from traits,
// so two pets never feel identical. Replace with three.js later — interface stays the same.
export function Pet3D({
  pet,
  size = 280,
}: {
  pet: Pet;
  size?: number;
}) {
  const t = pet.traits;
  const bg = makeGradient(t);
  const overlay = makePattern(t);
  const eyeStyle = {
    transform: `translateY(${t.discipline > 60 ? "0" : "1px"})`,
    opacity: pet.degraded ? 0.3 : 1,
  };
  const blinkSpeed = `${4 + ((100 - t.curiosity) / 25)}s`;

  return (
    <div
      className={`pet-orb ${pet.degraded ? "degraded" : ""} animate-breathe`}
      style={{ width: size, height: size, background: bg }}
    >
      <div
        className="absolute inset-0 rounded-full mix-blend-overlay"
        style={{ background: overlay, opacity: 0.7 }}
      />
      <div className="pet-face">
        <div
          className="pet-eyes"
          style={{ animation: `pulse_glow ${blinkSpeed} ease-in-out infinite` }}
        >
          <div className="pet-eye" style={eyeStyle} />
          <div className="pet-eye" style={eyeStyle} />
        </div>
        <div
          className="pet-mouth"
          style={{
            transform: t.warmth > 60 ? "scaleY(1)" : "scaleY(0.6)",
            opacity: pet.degraded ? 0.3 : 1,
          }}
        />
      </div>
      {t.rarity === "mythic" && (
        <div className="absolute inset-0 rounded-full pointer-events-none animate-float">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-glow-amber blur-[1px]" />
          <div className="absolute top-1/3 -right-2 w-1.5 h-1.5 rounded-full bg-glow-cyan blur-[1px]" />
          <div className="absolute bottom-2 left-2 w-1 h-1 rounded-full bg-glow-rose blur-[1px]" />
        </div>
      )}
    </div>
  );
}

function makeGradient(t: Trait): string {
  const h1 = t.hue;
  const h2 = (t.hue + 60 + t.weirdness) % 360;
  const sat = 65 + Math.floor(t.warmth / 4);
  const light1 = 60;
  const light2 = 30;
  return `radial-gradient(circle at 30% 25%, hsl(${h1} ${sat}% ${light1}%) 0%, hsl(${h2} ${sat}% ${light2}%) 70%, #0b0d14 100%)`;
}

function makePattern(t: Trait): string {
  switch (t.pattern) {
    case "speckled":
      return `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.18) 0 1.5px, transparent 2px),
              radial-gradient(circle at 70% 60%, rgba(255,255,255,0.18) 0 1.5px, transparent 2px),
              radial-gradient(circle at 40% 80%, rgba(255,255,255,0.12) 0 1.5px, transparent 2px)`;
    case "striped":
      return `repeating-linear-gradient(${t.hue}deg, rgba(255,255,255,0.08) 0 8px, transparent 8px 18px)`;
    case "iridescent":
      return `conic-gradient(from ${t.hue}deg, rgba(255,255,255,0.12), rgba(126,232,255,0.18), rgba(255,142,197,0.18), rgba(255,255,255,0.12))`;
    case "void":
      return `radial-gradient(circle at 50% 50%, rgba(0,0,0,0.6) 0%, transparent 60%)`;
    default:
      return "transparent";
  }
}
