"use client";

export type EggVariant = "shell" | "smoke" | "ink" | "lime" | "blush";

/**
 * The hero egg. Pure CSS/SVG — looks like a scientific scan of a ceramic egg
 * with a lime seam. Ruler ticks + label pins are rendered as absolutely
 * positioned siblings so callers can show/hide them per screen.
 */
export function Egg({
  variant = "shell",
  width = 380,
  height = 500,
  rulers = false,
  shimmer = false,
  label,
  className = "",
}: {
  variant?: EggVariant;
  width?: number;
  height?: number;
  rulers?: boolean;
  shimmer?: boolean;
  label?: string;
  className?: string;
}) {
  const alt = variant === "shell" ? "" : `alt-${variant}`;
  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ width, height }}
    >
      {rulers && <Rulers width={width} height={height} />}
      <div
        className={`egg-shell ${alt} animate-breathe`}
        style={
          {
            width,
            height,
            "--egg-w": `${width}px`,
            "--egg-h": `${height}px`,
          } as React.CSSProperties
        }
      >
        {shimmer && (
          <div
            className="absolute inset-0 shimmer"
            style={{ borderRadius: "inherit" }}
          />
        )}
      </div>
      {label && (
        <div
          className="pin absolute left-1/2 -translate-x-1/2"
          style={{ bottom: -32 }}
        >
          <span>{label}</span>
        </div>
      )}
    </div>
  );
}

function Rulers({ width, height }: { width: number; height: number }) {
  const w = width + 48;
  const h = height + 48;
  const tickCount = 32;
  return (
    <svg
      className="absolute pointer-events-none"
      style={{ inset: -24 }}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
    >
      {/* vertical left + right rules */}
      {Array.from({ length: tickCount }).map((_, i) => {
        const y = 10 + (i * (h - 20)) / (tickCount - 1);
        const long = i % 4 === 0;
        return (
          <g key={`v${i}`} stroke="#0A0A0A" strokeWidth={0.75} opacity={0.7}>
            <line x1={2} y1={y} x2={long ? 10 : 6} y2={y} />
            <line x1={w - 2} y1={y} x2={w - (long ? 10 : 6)} y2={y} />
          </g>
        );
      })}
      {/* horizontal top + bottom rules */}
      {Array.from({ length: tickCount }).map((_, i) => {
        const x = 10 + (i * (w - 20)) / (tickCount - 1);
        const long = i % 4 === 0;
        return (
          <g key={`h${i}`} stroke="#0A0A0A" strokeWidth={0.75} opacity={0.7}>
            <line x1={x} y1={2} x2={x} y2={long ? 10 : 6} />
            <line x1={x} y1={h - 2} x2={x} y2={h - (long ? 10 : 6)} />
          </g>
        );
      })}
      {/* orbit outline */}
      <ellipse
        cx={w / 2}
        cy={h / 2}
        rx={w / 2 - 16}
        ry={h / 2 - 16}
        stroke="#0A0A0A"
        strokeDasharray="2 4"
        strokeWidth={0.6}
        opacity={0.35}
      />
    </svg>
  );
}
