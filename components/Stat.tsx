export function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: "violet" | "cyan" | "rose" | "amber";
}) {
  const accentClass =
    accent === "cyan"
      ? "text-glow-cyan"
      : accent === "rose"
        ? "text-glow-rose"
        : accent === "amber"
          ? "text-glow-amber"
          : "text-glow-violet";
  return (
    <div className="glass p-4">
      <div className="kbd">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${accentClass}`}>{value}</div>
      {sub && <div className="text-xs text-white/50 mt-1">{sub}</div>}
    </div>
  );
}

export function Bar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs text-white/60">
          <span>{label}</span>
          <span>{Math.round(value * 100)}%</span>
        </div>
      )}
      <div className="progress">
        <span style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
      </div>
    </div>
  );
}
